// MeetPad - Background Service Worker

console.log('MeetPad - Background Service Worker Started');

// Track active meetings
const activeMeetings = new Map();

/**
 * Handle extension icon click - Open side panel
 */
chrome.action.onClicked.addListener(async (tab) => {
  console.log('Extension icon clicked - opening side panel');
  try {
    await chrome.sidePanel.open({ windowId: tab.windowId });
    console.log('Side panel opened successfully');
  } catch (error) {
    console.error('Error opening side panel:', error);
  }
});

/**
 * Installation and update handler
 */
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Extension installed/updated:', details.reason);

  if (details.reason === 'install') {
    // First time installation
    chrome.storage.local.set({
      notesHistory: [],
      settings: {
        autoSave: true,
        defaultTemplate: 'general',
        notifications: true,
        autoOpenPopup: true
      }
    });

    // Open welcome page
    chrome.tabs.create({ url: 'welcome.html' });
  } else if (details.reason === 'update') {
    console.log('Extension updated to version', chrome.runtime.getManifest().version);
  }

  // Create context menu
  chrome.contextMenus.create({
    id: 'meetpad-quick-note',
    title: 'Quick Note to MeetPad',
    contexts: ['selection']
  });
});

/**
 * Message handler from content scripts and popup
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message);

  switch (message.action) {
    case 'contentScriptReady':
      handleContentScriptReady(message, sender);
      sendResponse({ status: 'acknowledged' });
      break;

    case 'meetingStatusChanged':
      handleMeetingStatusChanged(message, sender);
      sendResponse({ status: 'acknowledged' });
      break;

    case 'openPopup':
      // Open side panel instead of popup
      chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
        if (tabs[0]) {
          try {
            await chrome.sidePanel.open({ windowId: tabs[0].windowId });
            sendResponse({ status: 'side panel opened' });
          } catch (error) {
            console.error('Error opening side panel:', error);
            sendResponse({ status: 'error', error: error.message });
          }
        }
      });
      return true;

    case 'captureTab':
      captureCurrentTab(sender.tab.id).then(sendResponse);
      return true;

    case 'getActiveMeetings':
      sendResponse(Array.from(activeMeetings.values()));
      break;

    default:
      sendResponse({ error: 'Unknown action' });
  }

  return false;
});

/**
 * Handle content script ready notification
 */
function handleContentScriptReady(message, sender) {
  console.log(`Content script ready on ${message.platform} - ${sender.tab.url}`);

  if (sender.tab) {
    activeMeetings.set(sender.tab.id, {
      tabId: sender.tab.id,
      platform: message.platform,
      url: message.url,
      timestamp: Date.now()
    });
  }
}

/**
 * Handle meeting status changes
 */
async function handleMeetingStatusChanged(message, sender) {
  const { inMeeting, platform, info } = message;

  console.log(`Meeting ${inMeeting ? 'started' : 'ended'} on ${platform}`);

  if (inMeeting && sender.tab) {
    activeMeetings.set(sender.tab.id, {
      tabId: sender.tab.id,
      platform,
      info,
      startTime: Date.now()
    });

    const settings = await chrome.storage.local.get('settings');
    const autoOpenPopup = settings.settings?.autoOpenPopup !== false;

    showNotification('Meeting Started', `MeetPad is ready to capture notes for your ${platform} meeting.`);

    if (autoOpenPopup) {
      try {
        await chrome.tabs.update(sender.tab.id, { active: true });
        const tab = await chrome.tabs.get(sender.tab.id);
        setTimeout(async () => {
          try {
            await chrome.sidePanel.open({ windowId: tab.windowId });
            console.log('Side panel auto-opened for meeting');
          } catch (error) {
            console.error('Error auto-opening side panel:', error);
          }
        }, 500);
      } catch (error) {
        console.error('Error in meeting auto-open:', error);
      }
    }

    updateBadge();
  } else if (sender.tab) {
    const meeting = activeMeetings.get(sender.tab.id);
    if (meeting) {
      const duration = Date.now() - meeting.startTime;
      console.log(`Meeting duration: ${Math.round(duration / 1000 / 60)} minutes`);

      activeMeetings.delete(sender.tab.id);
      updateBadge();

      showNotification('Meeting Ended', 'Don\'t forget to save your meeting notes!');
    }
  }
}

async function captureCurrentTab(tabId) {
  try {
    const dataUrl = await chrome.tabs.captureVisibleTab(null, {
      format: 'png',
      quality: 100
    });
    return { success: true, dataUrl };
  } catch (error) {
    console.error('Error capturing tab:', error);
    return { success: false, error: error.message };
  }
}

async function showNotification(title, message) {
  try {
    const settings = await chrome.storage.local.get('settings');
    if (settings.settings?.notifications === false) return;

    // Use alert style instead of banner on macOS
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title,
      message,
      priority: 2, // Higher priority for alert style
      requireInteraction: false
    });
  } catch (error) {
    console.error('Error showing notification:', error);
  }
}

function updateBadge() {
  const count = activeMeetings.size;

  if (count > 0) {
    chrome.action.setBadgeText({ text: count.toString() });
    chrome.action.setBadgeBackgroundColor({ color: '#4A90E2' });
  } else {
    chrome.action.setBadgeText({ text: '' });
  }
}

chrome.tabs.onRemoved.addListener((tabId) => {
  if (activeMeetings.has(tabId)) {
    console.log('Tab closed, cleaning up meeting:', tabId);
    activeMeetings.delete(tabId);
    updateBadge();
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url && activeMeetings.has(tabId)) {
    const meeting = activeMeetings.get(tabId);
    const url = new URL(changeInfo.url);

    const isMeetingPlatform =
      url.hostname.includes('zoom.us') ||
      url.hostname.includes('meet.google.com') ||
      url.hostname.includes('teams.microsoft.com') ||
      url.hostname.includes('webex.com');

    if (!isMeetingPlatform) {
      console.log('Navigated away from meeting platform');
      activeMeetings.delete(tabId);
      updateBadge();
    }
  }
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'meetpad-quick-note' && info.selectionText) {
    chrome.storage.local.get('currentNotes', (result) => {
      const currentNotes = result.currentNotes || '';
      const timestamp = new Date().toLocaleTimeString();
      const newNote = `\n\n[${timestamp}] ${info.selectionText}`;

      chrome.storage.local.set({
        currentNotes: currentNotes + newNote
      });

      showNotification('Note Added', 'Selected text added to meeting notes');
    });
  }
});

chrome.alarms.create('cleanup', { periodInMinutes: 60 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'cleanup') {
    console.log('Running periodic cleanup');

    const dayAgo = Date.now() - (24 * 60 * 60 * 1000);
    for (const [tabId, meeting] of activeMeetings.entries()) {
      if (meeting.timestamp && meeting.timestamp < dayAgo) {
        activeMeetings.delete(tabId);
      }
    }

    updateBadge();
  }
});



updateBadge();

console.log('Background service worker initialized successfully');

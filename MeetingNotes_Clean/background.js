// MeetingNotes - Background Service Worker

console.log('MeetingNotes - Background Service Worker Started');

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

  // Context menu removed to reduce permissions
  // chrome.contextMenus.create({
  //   id: 'meetingnotes-quick-note',
  //   title: 'Add to MeetingNotes',
  //   contexts: ['selection']
  // });
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
      // Open side panel
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

    case 'testNotification':
      // Test notification to verify permissions are working
      chrome.notifications.create('test-' + Date.now(), {
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'Test Notification',
        message: 'If you see this, desktop notifications are working correctly!',
        priority: 2,
        requireInteraction: true,
        buttons: [{title: 'Great!'}]
      }, (notificationId) => {
        console.log('Test notification created:', notificationId);
        if (chrome.runtime.lastError) {
          console.error('Test notification error:', chrome.runtime.lastError);
          sendResponse({ status: 'error', error: chrome.runtime.lastError.message });
        } else {
          sendResponse({ status: 'success', notificationId });
        }
      });
      return true; // Will respond asynchronously

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
    const autoOpenPlatforms = settings.settings?.autoOpenPlatforms || {};
    const platformEnabled = autoOpenPlatforms[platform] !== false; // Default to true

    console.log(`Auto-open check for ${platform}:`, platformEnabled);

    if (platformEnabled) {
      // Show indicator - user must click to open (Chrome requires user gesture)
      showMeetingDetected(sender.tab.id);
    }
    // Note: No Chrome notifications - we use on-page indicator instead

    updateBadge();
  } else if (sender.tab) {
    const meeting = activeMeetings.get(sender.tab.id);
    if (meeting) {
      const duration = Date.now() - meeting.startTime;
      console.log(`Meeting duration: ${Math.round(duration / 1000 / 60)} minutes`);

      activeMeetings.delete(sender.tab.id);
      updateBadge();

      // No notification on meeting end - less intrusive
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

async function showClickableNotification(title, message, windowId) {
  try {
    console.log('showClickableNotification called with:', { title, message, windowId });

    const settings = await chrome.storage.local.get('settings');
    console.log('Notification settings:', settings.settings?.notifications);

    if (settings.settings?.notifications === false) {
      console.log('Notifications disabled in settings, skipping');
      return;
    }

    // Create clickable notification that opens side panel
    const notificationId = `meeting-${Date.now()}`;
    console.log('Creating notification with ID:', notificationId);

    chrome.notifications.create(notificationId, {
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title,
      message,
      priority: 2,
      requireInteraction: false // Auto-dismiss after a few seconds
      // No buttons - just click the notification itself to open
    }, (createdId) => {
      console.log('Notification created with ID:', createdId);
      if (chrome.runtime.lastError) {
        console.error('Error creating notification:', chrome.runtime.lastError);
      }
    });

    // Store windowId for this notification
    chrome.storage.local.set({ [`notification-${notificationId}`]: windowId });

    console.log('Clickable notification setup complete');
  } catch (error) {
    console.error('Error showing notification:', error);
  }
}

// Notifications removed to reduce permissions
async function showNotification(title, message) {
  // Notifications disabled - permission removed for better user trust
  console.log('Notification (disabled):', title, message);
  // try {
  //   const settings = await chrome.storage.local.get('settings');
  //   if (settings.settings?.notifications === false) return;
  //
  //   chrome.notifications.create({
  //     type: 'basic',
  //     iconUrl: 'icons/icon128.png',
  //     title,
  //     message,
  //     priority: 2,
  //     requireInteraction: false
  //   });
  // } catch (error) {
  //   console.error('Error showing notification:', error);
  // }
}

/**
 * Show meeting detected indicator - user must click to open
 */
async function showMeetingDetected(tabId) {
  console.log('Meeting detected - showing on-page indicator and badge');

  // Set prominent badge on extension icon
  chrome.action.setBadgeText({ text: '!', tabId });
  chrome.action.setBadgeBackgroundColor({ color: '#10B981', tabId });

  // On-page indicator is added by content script
  // User can click either the indicator or the extension icon to open
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

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Emergency fallback: Auto-open on meeting URLs even if content script doesn't fire
  if (changeInfo.status === 'complete' && changeInfo.url) {
    const url = changeInfo.url.toLowerCase();
    let platform = null;

    // Detect platform from URL
    if (url.includes('zoom.us') && (url.includes('/wc/') || url.includes('/j/'))) {
      platform = 'Zoom';
    } else if (url.includes('meet.google.com') && url.split('/').length > 3) {
      platform = 'Google Meet';
    } else if (url.includes('teams.microsoft.com')) {
      platform = 'Microsoft Teams';
    } else if (url.includes('webex.com')) {
      platform = 'Webex';
    }

    if (platform) {
      console.log(`Background: Detected ${platform} meeting URL (fallback detection)`);

      // Check if this meeting is already tracked
      if (!activeMeetings.has(tabId)) {
        console.log(`Background: Adding meeting to active list`);
        activeMeetings.set(tabId, {
          tabId,
          platform,
          url: changeInfo.url,
          startTime: Date.now()
        });

        // Check settings and auto-open
        const settings = await chrome.storage.local.get('settings');
        const autoOpenPlatforms = settings.settings?.autoOpenPlatforms || {};
        const platformEnabled = autoOpenPlatforms[platform] !== false;

        console.log(`Background: Auto-open check for ${platform}:`, platformEnabled);

        if (platformEnabled) {
          setTimeout(async () => {
            try {
              await chrome.sidePanel.open({ windowId: tab.windowId });
              console.log('Background: Side panel auto-opened (fallback)');
            } catch (error) {
              console.error('Background: Error auto-opening side panel:', error);
            }
          }, 1000); // Wait 1 second for page to load
        }

        updateBadge();
      }
    }
  }

  // Clean up if navigated away
  if (changeInfo.url && activeMeetings.has(tabId)) {
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

// Notification handler removed - notifications disabled to reduce permissions
// chrome.notifications.onClicked.addListener(async (notificationId) => {
//   console.log('Notification clicked:', notificationId);
//   chrome.notifications.clear(notificationId);
//   chrome.storage.local.remove(`notification-${notificationId}`);
// });

// Context menu handler - Removed to reduce permissions
// chrome.contextMenus.onClicked.addListener((info, tab) => {
//   if (info.menuItemId === 'meetingnotes-quick-note' && info.selectionText) {
//     chrome.storage.local.get('currentNotes', (result) => {
//       const currentNotes = result.currentNotes || '';
//       const timestamp = new Date().toLocaleTimeString();
//       const newNote = `\n\n[${timestamp}] ${info.selectionText}`;
//
//       chrome.storage.local.set({
//         currentNotes: currentNotes + newNote
//       });
//
//       showNotification('Note Added', 'Selected text added to meeting notes');
//     });
//   }
// });

// Alarms removed to reduce permissions
// chrome.alarms.create('cleanup', { periodInMinutes: 60 });

// chrome.alarms.onAlarm.addListener((alarm) => {
//   if (alarm.name === 'cleanup') {
//     console.log('Running periodic cleanup');
//
//     const dayAgo = Date.now() - (24 * 60 * 60 * 1000);
//     for (const [tabId, meeting] of activeMeetings.entries()) {
//       if (meeting.timestamp && meeting.timestamp < dayAgo) {
//         activeMeetings.delete(tabId);
//       }
//     }
//
//     updateBadge();
//   }
// });



updateBadge();

console.log('Background service worker initialized successfully');

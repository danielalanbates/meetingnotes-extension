// BatesAI Meeting Notes - Content Script
// Injected into meeting platforms (Zoom, Teams, Google Meet, Webex)

console.log('BatesAI Meeting Notes Extension - Content Script Loaded');

// Detect current platform
const platform = detectPlatform();
console.log('Platform detected:', platform);

// Initialize extension
if (platform) {
  initializeExtension(platform);
}

/**
 * Detect which meeting platform we're on
 */
function detectPlatform() {
  const hostname = window.location.hostname;

  if (hostname.includes('zoom.us')) return 'zoom';
  if (hostname.includes('meet.google.com')) return 'google-meet';
  if (hostname.includes('teams.microsoft.com')) return 'teams';
  if (hostname.includes('webex.com')) return 'webex';

  return null;
}

/**
 * Initialize extension for the detected platform
 */
function initializeExtension(platform) {
  console.log(`Initializing BatesAI for ${platform}`);

  // Wait for page to be fully loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setupPlatform(platform));
  } else {
    setupPlatform(platform);
  }
}

/**
 * Setup platform-specific features
 */
function setupPlatform(platform) {
  // Add a subtle indicator that extension is active
  addExtensionIndicator(platform);

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Content script received message:', message);

    switch (message.action) {
      case 'getMeetingInfo':
        sendResponse(getMeetingInfo(platform));
        break;
      case 'captureScreenshot':
        captureScreenshot().then(sendResponse);
        return true; // Keep channel open for async response
      case 'extractParticipants':
        sendResponse(extractParticipants(platform));
        break;
      default:
        sendResponse({ error: 'Unknown action' });
    }
  });

  // Monitor for meeting events
  setupMeetingMonitor(platform);
}

/**
 * Add a subtle indicator that extension is active
 */
function addExtensionIndicator(platform) {
  // Only add if not already present
  if (document.getElementById('batesai-indicator')) return;

  const indicator = document.createElement('div');
  indicator.id = 'batesai-indicator';
  indicator.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: linear-gradient(135deg, #4A90E2 0%, #357ABD 100%);
    color: white;
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 12px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 999999;
    cursor: pointer;
    transition: all 0.3s ease;
    opacity: 0.9;
  `;
  indicator.textContent = ' BatesAI Notes Active';

  // Fade out after 3 seconds
  setTimeout(() => {
    indicator.style.opacity = '0';
    setTimeout(() => indicator.remove(), 300);
  }, 3000);

  // Click to open extension
  indicator.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'openPopup' });
  });

  document.body.appendChild(indicator);
}

/**
 * Get meeting information based on platform
 */
function getMeetingInfo(platform) {
  const info = {
    platform,
    url: window.location.href,
    timestamp: new Date().toISOString()
  };

  switch (platform) {
    case 'zoom':
      info.title = document.querySelector('.meeting-topic')?.textContent || 'Zoom Meeting';
      info.meetingId = extractZoomMeetingId();
      break;

    case 'google-meet':
      info.title = document.querySelector('[data-meeting-title]')?.textContent ||
                   document.title.replace(' - Google Meet', '') ||
                   'Google Meet';
      info.meetingCode = window.location.pathname.split('/').pop();
      break;

    case 'teams':
      info.title = document.querySelector('.ts-calling-screen h2')?.textContent ||
                   'Microsoft Teams Meeting';
      break;

    case 'webex':
      info.title = document.querySelector('.meeting-info__topic')?.textContent ||
                   'Webex Meeting';
      break;
  }

  return info;
}

/**
 * Extract Zoom meeting ID from URL or page
 */
function extractZoomMeetingId() {
  const urlMatch = window.location.pathname.match(/\/j\/(\d+)/);
  if (urlMatch) return urlMatch[1];

  const pageMatch = document.body.textContent.match(/Meeting ID[:\s]+(\d{3}[\s-]\d{3}[\s-]\d{4})/);
  if (pageMatch) return pageMatch[1];

  return null;
}

/**
 * Extract participants based on platform
 */
function extractParticipants(platform) {
  const participants = [];

  try {
    switch (platform) {
      case 'zoom':
        // Zoom participants list
        document.querySelectorAll('.participants-item__display-name').forEach(el => {
          participants.push(el.textContent.trim());
        });
        break;

      case 'google-meet':
        // Google Meet participants
        document.querySelectorAll('[data-participant-id]').forEach(el => {
          const name = el.querySelector('[data-self-name]')?.textContent;
          if (name) participants.push(name.trim());
        });
        break;

      case 'teams':
        // Microsoft Teams participants
        document.querySelectorAll('.participant-name').forEach(el => {
          participants.push(el.textContent.trim());
        });
        break;

      case 'webex':
        // Webex participants
        document.querySelectorAll('.participant-list-item__name').forEach(el => {
          participants.push(el.textContent.trim());
        });
        break;
    }
  } catch (error) {
    console.error('Error extracting participants:', error);
  }

  return {
    count: participants.length,
    participants: participants.filter((v, i, a) => a.indexOf(v) === i) // Remove duplicates
  };
}

/**
 * Capture screenshot of meeting
 */
async function captureScreenshot() {
  try {
    // Request screenshot from background script
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'captureTab' }, (response) => {
        resolve(response);
      });
    });
  } catch (error) {
    console.error('Error capturing screenshot:', error);
    return { error: error.message };
  }
}

/**
 * Setup meeting monitor for events
 */
function setupMeetingMonitor(platform) {
  // Monitor for meeting start/end
  let wasInMeeting = checkIfInMeeting(platform);

  setInterval(() => {
    const inMeeting = checkIfInMeeting(platform);

    if (inMeeting !== wasInMeeting) {
      wasInMeeting = inMeeting;

      // Notify background script
      chrome.runtime.sendMessage({
        action: 'meetingStatusChanged',
        inMeeting,
        platform,
        info: getMeetingInfo(platform)
      });

      console.log('Meeting status changed:', inMeeting ? 'Started' : 'Ended');
    }
  }, 5000); // Check every 5 seconds
}

/**
 * Check if currently in a meeting
 */
function checkIfInMeeting(platform) {
  switch (platform) {
    case 'zoom':
      // Check if in meeting view
      return !!document.querySelector('.meeting-client-inner') ||
             !!document.querySelector('.footer__btns-container');

    case 'google-meet':
      // Check if in call
      return !!document.querySelector('[data-is-in-call="true"]') ||
             window.location.pathname.length > 5;

    case 'teams':
      // Check if in call interface
      return !!document.querySelector('.ts-calling-screen') ||
             !!document.querySelector('[data-tid="call-canvas"]');

    case 'webex':
      // Check if in meeting
      return !!document.querySelector('.meeting-window') ||
             !!document.querySelector('.meeting-client');

    default:
      return false;
  }
}

/**
 * Keyboard shortcut listener
 */
document.addEventListener('keydown', (e) => {
  // Ctrl/Cmd + Shift + N to quickly open notes
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'N') {
    e.preventDefault();
    chrome.runtime.sendMessage({ action: 'openPopup' });
  }
});

// Notify background that content script is ready
chrome.runtime.sendMessage({
  action: 'contentScriptReady',
  platform,
  url: window.location.href
});

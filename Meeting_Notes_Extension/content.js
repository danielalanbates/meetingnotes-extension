// MeetingNotes - Content Script
// Injected into eligible meeting platforms and generic media pages

if (window !== window.top) {
  // Only run in top frame to reduce noise
  return;
}

console.log('MeetingNotes Extension - Content Script Loaded');

const MEETING_HOST_KEYWORDS = [
  'zoom',
  'meet',
  'teams',
  'webex',
  'whereby',
  'bluejeans',
  'gotomeeting',
  'ringcentral',
  'skype',
  'slack',
  'dialpad',
  'chime'
];

const MEETING_TITLE_KEYWORDS = [
  'meeting',
  'call',
  'standup',
  'retro',
  'scrum',
  'huddle',
  'catch-up'
];

// Detect current platform
const platform = detectPlatform();
console.log('Platform detected:', platform || 'none');

// Initialize extension
if (platform) {
  initializeExtension(platform);
} else {
  console.log('MeetingNotes content script exiting – no meeting signals.');
  chrome.runtime.sendMessage({ action: 'contentScriptSkipped', url: window.location.href }).catch(() => {});
  return;
}

/**
 * Detect which meeting platform we're on
 */
function detectPlatform() {
  const hostname = window.location.hostname.toLowerCase();

  if (hostname.includes('zoom.us')) return 'zoom';
  if (hostname.includes('meet.google.com')) return 'google-meet';
  if (hostname.includes('teams.microsoft.com')) return 'teams';
  if (hostname.includes('webex.com')) return 'webex';

  if (MEETING_HOST_KEYWORDS.some(keyword => hostname.includes(keyword))) {
    return 'generic';
  }

  if (hasPotentialMeetingSignals()) {
    return 'generic';
  }

  return null;
}

/**
 * Initialize extension for the detected platform
 */
function initializeExtension(platform) {
  console.log(`Initializing MeetingNotes for ${platform}`);

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
      case 'EXTRACT_ATTENDEES':
        sendResponse(extractAttendeeEmails(message.platform || platform));
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
  indicator.textContent = '✓ BatesAI Notes Active';

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
  let wasInMeeting = isMeetingActive(platform);

  setInterval(() => {
    const inMeeting = isMeetingActive(platform);

    if (inMeeting !== wasInMeeting) {
      wasInMeeting = inMeeting;
      chrome.runtime.sendMessage({
        action: 'meetingStatusChanged',
        inMeeting,
        platform,
        info: getMeetingInfo(platform)
      });

      console.log('Meeting status changed:', inMeeting ? 'Started' : 'Ended');
    }
  }, 4000);
}

function isMeetingActive(platform) {
  switch (platform) {
    case 'zoom':
      // Check for Zoom meeting by URL pattern (works for web client)
      const zoomInMeeting = window.location.pathname.includes('/j/') ||
                           window.location.hash.includes('#success') ||
                           Boolean(document.querySelector('.meeting-client-inner') ||
                                  document.querySelector('.footer__btns-container') ||
                                  document.querySelector('[class*="meeting"]') ||
                                  document.querySelector('#wc-container'));
      return zoomInMeeting;
    case 'google-meet':
      // Google Meet meeting code in URL means in meeting
      const meetInMeeting = (window.location.pathname.length > 5 && window.location.pathname !== '/landing') ||
                           Boolean(document.querySelector('[data-is-in-call="true"]') ||
                                  document.querySelector('[class*="call"]'));
      return meetInMeeting;
    case 'teams':
      // Teams meeting URL patterns
      const teamsInMeeting = window.location.pathname.includes('/meet') ||
                            window.location.pathname.includes('/calling') ||
                            Boolean(document.querySelector('.ts-calling-screen') ||
                                   document.querySelector('[data-tid="call-canvas"]'));
      return teamsInMeeting;
    case 'webex':
      return Boolean(document.querySelector('.meeting-window') || document.querySelector('.meeting-client'));
    default:
      return detectActiveMediaElements();
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

function hasPotentialMeetingSignals() {
  const title = document.title.toLowerCase();
  if (MEETING_TITLE_KEYWORDS.some(keyword => title.includes(keyword))) {
    return true;
  }

  if (detectActiveMediaElements(true)) {
    return true;
  }

  return false;
}

function detectActiveMediaElements(includeIdle = false) {
  const videos = Array.from(document.querySelectorAll('video'));
  const audios = Array.from(document.querySelectorAll('audio'));

  if (!videos.length && !audios.length) {
    return false;
  }

  const isActive = (media) => {
    if (media.readyState >= 2 && !media.paused) return true;
    if (media.muted && includeIdle) return true;
    if (includeIdle && media.currentTime > 0) return true;
    return false;
  };

  if (videos.some(isActive) || audios.some(isActive)) {
    return true;
  }

  // As a fallback, treat presence of at least one media element as signal when includeIdle flag is set
  return includeIdle && (videos.length > 0 || audios.length > 0);
}

/**
 * Extract attendee email addresses based on platform
 * This function attempts to extract email addresses from the DOM
 */
function extractAttendeeEmails(platform) {
  const emails = [];

  try {
    switch (platform) {
      case 'zoom':
        // Try to extract from participant list tooltips or data attributes
        document.querySelectorAll('.participants-item').forEach(el => {
          const email = el.getAttribute('data-participant-email') ||
                       el.querySelector('[data-participant-email]')?.getAttribute('data-participant-email');
          if (email && isValidEmail(email)) {
            emails.push(email);
          }
        });
        break;

      case 'google-meet':
        // Google Meet sometimes shows emails in participant details
        document.querySelectorAll('[data-participant-id]').forEach(el => {
          const email = el.getAttribute('data-participant-email') ||
                       el.querySelector('[aria-label*="@"]')?.getAttribute('aria-label')?.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0];
          if (email && isValidEmail(email)) {
            emails.push(email);
          }
        });

        // Also check for emails in tooltips
        document.querySelectorAll('[title*="@"]').forEach(el => {
          const match = el.getAttribute('title')?.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
          if (match && isValidEmail(match[0])) {
            emails.push(match[0]);
          }
        });
        break;

      case 'teams':
        // Microsoft Teams participant data
        document.querySelectorAll('[data-tid="roster-participant"]').forEach(el => {
          const email = el.getAttribute('data-participant-email') ||
                       el.querySelector('[data-participant-email]')?.textContent?.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0];
          if (email && isValidEmail(email)) {
            emails.push(email);
          }
        });
        break;

      case 'webex':
        // Webex participant data
        document.querySelectorAll('.participant-list-item').forEach(el => {
          const email = el.getAttribute('data-email') ||
                       el.querySelector('[data-email]')?.getAttribute('data-email');
          if (email && isValidEmail(email)) {
            emails.push(email);
          }
        });
        break;

      default:
        // Generic email extraction from page content
        // Look for email patterns in data attributes and text content
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

        // Check data attributes
        document.querySelectorAll('[data-email], [data-participant-email], [data-user-email]').forEach(el => {
          const email = el.getAttribute('data-email') ||
                       el.getAttribute('data-participant-email') ||
                       el.getAttribute('data-user-email');
          if (email && isValidEmail(email)) {
            emails.push(email);
          }
        });

        // Check visible text (limit to avoid performance issues)
        const visibleText = Array.from(document.querySelectorAll('[title*="@"], [aria-label*="@"]'))
          .slice(0, 100) // Limit to first 100 elements
          .map(el => (el.getAttribute('title') || el.getAttribute('aria-label') || ''))
          .join(' ');

        const matches = visibleText.match(emailRegex);
        if (matches) {
          matches.forEach(email => {
            if (isValidEmail(email)) {
              emails.push(email);
            }
          });
        }
    }
  } catch (error) {
    console.error('Error extracting attendee emails:', error);
  }

  // Remove duplicates and return
  const uniqueEmails = [...new Set(emails.map(e => e.toLowerCase()))];

  return {
    attendees: uniqueEmails,
    count: uniqueEmails.length
  };
}

/**
 * Validate email address format
 */
function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email.trim());
}

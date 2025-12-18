// MeetingNotes - Content Script
// Injected into eligible meeting platforms and generic media pages

(function() {
  'use strict';

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
  'chime',
  'discord',
  'jitsi',
  'around'
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

  // Specific platform detection
  if (hostname.includes('zoom.us')) return 'Zoom';
  if (hostname.includes('meet.google.com')) return 'Google Meet';
  if (hostname.includes('teams.microsoft.com') || hostname.includes('teams.live.com')) return 'Microsoft Teams';
  if (hostname.includes('webex.com')) return 'Webex';
  if (hostname.includes('whereby.com')) return 'Whereby';
  if (hostname.includes('bluejeans.com')) return 'BlueJeans';
  if (hostname.includes('gotomeeting.com')) return 'GoToMeeting';
  if (hostname.includes('ringcentral.com')) return 'RingCentral';
  if (hostname.includes('skype.com')) return 'Skype';
  if (hostname.includes('slack.com')) return 'Slack';
  if (hostname.includes('dialpad.com')) return 'Dialpad';
  if (hostname.includes('chime.aws')) return 'Amazon Chime';
  if (hostname.includes('discord.com')) return 'Discord';
  if (hostname.includes('jitsi')) return 'Jitsi Meet';
  if (hostname.includes('around.co')) return 'Around';

  // Generic fallback for any meeting platform
  if (MEETING_HOST_KEYWORDS.some(keyword => hostname.includes(keyword))) {
    return 'Video Call';
  }

  // Check for meeting signals (video/audio elements)
  if (hasPotentialMeetingSignals()) {
    return 'Video Call';
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
  if (document.getElementById('meetingnotes-indicator')) return;

  const indicator = document.createElement('div');
  indicator.id = 'meetingnotes-indicator';
  indicator.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #2563eb;
    color: white;
    padding: 10px 18px;
    border-radius: 8px;
    font-size: 13px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-weight: 600;
    box-shadow: 0 4px 16px rgba(37, 99, 235, 0.4);
    z-index: 999999;
    cursor: pointer;
    transition: all 0.2s ease;
    border: 2px solid rgba(255, 255, 255, 0.2);
  `;
  indicator.textContent = '✓ Click to Open MeetingNotes';

  // Add hover effect
  indicator.addEventListener('mouseenter', () => {
    indicator.style.background = '#1d4ed8';
    indicator.style.transform = 'scale(1.05)';
  });

  indicator.addEventListener('mouseleave', () => {
    indicator.style.background = '#2563eb';
    indicator.style.transform = 'scale(1)';
  });

  // Stay visible for 12 seconds
  setTimeout(() => {
    indicator.style.opacity = '0';
    setTimeout(() => indicator.remove(), 300);
  }, 12000);

  // Click to open extension
  indicator.addEventListener('click', () => {
    // Remove indicator immediately when clicked
    indicator.style.opacity = '0';
    setTimeout(() => indicator.remove(), 200);

    // Open the side panel
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
    case 'Zoom':
      info.title = document.querySelector('.meeting-topic')?.textContent || 'Zoom Meeting';
      info.meetingId = extractZoomMeetingId();
      break;

    case 'Google Meet':
      info.title = document.querySelector('[data-meeting-title]')?.textContent ||
                   document.title.replace(' - Google Meet', '') ||
                   'Google Meet';
      info.meetingCode = window.location.pathname.split('/').pop();
      break;

    case 'Microsoft Teams':
      info.title = document.querySelector('.ts-calling-screen h2')?.textContent ||
                   'Microsoft Teams Meeting';
      break;

    case 'Webex':
      info.title = document.querySelector('.meeting-info__topic')?.textContent ||
                   'Webex Meeting';
      break;

    default:
      // For other platforms, use clean platform name
      info.title = `${platform} Meeting`;
      break;
  }

  // Clean up title - remove common taglines and extra text
  if (info.title && info.title.includes('|')) {
    info.title = info.title.split('|')[0].trim();
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
      case 'Zoom':
        // Zoom participants list
        document.querySelectorAll('.participants-item__display-name').forEach(el => {
          participants.push(el.textContent.trim());
        });
        break;

      case 'Google Meet':
        // Google Meet participants
        document.querySelectorAll('[data-participant-id]').forEach(el => {
          const name = el.querySelector('[data-self-name]')?.textContent;
          if (name) participants.push(name.trim());
        });
        break;

      case 'Microsoft Teams':
        // Microsoft Teams participants
        document.querySelectorAll('.participant-name').forEach(el => {
          participants.push(el.textContent.trim());
        });
        break;

      case 'Webex':
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
  console.log(`MeetingNotes: Initial meeting status for ${platform}:`, wasInMeeting);

  // Send initial status if already in meeting
  if (wasInMeeting) {
    console.log('MeetingNotes: Already in meeting, sending initial status');
    chrome.runtime.sendMessage({
      action: 'meetingStatusChanged',
      inMeeting: true,
      platform,
      info: getMeetingInfo(platform)
    });
  }

  // Monitor media devices (mic/camera) for meeting detection
  setInterval(() => {
    const hasActiveMedia = detectActiveMediaDevices();
    const urlBasedDetection = isMeetingActive(platform);
    const inMeeting = hasActiveMedia || urlBasedDetection;

    if (inMeeting !== wasInMeeting) {
      wasInMeeting = inMeeting;
      console.log(`MeetingNotes: Meeting status changed for ${platform}:`, inMeeting ? 'Started' : 'Ended');
      console.log(`MeetingNotes: Active media:`, hasActiveMedia, 'URL detection:', urlBasedDetection);
      chrome.runtime.sendMessage({
        action: 'meetingStatusChanged',
        inMeeting,
        platform,
        info: getMeetingInfo(platform)
      });
    }
  }, 3000); // Check every 3 seconds
}

function isMeetingActive(platform) {
  const url = window.location.href;
  const pathname = window.location.pathname;

  switch (platform) {
    case 'Zoom':
      // Check for Zoom meeting URLs or meeting elements
      const zoomMeetingUrl = url.includes('/wc/') || url.includes('/j/') || pathname.includes('/wc/') || pathname.includes('/j/');
      const zoomElements = Boolean(document.querySelector('.meeting-client-inner') ||
                                   document.querySelector('.footer__btns-container') ||
                                   document.querySelector('[class*="meeting"]') ||
                                   document.querySelector('[class*="in-meeting"]'));
      console.log('MeetingNotes: Zoom detection - URL match:', zoomMeetingUrl, 'Elements:', zoomElements);
      return zoomMeetingUrl || zoomElements;

    case 'Google Meet':
      // Check for Google Meet meeting code in URL (format: meet.google.com/xxx-xxxx-xxx)
      const meetingCode = pathname.match(/^\/[a-z]{3}-[a-z]{4}-[a-z]{3}$/);
      const inCall = Boolean(document.querySelector('[data-is-in-call="true"]'));
      const hasJoinUrl = pathname.length > 5 && pathname !== '/';
      console.log('MeetingNotes: Google Meet detection - Code:', meetingCode, 'InCall:', inCall, 'HasURL:', hasJoinUrl);
      return Boolean(meetingCode || inCall || hasJoinUrl);

    case 'Microsoft Teams':
      // Check for various Teams meeting/call indicators
      const teamsElements = Boolean(
        document.querySelector('.ts-calling-screen') ||
        document.querySelector('[data-tid="call-canvas"]') ||
        document.querySelector('[data-tid="calling-screen"]') ||
        document.querySelector('.calling-screen') ||
        document.querySelector('[class*="call-stage"]') ||
        document.querySelector('[class*="meeting-stage"]') ||
        // Check for video/audio controls (appears in solo calls too)
        document.querySelector('[data-tid="toggle-video"]') ||
        document.querySelector('[data-tid="toggle-mute"]') ||
        // Check URL pattern for meetings
        pathname.includes('/meet') ||
        pathname.includes('/call')
      );

      // Fallback: If we detect active media (video/audio), consider it a meeting
      const hasActiveMedia = detectActiveMediaDevices();

      console.log('MeetingNotes: Teams detection - Elements:', teamsElements, 'Media:', hasActiveMedia);
      return teamsElements || hasActiveMedia;

    case 'Webex':
      const webexElements = Boolean(document.querySelector('.meeting-window') ||
                                    document.querySelector('.meeting-client'));
      return webexElements;

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

function detectActiveMediaDevices() {
  // Check if page is using microphone or camera via navigator.mediaDevices
  // This detects actual active media streams
  const videos = Array.from(document.querySelectorAll('video'));
  const audios = Array.from(document.querySelectorAll('audio'));

  // Check for active video/audio streams
  let hasActiveStream = false;

  videos.forEach(video => {
    if (video.srcObject && video.srcObject.active) {
      hasActiveStream = true;
      console.log('MeetingNotes: Found active video stream');
    }
  });

  audios.forEach(audio => {
    if (audio.srcObject && audio.srcObject.active) {
      hasActiveStream = true;
      console.log('MeetingNotes: Found active audio stream');
    }
  });

  // Also check for playing media elements
  const hasPlayingMedia = videos.some(v => !v.paused && v.readyState >= 2) ||
                         audios.some(a => !a.paused && a.readyState >= 2);

  if (hasPlayingMedia) {
    console.log('MeetingNotes: Found playing media elements');
  }

  return hasActiveStream || hasPlayingMedia;
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
      case 'Zoom':
        // Try to extract from participant list tooltips or data attributes
        document.querySelectorAll('.participants-item').forEach(el => {
          const email = el.getAttribute('data-participant-email') ||
                       el.querySelector('[data-participant-email]')?.getAttribute('data-participant-email');
          if (email && isValidEmail(email)) {
            emails.push(email);
          }
        });
        break;

      case 'Google Meet':
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

      case 'Microsoft Teams':
        // Microsoft Teams participant data
        document.querySelectorAll('[data-tid="roster-participant"]').forEach(el => {
          const email = el.getAttribute('data-participant-email') ||
                       el.querySelector('[data-participant-email]')?.textContent?.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0];
          if (email && isValidEmail(email)) {
            emails.push(email);
          }
        });
        break;

      case 'Webex':
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

})(); // End of IIFE

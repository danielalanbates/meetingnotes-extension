# Platform Testing Guide

## ✅ Fixed Issue:
- Removed broken `declarativeContent` code
- No more regex error in console
- Extension should work properly now

## 🎯 How to Test Each Platform

### IMPORTANT: You Must Be IN an Actual Meeting!

The extension only activates when you're **actively in a meeting**, not just on the platform's homepage.

### Detection Methods by Platform:

#### Zoom
**Triggers when:**
- URL contains `/wc/` or `/j/` (meeting URLs)
- OR page has meeting UI elements

**How to test:**
1. Go to `zoom.us/test` - ✅ This works!
2. OR join an actual Zoom meeting

#### Google Meet
**Triggers when:**
- URL has meeting code format: `meet.google.com/xxx-xxxx-xxx`
- OR page has `data-is-in-call="true"` attribute

**How to test:**
1. Click "New Meeting" on meet.google.com
2. OR join an existing meeting link

#### Microsoft Teams
**Triggers when:**
- Page has `.ts-calling-screen` element
- OR page has `[data-tid="call-canvas"]` element

**How to test:**
1. Go to teams.microsoft.com
2. **Join or start an actual Teams call**
3. ❌ Just visiting teams.microsoft.com homepage won't work!

#### Webex
**Triggers when:**
- Page has `.meeting-window` or `.meeting-client` elements

**How to test:**
1. Join an actual Webex meeting
2. Homepage visit won't trigger

#### Other Platforms
Similar logic - need to be **in an active meeting/call** for detection.

## 🔍 Debugging Checklist

If the blue indicator doesn't appear:

### 1. Check Console (F12)
Look for:
```
MeetingNotes Extension - Content Script Loaded
Platform detected: [Platform Name]
Initializing MeetingNotes for [Platform]
MeetingNotes: [Platform] detection - ...
```

### 2. Verify You're in a Meeting
- ✅ Are you in an active call with video/audio controls?
- ❌ Or just on the platform's homepage/chat?

### 3. Check Background Console
1. Go to `chrome://extensions/`
2. Click "service worker" link
3. Look for:
```
Background received message: {action: "meetingStatusChanged", inMeeting: true, ...}
Meeting started on [Platform]
```

### 4. Manual Test
Open DevTools (F12) on the meeting page and run:
```javascript
// Check if content script loaded
console.log('Content script loaded:', typeof detectPlatform !== 'undefined');

// Check platform detection
console.log('Platform:', window.location.hostname);

// Check for meeting elements (Teams example)
console.log('Teams elements:', {
  callingScreen: document.querySelector('.ts-calling-screen'),
  callCanvas: document.querySelector('[data-tid="call-canvas"]')
});
```

## 📋 Testing Checklist

For each platform:
- [ ] Join an actual meeting (not just homepage)
- [ ] Blue indicator appears (top-right)
- [ ] Click indicator → side panel opens
- [ ] Side panel shows "In [Platform] meeting"
- [ ] Can take notes
- [ ] Templates work
- [ ] Export works

## 🚫 Won't Work On:

- Platform homepages (zoom.us, teams.microsoft.com main page)
- Platform settings pages
- Platform chat/messaging (without active call)
- Login pages
- Marketing pages

## ✅ Will Work On:

- Active meeting/call pages
- Meeting lobby/waiting rooms
- During live calls with video/audio
- Test pages (like zoom.us/test)

---

**TL;DR**: You must actually join a meeting for the extension to activate! Just visiting the homepage won't work.

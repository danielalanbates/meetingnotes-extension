# Auto-Open Debugging Guide

## Quick Debug Steps

### 1. Reload the Extension
1. Go to `chrome://extensions/`
2. Find "MeetingNotes"
3. Click the **reload** button (circular arrow icon)

### 2. Check Content Script Console
1. Go to your Zoom or Google Meet URL
2. Press **F12** (or Cmd+Option+I on Mac) to open DevTools
3. Go to the **Console** tab
4. Look for these messages:

**Should see on page load:**
```
MeetingNotes Extension - Content Script Loaded
Platform detected: Zoom (or Google Meet)
Initializing MeetingNotes for Zoom
MeetingNotes: Initial meeting status for Zoom: true
```

**Zoom-specific:**
```
MeetingNotes: Zoom detection - URL match: true Elements: false
```

**Google Meet-specific:**
```
MeetingNotes: Google Meet detection - Code: [object] InCall: false HasURL: true
```

**If already in meeting:**
```
MeetingNotes: Already in meeting, sending initial status
```

### 3. Check Background Service Worker
1. Go to `chrome://extensions/`
2. Find "MeetingNotes"
3. Click **"service worker"** link (under "Inspect views")
4. Look for these messages:

```
Background Service Worker Started
Meeting started on Zoom (or Google Meet)
Auto-open check for Zoom: true
Side panel auto-opened for meeting
```

## Common Issues

### Issue: No console messages at all
**Cause**: Content script not injecting
**Fix**:
- Reload the extension
- Check if URL matches manifest patterns
- For Zoom: Make sure URL contains `zoom.us`
- For Google Meet: Make sure URL is `meet.google.com`

### Issue: "Platform detected: none"
**Cause**: URL doesn't match known platforms
**Fix**: Check if the URL hostname is in the detectPlatform() function

### Issue: "Initial meeting status: false"
**Cause**: Meeting detection logic not finding meeting elements/URL patterns
**Fix**:
- For Zoom: URL should contain `/wc/` or `/j/`
- For Google Meet: URL path should be longer than 5 characters

### Issue: Background worker shows "Auto-open check: false"
**Cause**: Platform toggle is disabled in settings
**Fix**:
1. Open MeetingNotes side panel
2. Click ⚙️ Settings
3. Scroll to "Auto-Open Settings"
4. Make sure the platform toggle is checked (blue)

### Issue: Side panel doesn't open even though everything else works
**Cause**: Chrome side panel API issue or permission problem
**Fix**:
- Restart Chrome
- Check extension permissions
- Try clicking extension icon manually first

## Test URLs

### Zoom
```
https://app.zoom.us/wc/92826943956/join?fromPWA=1&pwd=...
```
Should detect:
- Platform: "Zoom"
- URL match: true (contains `/wc/`)

### Google Meet
```
https://meet.google.com/szi-exkg-fgu
```
Should detect:
- Platform: "Google Meet"
- Meeting code match: true (matches `/xxx-xxxx-xxx` pattern)

## Debug Logging Added

The latest version includes extensive logging:

**Content Script (content.js)**:
- Line 296: Initial meeting status
- Line 300: Already in meeting notification
- Line 314: Meeting status changed
- Line 337: Zoom URL and element detection
- Line 345: Google Meet URL and element detection

**Background Worker (background.js)**:
- Line 122: Meeting started/ended
- Line 136: Auto-open check result
- Line 144: Side panel auto-opened success
- Line 146: Side panel auto-open error

## Quick Test

Run this in the console on a Zoom/Google Meet page:

```javascript
// Check if content script loaded
console.log('Extension loaded:', !!window.MeetingNotes);

// Check platform detection manually
const url = window.location.href;
const pathname = window.location.pathname;
console.log('URL:', url);
console.log('Pathname:', pathname);
console.log('Zoom check:', url.includes('/wc/') || url.includes('/j/'));
console.log('Meet check:', pathname.length > 5);
```

## Expected Flow

1. **Page loads** → Content script injects
2. **Platform detected** → "Zoom" or "Google Meet"
3. **Meeting check runs** → isMeetingActive() returns true
4. **Initial status sent** → If already in meeting
5. **Background receives** → "meetingStatusChanged" message
6. **Settings checked** → Platform toggle verified
7. **Side panel opens** → After 500ms delay

If any step fails, check the corresponding console messages.

---

**Last Updated**: October 25, 2025
**For**: MeetingNotes v1.0.0

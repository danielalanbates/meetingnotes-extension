# MeetingNotes Extension - Debugging Guide

## Quick Fix Applied

**ISSUE FOUND**: The side panel (sidepanel.js) was only checking 4 platforms (Zoom, Google Meet, Teams, Webex) even though the manifest.json and content.js supported 15+ platforms.

**FIX APPLIED**: Updated sidepanel.js to detect all 15 platforms including Jitsi, Whereby, Discord, and others.

---

## How to Debug Platform Detection

### Step 1: Open Chrome DevTools

1. **For the Content Script** (running on meeting pages):
   - Go to the meeting website (e.g., https://meet.jit.si/MeetingNotesTest)
   - Right-click → "Inspect" → Click "Console" tab
   - Look for messages starting with "MeetingNotes Extension"

2. **For the Side Panel** (the notes UI):
   - Click the MeetingNotes extension icon to open the side panel
   - Right-click in the side panel → "Inspect"
   - Click "Console" tab in the new DevTools window

3. **For the Background Script** (service worker):
   - Go to `chrome://extensions/`
   - Find "MeetingNotes" extension
   - Click "Inspect views: service worker"
   - Look at Console tab

### Step 2: Check Console Messages

**Expected messages when working correctly:**

**Content Script Console** (on meeting page):
```
MeetingNotes Extension - Content Script Loaded
Platform detected: Jitsi Meet
Initializing MeetingNotes for Jitsi Meet
Content script ready on Jitsi Meet - https://meet.jit.si/...
```

**Side Panel Console**:
```
MeetingNotes: Checking URL: https://meet.jit.si/MeetingNotesTest
MeetingNotes: Platform detected: Jitsi Meet
```

**Background Console**:
```
MeetingNotes - Background Service Worker Started
Content script ready on Jitsi Meet - https://meet.jit.si/...
```

### Step 3: Common Issues and Solutions

#### Issue 1: "No active tab found" in Side Panel Console

**Cause**: The side panel is not detecting the active tab.

**Solution**:
- Make sure the meeting tab is the active (selected) tab when you open the side panel
- Click on the meeting tab first, then click the extension icon

#### Issue 2: Content script says "no meeting signals"

**Cause**: The content script exited early because it didn't detect a platform.

**Solution**:
- Check if the URL is in the manifest.json content_scripts matches list
- Reload the extension: `chrome://extensions/` → Click reload icon
- Refresh the meeting page

#### Issue 3: Side Panel shows "No Meeting Detected" even though you're on a meeting site

**Before the fix**: This happened because sidepanel.js only knew about 4 platforms.

**After the fix**: Should work for all 15 platforms. If still not working:
1. Check the console for "MeetingNotes: Platform detected: none"
2. Verify the URL matches one of the patterns in the detection code
3. Try reloading the extension

#### Issue 4: Extension icon shows but no indicator appears on page

**Cause**: The content script might not have the right selectors for that platform.

**Solution**: This is expected - not all platforms show participant lists or meeting IDs in accessible ways. The extension should still work for note-taking even without participant extraction.

---

## Testing Workflow

### Easy Test (5 minutes)

1. **Load Extension**:
   - Go to `chrome://extensions/`
   - Enable "Developer mode" (top right)
   - Click "Load unpacked"
   - Select the Simple_MeetingNotes folder

2. **Test Jitsi** (easiest, no account needed):
   - Open https://meet.jit.si/MeetingNotesTest
   - Open DevTools Console (F12)
   - Click MeetingNotes extension icon
   - Check side panel shows "In Jitsi Meet meeting"

3. **Check Console Logs**:
   - Meeting page console: Should see "Platform detected: Jitsi Meet"
   - Side panel console: Should see "MeetingNotes: Platform detected: Jitsi Meet"
   - Background console: Should see "Content script ready on Jitsi Meet"

### Full Test (15 minutes)

Use [TEST-PLATFORMS.html](TEST-PLATFORMS.html) and test:
1. Jitsi Meet - https://meet.jit.si/MeetingNotesTest ✅ **BEST FOR TESTING**
2. Whereby - https://whereby.com/meetingnotes-test
3. Discord - https://discord.com/channels/@me (requires account)
4. Google Meet - https://meet.google.com/new (requires account)
5. Microsoft Teams - https://teams.microsoft.com (requires account)

---

## Reload Extension After Changes

**Every time you modify code, you MUST reload the extension:**

1. Go to `chrome://extensions/`
2. Find "MeetingNotes"
3. Click the reload icon (🔄)
4. Refresh any open meeting pages

**Otherwise Chrome will use the old cached code!**

---

## Advanced Debugging

### Check if Content Script is Injected

**In meeting page console, type:**
```javascript
// Check if content script is running
console.log('Content script running?', typeof detectPlatform);
```

If it returns `undefined`, the content script didn't load.

### Manually Trigger Platform Detection

**In side panel console, type:**
```javascript
// Force update meeting status
updateMeetingStatus();
```

This will re-check the current tab and log the detection result.

### Check Extension Permissions

**In background console, type:**
```javascript
// Check permissions
chrome.permissions.getAll((permissions) => {
  console.log('Granted permissions:', permissions);
});
```

Should show: `activeTab`, `storage`, `downloads`, `contextMenus`, `sidePanel`, `tabs`, `notifications`, `alarms`

### Check Content Script Matches

**In background console, type:**
```javascript
// Get manifest
const manifest = chrome.runtime.getManifest();
console.log('Content script matches:', manifest.content_scripts[0].matches);
```

Should show 15+ URL patterns.

---

## Still Not Working?

### Checklist:

- [ ] Extension is loaded in `chrome://extensions/`
- [ ] Developer mode is ON
- [ ] Extension is enabled (toggle is blue)
- [ ] You clicked the reload icon after making changes
- [ ] You refreshed the meeting page after reloading extension
- [ ] You're testing in **browser**, not native app (Zoom app won't work!)
- [ ] The URL matches one of the patterns in manifest.json
- [ ] Chrome DevTools console shows no errors
- [ ] You're on the meeting tab when you open the side panel

### If Still Stuck:

1. **Check for JavaScript Errors**:
   - Open all 3 consoles (content, sidepanel, background)
   - Look for red error messages
   - Report any errors you see

2. **Test with Jitsi First**:
   - Jitsi is the most reliable test platform
   - No account needed
   - No native app to interfere
   - URL: https://meet.jit.si/TestMeetingNotes123

3. **Verify File Structure**:
   ```
   Simple_MeetingNotes/
   ├── manifest.json
   ├── background.js
   ├── content.js
   ├── sidepanel.html
   ├── sidepanel.js
   ├── styles.css
   └── icons/
       ├── icon16.png
       ├── icon32.png
       ├── icon48.png
       └── icon128.png
   ```

---

## What the Fix Changed

### Before Fix:
**sidepanel.js** lines 138-146 only checked:
```javascript
if (url.includes('zoom.us')) platform = 'Zoom';
else if (url.includes('meet.google.com')) platform = 'Google Meet';
else if (url.includes('teams.microsoft.com')) platform = 'Microsoft Teams';
else if (url.includes('webex.com')) platform = 'Webex';
// Missing 11 platforms!
```

### After Fix:
**sidepanel.js** now checks all 15 platforms:
```javascript
if (url.includes('zoom.us')) platform = 'Zoom';
else if (url.includes('meet.google.com')) platform = 'Google Meet';
else if (url.includes('teams.microsoft.com')) platform = 'Microsoft Teams';
else if (url.includes('webex.com')) platform = 'Webex';
else if (url.includes('whereby.com')) platform = 'Whereby';
else if (url.includes('bluejeans.com')) platform = 'BlueJeans';
else if (url.includes('gotomeeting.com')) platform = 'GoToMeeting';
else if (url.includes('ringcentral.com')) platform = 'RingCentral';
else if (url.includes('skype.com')) platform = 'Skype';
else if (url.includes('slack.com')) platform = 'Slack';
else if (url.includes('dialpad.com')) platform = 'Dialpad';
else if (url.includes('chime.aws')) platform = 'Amazon Chime';
else if (url.includes('discord.com')) platform = 'Discord';
else if (url.includes('jitsi') || url.includes('meet.jit.si')) platform = 'Jitsi Meet';
else if (url.includes('around.co')) platform = 'Around';
```

**Also updated the `detectPlatform()` helper function** at line 491 to match.

---

## Success Indicators

✅ **Extension Working Correctly When:**

1. Console shows "Platform detected: [Platform Name]"
2. Side panel shows "In [Platform Name] meeting" with green dot
3. Meeting details section is visible with platform name
4. You can type notes and they auto-save
5. Templates can be applied
6. Export buttons work
7. Theme switching works

---

## Quick Reference: Console Commands

**Test platform detection** (in side panel console):
```javascript
updateMeetingStatus();
```

**Check current notes** (in side panel console):
```javascript
chrome.storage.local.get(['currentNotes'], (result) => {
  console.log('Current notes:', result.currentNotes);
});
```

**Check settings** (in side panel console):
```javascript
chrome.storage.local.get(['settings'], (result) => {
  console.log('Settings:', result.settings);
});
```

**Clear all data** (in side panel console):
```javascript
chrome.storage.local.clear(() => {
  console.log('All data cleared');
});
```

---

**Last Updated**: 2025-10-25
**Version**: 1.0.0 (with 15-platform detection fix)

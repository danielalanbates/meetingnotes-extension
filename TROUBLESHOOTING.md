# MeetingNotes - Troubleshooting Guide

## Auto-Open Not Working

If the side panel doesn't automatically open when you join a meeting, try these steps:

### 1. Reload the Extension
1. Go to `chrome://extensions/`
2. Find "MeetingNotes"
3. Click the reload icon (circular arrow)
4. Try joining a meeting again

### 2. Check Extension Permissions
1. Go to `chrome://extensions/`
2. Click "Details" on MeetingNotes
3. Scroll to "Site access"
4. Ensure it says "On specific sites" or "On all sites"
5. If not, click and select appropriate permissions

### 3. Verify Content Script is Running
1. Join a meeting (Zoom, Google Meet, etc.)
2. Open Chrome DevTools (F12 or Cmd+Option+I)
3. Go to the "Console" tab
4. Look for messages like:
   - `MeetingNotes Extension - Content Script Loaded`
   - `Platform detected: Zoom` (or other platform)
   - `Meeting status changed: Started`
5. If you don't see these messages, the content script isn't running

### 4. Check Background Service Worker
1. Go to `chrome://extensions/`
2. Click "Details" on MeetingNotes
3. Click "Inspect views: background page" or "service worker"
4. In the console, look for:
   - `Background Service Worker Started`
   - `Meeting started on [Platform]`
   - `Side panel auto-opened for meeting`

### 5. Manually Enable Auto-Open Setting
The auto-open feature should be enabled by default, but you can verify:
1. Open Chrome DevTools on any page
2. Go to Console
3. Run this command:
```javascript
chrome.storage.local.get('settings', (result) => {
  console.log('Current settings:', result);
});
```
4. Check if `autoOpenPopup: true`
5. If false or missing, enable it:
```javascript
chrome.storage.local.set({
  settings: {
    autoSave: true,
    defaultTemplate: 'general',
    notifications: true,
    autoOpenPopup: true
  }
});
```

### 6. Platform-Specific Selectors May Have Changed
Meeting platforms frequently update their HTML. If auto-open stopped working after a platform update:

**For Zoom:**
- Current selector: `.meeting-client-inner` or `.footer__btns-container`
- Check if these elements exist in the page

**For Google Meet:**
- Current selector: `[data-is-in-call="true"]` or pathname length check
- Verify the element exists when in a call

**For Microsoft Teams:**
- Current selector: `.ts-calling-screen` or `[data-tid="call-canvas"]`

**For Webex:**
- Current selector: `.meeting-window` or `.meeting-client`

To check if selectors exist:
1. Join a meeting
2. Open DevTools Console
3. Run: `document.querySelector('[selector-here]')`
4. If it returns `null`, the selector needs updating

### 7. Clear Extension Storage and Reinstall
If all else fails:
1. Go to `chrome://extensions/`
2. Remove MeetingNotes
3. Close and reopen Chrome
4. Reinstall the extension
5. Test again

## Other Common Issues

### Dark Theme Text Not Visible
**Issue**: Text appears black on dark theme, making it unreadable.

**Solution**:
1. Reload the extension at `chrome://extensions/`
2. If problem persists, check if styles.css has dark theme rules for:
   - `.modal-body`
   - `.quick-btn`
   - `.export-option`
   - `.history-item`

### Templates Not Switching Properly
**Issue**: Template formatting doesn't clear when switching templates.

**Solution**: Use the "Keep My Text" option when switching templates to preserve your content while removing old template structure.

### Notes Not Saving
**Issue**: Save button doesn't work or notes disappear.

**Solution**:
1. Check if you entered a title when prompted
2. Verify storage permissions
3. Check Console for errors
4. Try clearing browser cache

### Export Features Not Working
**Issue**: Email or download options don't work.

**Solution**:
1. **Email**: Ensure you have a default email client configured
2. **Downloads**: Check Chrome's download permissions
3. **Google Docs/Pages**: These open external sites and copy to clipboard - paste manually

### Extension Icon Not Appearing
**Issue**: Can't find the extension icon in Chrome toolbar.

**Solution**:
1. Click the puzzle piece icon in Chrome toolbar
2. Find "MeetingNotes"
3. Click the pin icon to pin it to toolbar

## Getting Help

If none of these solutions work:

1. **Check Console Errors**: Open DevTools → Console and look for red error messages
2. **Check Background Worker**: Inspect the background service worker for errors
3. **Test on Different Platform**: Try a different meeting platform to isolate the issue
4. **Report Issue**: Note the exact error message and steps to reproduce

## Feature Testing Checklist

Use this checklist to verify all features work:

- [ ] Extension auto-opens when joining a meeting
- [ ] Platform detection shows correct platform name
- [ ] Templates load and switch correctly
- [ ] "Keep My Text" preserves user content
- [ ] Save Note prompts for title
- [ ] View History shows saved notes with dates
- [ ] Export → Email opens email client with pre-filled content
- [ ] Export → Plain Text downloads .txt file
- [ ] Export → Markdown downloads .md file
- [ ] Export → HTML downloads .html file
- [ ] Dark theme text is readable (white/gray, not black)
- [ ] Theme buttons don't overflow screen
- [ ] BatesAI logo appears at bottom

## Debug Mode

To enable verbose logging:

1. Open `background.js`
2. Add at the top:
```javascript
const DEBUG = true;
console.log('DEBUG MODE ENABLED');
```
3. Reload extension
4. Check console for detailed logs

## Platform Support

Verified working on:
- ✅ Zoom
- ✅ Google Meet
- ✅ Microsoft Teams
- ✅ Webex
- ✅ Whereby
- ✅ BlueJeans
- ✅ GoToMeeting
- ✅ RingCentral
- ✅ Skype
- ✅ Slack
- ✅ Dialpad
- ✅ Amazon Chime
- ✅ Discord
- ✅ Jitsi Meet
- ✅ Around

If a platform isn't working, check the platform-specific selectors in `content.js` line 314-327.

---

**Last Updated**: October 25, 2025
**Version**: 1.0.0
**Powered by**: BatesAI

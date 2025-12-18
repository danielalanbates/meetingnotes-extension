# Check if Notifications Are Working

## The Problem

You're seeing "MeetingNotes Active" in the content script console (on the Zoom page), but the desktop notification isn't appearing.

## What You're Checking

You checked the **Content Script Console** (on the Zoom page with F12). But you need to check the **Background Service Worker Console** separately.

## Step-by-Step Debug Process

### 1. Open the Background Service Worker Console

1. Go to `chrome://extensions/`
2. Find "MeetingNotes"
3. Click the **"service worker"** link (blue text under "Inspect views")
4. This opens a **separate DevTools window** for the background worker

### 2. Clear the Console

In the background service worker DevTools:
- Click the "Clear console" button (🚫 icon)
- Keep this window open

### 3. Join a Meeting

1. Go to a Zoom meeting URL (like the one you tested)
2. Wait for the page to load

### 4. Check Background Console Messages

You should see these messages **in the background worker console** (not the page console):

```
Background received message: {action: "meetingStatusChanged", inMeeting: true, platform: "Zoom", ...}
Meeting started on Zoom
Auto-open check for Zoom: true
showClickableNotification called with: {title: "Meeting Started", message: "Click to open MeetingNotes for your meeting.", windowId: 123}
Creating notification with ID: meeting-1234567890
Notification created with ID: meeting-1234567890
Clickable notification setup complete
```

### 5. What Each Message Means

| Message | Meaning |
|---------|---------|
| `Background received message` | Content script successfully sent meeting detection to background |
| `Meeting started on Zoom` | Background recognized the meeting start |
| `Auto-open check for Zoom: true` | Platform is enabled in settings |
| `showClickableNotification called` | Notification function was invoked |
| `Creating notification with ID` | Attempting to create notification |
| `Notification created with ID` | Chrome notification API succeeded |

### 6. If You DON'T See These Messages

#### Missing "Background received message"
**Problem**: Content script not communicating with background
**Solution**:
- Reload the extension at `chrome://extensions/`
- Check if there are any errors in the background console
- Verify manifest.json has proper permissions

#### See "Background received message" but NO "Meeting started"
**Problem**: Message handler not processing correctly
**Solution**: Check for errors in background console

#### See "Meeting started" but NO "Auto-open check"
**Problem**: Settings retrieval failing
**Solution**: Run this in background console:
```javascript
chrome.storage.local.get('settings', (result) => console.log('Settings:', result));
```

#### See "Auto-open check: false"
**Problem**: Platform toggle is disabled
**Solution**:
1. Open MeetingNotes side panel
2. Click ⚙️ Settings
3. Scroll to "Auto-Open Settings"
4. Make sure Zoom toggle is checked (blue)

#### See all messages up to "Notification created" but NO desktop notification
**Problem**: Chrome or OS blocking notifications
**Solution**:
1. Check Chrome notification permission:
   - Go to `chrome://settings/content/notifications`
   - Find "MeetingNotes" in the list
   - Make sure it's set to "Allow"
2. Check macOS notification settings:
   - System Settings → Notifications → Google Chrome
   - Make sure "Allow notifications" is enabled
3. Check for "Do Not Disturb" mode on macOS

## Quick Test in Background Console

Copy and paste this into the **background service worker console**:

```javascript
// Test notification directly
chrome.notifications.create('test-' + Date.now(), {
  type: 'basic',
  iconUrl: 'icons/icon128.png',
  title: 'Test Notification',
  message: 'If you see this, notifications are working!',
  priority: 2,
  requireInteraction: true,
  buttons: [{title: 'Test Button'}]
}, (id) => {
  console.log('Test notification created:', id);
  if (chrome.runtime.lastError) {
    console.error('Error:', chrome.runtime.lastError);
  }
});
```

### Expected Result:
- Console shows: `Test notification created: test-1234567890`
- **Desktop notification appears** with "Test Notification" title

### If notification appears:
✅ Notifications are working! The problem is with meeting detection or settings.

### If notification doesn't appear:
❌ Chrome/OS is blocking notifications. Check permissions above.

## Common Solutions

### Solution 1: Grant Notification Permissions
```
Chrome: chrome://settings/content/notifications → Allow for MeetingNotes
macOS: System Settings → Notifications → Google Chrome → Allow
```

### Solution 2: Disable Do Not Disturb
```
macOS: System Settings → Focus → Do Not Disturb → Turn Off
Windows: Settings → System → Focus assist → Off
```

### Solution 3: Reset Extension Permissions
1. Go to `chrome://extensions/`
2. Click "Details" on MeetingNotes
3. Click "Remove"
4. Reinstall the extension
5. When prompted, grant all permissions

### Solution 4: Check Notification Settings in Extension
1. Open MeetingNotes side panel
2. Click ⚙️ Settings
3. Make sure "Notifications" is enabled
4. Make sure platform toggles are enabled

## What to Report Back

Please provide:

1. **Background console output** (from `chrome://extensions/` → "service worker" link)
2. **Result of test notification** (did it appear?)
3. **Chrome notification settings** (chrome://settings/content/notifications - is MeetingNotes allowed?)
4. **OS notification settings** (macOS/Windows - is Chrome allowed to show notifications?)

---

**Last Updated**: October 25, 2025

# Testing Auto-Open Methods

The extension now tries **3 different methods** to auto-open the side panel when a meeting is detected.

## Test Instructions

1. **Reload the extension**:
   - Go to `chrome://extensions/`
   - Click reload on MeetingNotes

2. **Open background console**:
   - Click "service worker" link on the extension
   - Keep this window open to see logs

3. **Join a Zoom meeting**:
   - Go to a Zoom meeting URL
   - Watch the background console

## What to Look For

The console will show one of these outcomes:

### ✅ Success (Method 1 - windowId):
```
Attempting to auto-open side panel for tab: 123
✅ Side panel auto-opened successfully using windowId!
```
**Result**: Side panel opens automatically! 🎉

### ✅ Success (Method 2 - setPanelBehavior):
```
Attempting to auto-open side panel for tab: 123
Method 1 failed (windowId): sidePanel.open() may only be called in response to a user gesture.
✅ Side panel auto-opened successfully using setPanelBehavior!
```
**Result**: Side panel opens automatically! 🎉

### ✅ Success (Method 3 - tabId):
```
Attempting to auto-open side panel for tab: 123
Method 1 failed (windowId): sidePanel.open() may only be called in response to a user gesture.
Method 2 failed (setPanelBehavior): sidePanel.open() may only be called in response to a user gesture.
✅ Side panel auto-opened successfully using tabId!
```
**Result**: Side panel opens automatically! 🎉

### ❌ All Failed (Fallback to Notification):
```
Attempting to auto-open side panel for tab: 123
Method 1 failed (windowId): sidePanel.open() may only be called in response to a user gesture.
Method 2 failed (setPanelBehavior): sidePanel.open() may only be called in response to a user gesture.
Method 3 failed (tabId): sidePanel.open() may only be called in response to a user gesture.
❌ All auto-open methods failed. Showing notification instead.
Clickable notification shown: meeting-1234567890
```
**Result**: Desktop notification appears. Click extension icon to open.

## Expected Behavior

- **If auto-open works**: Side panel opens immediately, no notification needed
- **If auto-open fails**: Desktop notification + green "!" badge on extension icon

## What Changed

**Before**: Only tried `windowId` method
**Now**: Tries 3 different methods in sequence:
1. `windowId` (entire window context)
2. `setPanelBehavior` (configure panel behavior first)
3. `tabId` (specific tab context)

One of these methods **might** work depending on Chrome's internal state when the content script sends the meeting detection message.

---

**Goal**: Find which method (if any) Chrome allows without requiring a direct user gesture.

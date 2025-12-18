# BatesAI Meeting Notes - Testing Guide

## Pre-Testing Setup

### Load Extension in Chrome

1. Open Chrome/Edge browser
2. Navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right)
4. Click "Load unpacked"
5. Select this directory: `/Users/daniel/Documents/copilot/meeting-notes-extension`
6. Verify extension appears with BatesAI icon and no errors

### Expected Result
- Extension loads successfully
- No errors in console
- Icon appears in browser toolbar
- Welcome page opens automatically on first install

---

## Test Suite

### 1. Installation & Welcome Page

**Test 1.1: First Install**
- [ ] Extension loads without errors
- [ ] Welcome page opens automatically
- [ ] All sections display correctly
- [ ] Icons load properly
- [ ] "Get Started Now" button closes welcome page

**Test 1.2: Extension Icon**
- [ ] BatesAI icon appears in toolbar
- [ ] Icon is clickable
- [ ] Tooltip shows "BatesAI Meeting Notes"

---

### 2. Popup Interface Tests

**Test 2.1: Popup Opens**
- [ ] Click extension icon
- [ ] Popup opens (450x600px window)
- [ ] Header displays correctly with logo
- [ ] All UI elements load properly

**Test 2.2: Meeting Status Detection**
- [ ] "Not in meeting" status shows when not on meeting platform
- [ ] Status dot is gray when inactive
- [ ] Open a test meeting URL (see URLs below)
- [ ] Status updates to "In [Platform] meeting"
- [ ] Status dot turns green and pulses

**Test 2.3: Template Selector**
- [ ] Template dropdown displays 5 options
- [ ] Select "General Meeting" - template loads
- [ ] Select "Daily Standup" - template changes
- [ ] Select "Retrospective" - template changes
- [ ] Select "1-on-1" - template changes
- [ ] Select "Custom" - blank template

**Test 2.4: Notes Editor**
- [ ] Click in editor, cursor appears
- [ ] Type text - appears in editor
- [ ] Character count updates in real-time
- [ ] Editor is scrollable for long notes
- [ ] Placeholder text "Start taking notes..." visible when empty

**Test 2.5: Editor Toolbar**
- [ ] Click **B** button - bold formatting instruction inserted
- [ ] Click **I** button - italic formatting instruction inserted
- [ ] Click **•** button - bullet list item inserted
- [ ] Click **☑** button - task checkbox inserted
- [ ] Click **✨** button - AI assist alert shown

**Test 2.6: Auto-Save**
- [ ] Type in editor
- [ ] Wait 1 second after stopping
- [ ] "Saving..." appears
- [ ] Changes to "Saved" with green color
- [ ] Returns to "Auto-save on" after 2 seconds
- [ ] Reload extension - notes persist

**Test 2.7: Save Notes Button**
- [ ] Enter notes in editor
- [ ] Click "Save Notes" button
- [ ] Button text changes to "Saved!"
- [ ] Button turns green
- [ ] Returns to "Save Notes" after 2 seconds
- [ ] Notes saved to history (verify in storage)

**Test 2.8: Clear Button**
- [ ] Enter notes in editor
- [ ] Click "Clear" button
- [ ] Confirmation dialog appears
- [ ] Click "Cancel" - notes remain
- [ ] Click "Clear" again
- [ ] Click "OK" - notes are cleared
- [ ] Editor is empty

**Test 2.9: Export Functionality**
- [ ] Enter test notes
- [ ] Click "Export" button
- [ ] Export modal opens
- [ ] 4 export options visible (TXT, MD, HTML, JSON)
- [ ] Click each format:
  - [ ] TXT - downloads .txt file
  - [ ] MD - downloads .md file
  - [ ] HTML - downloads .html file, open to verify formatting
  - [ ] JSON - downloads .json file, verify structure
- [ ] Click X to close modal
- [ ] Click outside modal - modal closes

**Test 2.10: Quick Actions**
- [ ] Click "View History" - opens history.html (note: file doesn't exist yet, will show error)
- [ ] Click "Manage Templates" - shows alert about coming soon

---

### 3. Content Script Tests

**Test 3.1: Script Injection - Google Meet**
- [ ] Navigate to `https://meet.google.com/new`
- [ ] Open browser console (F12)
- [ ] See "BatesAI Meeting Notes Extension - Content Script Loaded"
- [ ] See "Platform detected: google-meet"
- [ ] Blue indicator appears bottom-right for 3 seconds
- [ ] Indicator says "✓ BatesAI Notes Active"
- [ ] Click indicator - extension popup attempts to open

**Test 3.2: Script Injection - Zoom**
- [ ] Navigate to `https://zoom.us/test` (or join a test meeting)
- [ ] Check console for load messages
- [ ] Platform detected as "zoom"
- [ ] Indicator appears

**Test 3.3: Script Injection - Microsoft Teams**
- [ ] Navigate to `https://teams.microsoft.com/`
- [ ] Check console for load messages
- [ ] Platform detected as "teams"
- [ ] Indicator appears

**Test 3.4: Script Injection - Webex**
- [ ] Navigate to `https://www.webex.com/`
- [ ] Check console for load messages
- [ ] Platform detected as "webex"
- [ ] Indicator appears

**Test 3.5: Keyboard Shortcut**
- [ ] On any meeting platform page
- [ ] Press Ctrl+Shift+N (Cmd+Shift+N on Mac)
- [ ] Extension popup opens

---

### 4. Background Service Worker Tests

**Test 4.1: Service Worker Loads**
- [ ] Go to `chrome://extensions/`
- [ ] Click "service worker" link under BatesAI extension
- [ ] Console opens showing service worker
- [ ] See "Background service worker initialized successfully"
- [ ] No errors in console

**Test 4.2: Meeting Badge Counter**
- [ ] Not in meeting - badge is empty
- [ ] Open Google Meet in one tab - badge shows "1" in blue
- [ ] Open Zoom in another tab - badge shows "2"
- [ ] Close one meeting tab - badge shows "1"
- [ ] Close all meeting tabs - badge clears

**Test 4.3: Notifications**
- [ ] Join a meeting platform
- [ ] Wait for meeting detection
- [ ] Notification appears: "Meeting Started"
- [ ] Message: "BatesAI is ready to capture notes..."
- [ ] Leave meeting page
- [ ] Notification: "Meeting Ended"
- [ ] Message: "Don't forget to save your meeting notes!"

**Test 4.4: Context Menu**
- [ ] Right-click any selected text on a webpage
- [ ] See "Quick Note to BatesAI" in context menu
- [ ] Select text on page
- [ ] Right-click > "Quick Note to BatesAI"
- [ ] Notification: "Note Added"
- [ ] Open popup - selected text added to notes with timestamp

**Test 4.5: Storage Persistence**
- [ ] Open popup, add notes
- [ ] Save notes
- [ ] Close browser completely
- [ ] Reopen browser
- [ ] Open extension - notes still present

---

### 5. Data & Storage Tests

**Test 5.1: Chrome Storage**
- [ ] Open Chrome DevTools
- [ ] Go to Application > Storage > Local Storage
- [ ] Find extension storage
- [ ] Verify keys: `currentNotes`, `selectedTemplate`, `notesHistory`, `settings`
- [ ] Add notes and save
- [ ] Verify `notesHistory` array updates
- [ ] Verify timestamps and structure

**Test 5.2: Notes History Limit**
- [ ] Save 100+ notes (can use loop in console)
- [ ] Verify only last 100 are kept
- [ ] Older notes are removed

---

### 6. Edge Case & Error Handling Tests

**Test 6.1: Empty Notes**
- [ ] Clear all notes
- [ ] Click "Save Notes" - alert shows "Please enter some notes"
- [ ] Click "Export" - alert shows "No notes to export"

**Test 6.2: Very Long Notes**
- [ ] Paste 10,000+ characters
- [ ] Character count updates correctly
- [ ] Editor remains responsive
- [ ] Auto-save works
- [ ] Export works

**Test 6.3: Special Characters**
- [ ] Enter emoji: 😀 🎉 ✨
- [ ] Enter symbols: @#$%^&*()
- [ ] Enter markdown: **bold** *italic* [link](url)
- [ ] Verify all save and export correctly

**Test 6.4: Rapid Actions**
- [ ] Rapidly switch templates
- [ ] Rapidly type and delete
- [ ] Rapidly open/close modal
- [ ] No errors or freezing

**Test 6.5: Multiple Windows**
- [ ] Open popup in window 1
- [ ] Make changes
- [ ] Open popup in window 2
- [ ] Changes sync (refresh if needed)

---

### 7. Platform-Specific Integration Tests

**Test URLs:**
- Google Meet: `https://meet.google.com/new`
- Zoom: `https://zoom.us/test`
- Teams: `https://teams.microsoft.com/`
- Webex: `https://www.webex.com/`

**For Each Platform:**
- [ ] Content script loads without errors
- [ ] Platform correctly detected
- [ ] Indicator appears
- [ ] Extension popup shows platform name
- [ ] Meeting status updates in real-time
- [ ] Badge counter increments
- [ ] Notifications work

---

### 8. Performance Tests

**Test 8.1: Load Time**
- [ ] Measure popup open time (should be < 100ms)
- [ ] Measure content script injection time
- [ ] No noticeable lag

**Test 8.2: Memory Usage**
- [ ] Open Chrome Task Manager (Shift+Esc)
- [ ] Find BatesAI extension process
- [ ] Memory usage should be < 50MB normally
- [ ] Check for memory leaks over 30 min

**Test 8.3: CPU Usage**
- [ ] Extension should use ~0% CPU when idle
- [ ] Brief spike during auto-save is acceptable
- [ ] No continuous CPU usage

---

### 9. Cross-Browser Testing (Optional)

**Chrome**
- [ ] All tests pass

**Microsoft Edge**
- [ ] Extension loads
- [ ] All core features work
- [ ] No Edge-specific issues

**Brave**
- [ ] Extension loads
- [ ] All core features work

---

### 10. Console Error Checks

Throughout testing, monitor for:
- [ ] No errors in popup console
- [ ] No errors in background service worker console
- [ ] No errors in content script console (on meeting pages)
- [ ] No CSP (Content Security Policy) violations
- [ ] No failed resource loads

---

## Known Issues / Expected Behavior

1. **History.html doesn't exist** - "View History" shows error page (to be implemented)
2. **AI Assist not functional** - Shows "coming soon" alert (planned feature)
3. **Template Management** - Shows "coming soon" alert (planned feature)
4. **First notification** - May need to grant notification permission

---

## Testing Checklist Summary

### Critical Tests (Must Pass)
- [x] Extension loads without errors
- [x] Popup opens and displays correctly
- [x] Notes can be typed and saved
- [x] Auto-save works
- [x] Export works (all formats)
- [x] Content script injects on meeting platforms
- [x] No console errors

### Important Tests (Should Pass)
- [x] Meeting detection works
- [x] Badge counter updates
- [x] Templates load correctly
- [x] Notifications appear
- [x] Storage persists after browser restart

### Nice-to-Have Tests
- [ ] Context menu works
- [ ] Keyboard shortcuts work
- [ ] Performance is acceptable
- [ ] Cross-browser compatibility

---

## Test Result Template

```
Date: [Date]
Tester: [Name]
Browser: Chrome [Version]
OS: macOS [Version]

Critical Tests: ☐ PASS ☐ FAIL
Important Tests: ☐ PASS ☐ FAIL
Nice-to-Have Tests: ☐ PASS ☐ FAIL

Issues Found:
1. [Issue description]
2. [Issue description]

Overall Status: ☐ READY FOR USE ☐ NEEDS FIXES
```

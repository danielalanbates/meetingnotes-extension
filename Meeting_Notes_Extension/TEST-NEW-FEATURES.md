# Quick Test Guide - New Features

**Testing Color Themes + Auto-Open Popup**

---

## ⚡ 5-Minute Test Plan

### Step 1: Reload Extension (30 seconds)

```
1. Open Chrome
2. Go to: chrome://extensions/
3. Find "BatesAI Meeting Notes"
4. Click the circular reload icon (🔄)
5. Check "Errors" = 0
```

**Expected**: Extension reloads successfully, no errors

---

### Step 2: Test Color Themes (2 minutes)

```
1. Click the BatesAI extension icon in Chrome toolbar
2. Popup opens - look at top section
3. See "Interface Theme:" with 4 buttons
4. Click each button and observe changes:

   ✅ Blue → Clean blue interface
   ✅ Purple → Purple/lavender interface
   ✅ Green → Mint green interface
   ✅ Dark → Dark mode (black background, light text)

5. Close popup
6. Reopen popup
7. Verify theme persisted (same theme as before closing)
```

**Expected**:
- All 4 themes change the popup colors instantly
- Theme persists when closing and reopening
- No console errors

**What Changed**:
- Headers, buttons, borders all change color
- Dark mode inverts text color (light on dark)
- Editor background changes in dark mode

---

### Step 3: Test Auto-Open on Google Meet (2.5 minutes)

```
1. Open a new Chrome tab
2. Go to: https://meet.google.com/new
3. Click the green "Start an instant meeting" button
4. Wait for meeting to load (video should start)
5. Wait 5-10 seconds
6. IMPORTANT: Watch for:
   - Extension popup should open automatically
   - Notification "Meeting Started" appears
   - Extension badge shows "1"
```

**Expected**:
- After 5-10 seconds in meeting, popup auto-opens
- No manual clicking needed
- Notification appears (top-right or notification center)
- Badge on extension icon shows "1" (one active meeting)

**If it doesn't auto-open**:
- Wait up to 15 seconds (detection runs every 5 seconds)
- Check if popup blocker is active
- Manually click extension icon to verify it still works
- Check DevTools Console for errors (F12)

---

## 🔍 Detailed Testing (If You Have More Time)

### Test All 4 Themes Thoroughly

**For Each Theme (Blue, Purple, Green, Dark)**:

1. **Apply Theme**
   - [ ] Click theme button
   - [ ] Verify active button is highlighted
   - [ ] Check all sections changed color:
     - [ ] Header background
     - [ ] Meeting status section
     - [ ] Theme section borders
     - [ ] Editor border/background
     - [ ] Action buttons (Save Notes, Export, Clear)
     - [ ] Quick action buttons

2. **Test Persistence**
   - [ ] Close popup
   - [ ] Reopen popup
   - [ ] Verify theme is still applied
   - [ ] Close browser completely
   - [ ] Reopen browser
   - [ ] Open popup
   - [ ] Verify theme still persists

3. **Test Functionality**
   - [ ] Type notes in editor (works in dark mode?)
   - [ ] Click formatting buttons (visible in dark mode?)
   - [ ] Export notes (button colors correct?)
   - [ ] Clear notes (button works?)

**Dark Mode Specific**:
- [ ] Editor background is dark (#1F2937)
- [ ] Editor text is light (white/light gray)
- [ ] Placeholder text is visible but dimmed
- [ ] Toolbar buttons have dark backgrounds
- [ ] All text is readable (no white-on-white or black-on-black)

---

### Test Auto-Open on All Platforms

#### Google Meet ✅ (Easiest - No Account Needed)
```
URL: https://meet.google.com/new
Steps:
1. Click "Start an instant meeting"
2. Allow camera/mic if prompted
3. Wait 10 seconds
4. Popup should auto-open

Expected Detection:
- Platform: "Google Meet"
- Detection time: 5-10 seconds
- Auto-open: Yes
```

#### Zoom 🟡 (Free Account Needed)
```
URL: https://zoom.us/test or join any Zoom meeting
Steps:
1. Join meeting via browser
2. Wait for meeting UI to fully load
3. Wait 10 seconds
4. Popup should auto-open

Expected Detection:
- Platform: "Zoom"
- Detection time: 5-15 seconds (Zoom UI loads slower)
- Auto-open: Yes

Note: Zoom may require sign-in or app download
```

#### Microsoft Teams 🟡 (Microsoft Account Needed)
```
URL: https://teams.microsoft.com
Steps:
1. Sign in to Teams
2. Join or start a meeting
3. Wait for call interface to load
4. Wait 10 seconds
5. Popup should auto-open

Expected Detection:
- Platform: "Microsoft Teams"
- Detection time: 10-20 seconds (Teams UI is complex)
- Auto-open: Yes

Note: Teams heavily prefers desktop app over browser
```

#### Webex 🟡 (Account May Be Needed)
```
URL: https://www.webex.com or join Webex meeting
Steps:
1. Join a Webex meeting
2. Wait for meeting window to load
3. Wait 10 seconds
4. Popup should auto-open

Expected Detection:
- Platform: "Webex"
- Detection time: 10-15 seconds
- Auto-open: Yes

Note: Webex may require account
```

---

## 🐛 Common Issues & Solutions

### Issue: Theme Not Changing

**Symptoms**:
- Click theme button, nothing happens
- Colors don't change

**Solutions**:
1. Check DevTools Console (F12 on popup)
2. Look for JavaScript errors
3. Reload extension: chrome://extensions/ → Reload
4. Clear storage and try again:
   ```javascript
   // In popup console:
   chrome.storage.local.clear();
   location.reload();
   ```

---

### Issue: Auto-Open Not Working

**Symptoms**:
- Join meeting, popup doesn't open
- No notification appears

**Debugging Steps**:

1. **Check if meeting detected**:
   - Manually click extension icon
   - Does it say "In [Platform] meeting"?
   - If NO → Content script not detecting meeting
   - If YES → Detection works, auto-open disabled

2. **Check DevTools on meeting page** (F12):
   ```
   Console should show:
   ✅ "BatesAI Meeting Notes Extension - Content Script Loaded"
   ✅ "Platform detected: google-meet"
   ✅ "Meeting status changed: true" (after ~5 seconds)

   If missing:
   ❌ Content script didn't inject
   → Check manifest.json host_permissions
   → Reload extension
   ```

3. **Check Background Service Worker**:
   ```
   1. Go to chrome://extensions/
   2. Find BatesAI extension
   3. Click "Details"
   4. Click "service worker" link
   5. Check console logs:
      ✅ "Meeting started on google-meet"
      ✅ "Background received message: meetingStatusChanged"
   ```

4. **Check Settings**:
   ```javascript
   // In popup console:
   chrome.storage.local.get('settings', (result) => {
     console.log('Auto-open enabled:',
       result.settings?.autoOpenPopup !== false
     );
   });

   // Should show: Auto-open enabled: true
   ```

5. **Manual Enable**:
   ```javascript
   // Force enable auto-open:
   chrome.storage.local.set({
     settings: {
       autoOpenPopup: true,
       notifications: true
     }
   });
   ```

---

### Issue: Popup Opens Multiple Times

**Symptoms**:
- Popup opens, closes, reopens repeatedly

**Solutions**:
1. Likely bug in meeting detection (false positive/negative loop)
2. Check Console for repeated "Meeting status changed" messages
3. Close all meeting tabs
4. Reload extension
5. Try again with single meeting tab

---

### Issue: Dark Mode Text Unreadable

**Symptoms**:
- Dark mode shows black text on dark background
- Can't read notes

**Solutions**:
1. This should NOT happen (CSS is set up correctly)
2. If it does, check browser DevTools → Elements → Computed styles
3. Verify `color` property is light (#F9FAFB)
4. Reload extension
5. Report as bug

---

## ✅ Success Criteria

### Color Themes ✅ PASS If:
- [ ] All 4 themes change popup appearance
- [ ] Themes persist after closing popup
- [ ] Themes persist after closing browser
- [ ] Dark mode has light text on dark background
- [ ] No console errors when switching themes
- [ ] Theme selection visually clear (active button highlighted)

### Auto-Open ✅ PASS If:
- [ ] Popup opens automatically on Google Meet (at minimum)
- [ ] Opens within 15 seconds of joining meeting
- [ ] "Meeting Started" notification appears
- [ ] Extension badge shows "1" when in meeting
- [ ] Only opens once (not repeatedly)
- [ ] Works on at least 2 different platforms (Meet + one other)

---

## 📊 Test Results Template

**Copy and fill out**:

```markdown
## Test Results - [Your Name] - [Date]

### Browser Info
- Browser: Chrome
- Version: [e.g., 118.0.5993.88]
- OS: [macOS / Windows / Linux]

### Color Themes Test
- Blue Theme: ✅ PASS / ❌ FAIL
- Purple Theme: ✅ PASS / ❌ FAIL
- Green Theme: ✅ PASS / ❌ FAIL
- Dark Theme: ✅ PASS / ❌ FAIL
- Theme Persistence: ✅ PASS / ❌ FAIL

**Issues Found**:
1. [Describe any issues]

### Auto-Open Test
- Google Meet: ✅ PASS / ❌ FAIL / ⏭️ SKIPPED
- Zoom: ✅ PASS / ❌ FAIL / ⏭️ SKIPPED
- Teams: ✅ PASS / ❌ FAIL / ⏭️ SKIPPED
- Webex: ✅ PASS / ❌ FAIL / ⏭️ SKIPPED

**Timing**:
- Detection time: [e.g., 7 seconds]
- Auto-open worked: ✅ YES / ❌ NO

**Issues Found**:
1. [Describe any issues]

### Overall
- Ready for production: ✅ YES / ❌ NO
- Major bugs found: [Number]
- Minor bugs found: [Number]

**Recommendations**:
1. [Your feedback]
```

---

## 🎯 Priority Testing Order

**If you only have 5 minutes**:
1. Test Blue and Dark themes (most used)
2. Test auto-open on Google Meet only

**If you have 15 minutes**:
1. Test all 4 color themes
2. Test auto-open on Google Meet + Zoom
3. Test theme persistence

**If you have 30 minutes**:
1. Complete all theme tests
2. Test auto-open on all platforms
3. Test edge cases (multiple tabs, navigation away, etc.)
4. Check DevTools for console errors
5. Test export functionality with each theme

---

## 🚀 After Testing

### If Everything Works ✅

**Next Steps**:
1. Mark features as "Production Ready"
2. Test on other Chromium browsers (Edge, Brave)
3. Create promotional screenshots for each theme
4. Write user-facing release notes
5. Prepare Chrome Web Store listing

### If Issues Found ❌

**Report Format**:
```markdown
**Issue**: [Brief description]
**Severity**: Critical / High / Medium / Low
**Steps to Reproduce**:
1. [Step 1]
2. [Step 2]

**Expected**: [What should happen]
**Actual**: [What actually happened]
**Browser Console**: [Any errors]
**Screenshots**: [If applicable]
```

---

## 📞 Need Help?

**Check These First**:
1. [RECENT-CHANGES.md](RECENT-CHANGES.md) - Detailed technical documentation
2. [THEME-PREVIEW.md](THEME-PREVIEW.md) - Visual theme guide
3. Browser DevTools Console (F12) - Error messages

**Still Stuck?**:
- Document the issue with screenshots
- Include browser console logs
- Note exact steps to reproduce

---

**Happy Testing! 🎉**

Your feedback will help make this extension production-ready!

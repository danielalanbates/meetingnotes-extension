# Why MeetingNotes Might Not Detect Your Meeting

**Last Updated**: October 24, 2025

---

## 🚫 Common Detection Issues

### 1. **Zoom Opens in Native App** ❌

**Problem**: Clicking Zoom links opens the Zoom desktop/mobile app instead of the browser.

**Why It Doesn't Work:**
- Chrome extensions can ONLY access web pages in the browser
- Extensions cannot inject into native desktop applications
- The Zoom app is completely separate from Chrome

**Solutions:**

#### Option A: Force Browser Meetings
1. Go to `chrome://settings/content/protocolHandlers`
2. Find "zoom.us" and set to "Block"
3. Or: Hold **Option (⌥)** when clicking Zoom link (macOS)
4. Or: Add `?web=1` to Zoom URL: `https://zoom.us/j/1234567890?web=1`

#### Option B: Use Zoom Web Client
- Join from browser: `https://zoom.us/wc/join/[MEETING_ID]`
- No app installation required
- Extension will work!

**Test URL for Browser Zoom:**
```
https://zoom.us/wc/join/1234567890
```

---

### 2. **Google Meet URL Doesn't Match**❌

**Problem**: Extension only loads on actual meeting URLs, not homepage.

**Why It Doesn't Work:**
- Content script only injects on `https://meet.google.com/*`
- BUT homepage `/new` doesn't count as a meeting
- Meeting code needs to be in URL: `/abc-defg-hij`

**Solution:**

#### Create a Real Meeting:
1. Go to `https://meet.google.com/new`
2. Click "Continue" to create meeting
3. Copy the meeting URL (looks like: `meet.google.com/abc-defg-hij`)
4. Extension will load on the meeting page!

**Test URL:**
```
https://meet.google.com/new → Wait for redirect → Extension loads!
```

**Or use a specific code:**
```
https://meet.google.com/abc-defg-hij
```

---

### 3. **Microsoft Teams Opens in App** ❌

**Problem**: Teams prefers to open in the desktop/web app.

**Why It Doesn't Work:**
- Teams has complex authentication
- Often redirects to `teams.microsoft.com` login page
- Extension loads but no meeting detected until you're IN a meeting

**Solution:**

#### Join a Specific Meeting:
1. Get a Teams meeting link from an invite
2. Join from browser (not Teams app)
3. Once IN the meeting, extension will detect it

**Note:** You must be INSIDE an active meeting, not just on the Teams homepage.

---

## ✅ What DOES Work

### Platforms That Work Best:

1. **Jitsi Meet** ✅
   - `https://meet.jit.si/YourRoomName`
   - No account needed!
   - Works immediately

2. **Whereby** ✅
   - `https://whereby.com/yourroom`
   - Free rooms available
   - Works in browser

3. **Discord** ✅
   - Voice/Video calls in browser
   - `https://discord.com/channels/@me`
   - Join any voice channel

4. **Google Meet** ✅ (with real meeting)
   - Create meeting, get code
   - Join meeting in browser
   - Extension detects when in call

5. **Zoom Web Client** ✅ (with forced browser)
   - Use `?web=1` parameter
   - Or disable protocol handler
   - Stay in browser, don't launch app

---

## 🔍 How to Verify Extension is Loading

### Step 1: Check Console

1. Open meeting page
2. Press **F12** (Developer Tools)
3. Go to **Console** tab
4. Look for:
   ```
   MeetingNotes Extension - Content Script Loaded
   Platform detected: [Platform Name]
   ```

If you see this → Extension loaded! ✅

If NOT → Content script didn't inject ❌

### Step 2: Check Extension Icon

- Click the MeetingNotes icon in toolbar
- Side panel should open
- Status should show meeting info (when in meeting)

### Step 3: Check for On-Page Indicator

- When meeting is detected
- Small indicator appears bottom-right: "✓ MeetingNotes Active"
- Fades after 3 seconds

---

## 🐛 Troubleshooting by Platform

### Zoom

| Symptom | Cause | Fix |
|---------|-------|-----|
| App opens instead of browser | Default protocol handler | Block zoom.us protocol handler in Chrome settings |
| "Join from your browser" link missing | Zoom app installed | Use `https://zoom.us/wc/join/[ID]` directly |
| Extension doesn't load | Not using web client | Must use browser version, not app |

### Google Meet

| Symptom | Cause | Fix |
|---------|-------|-----|
| Extension doesn't load on homepage | Not a meeting URL | Create or join a meeting first |
| No green dot | Not in active call | Click "Join now" to enter meeting |
| Blank side panel | Page not fully loaded | Wait for page to load, refresh if needed |

### Microsoft Teams

| Symptom | Cause | Fix |
|---------|-------|-----|
| Login page shows | Authentication required | Sign in to Teams first |
| Extension loads but no detection | Not in a meeting | Join a specific meeting, not just Teams homepage |
| Redirects to app | Teams app installed | Choose "Use web app instead" |

### Discord

| Symptom | Cause | Fix |
|---------|-------|-----|
| No detection on homepage | Not in voice channel | Join a voice/video channel |
| Extension loads but no status | Not in call | Start voice/video call in channel |

---

## 📋 Best Testing Strategy

### Option 1: Use Jitsi (Easiest)

```
1. Go to: https://meet.jit.si/test-meeting-notes-ext
2. Click "Join"
3. Extension should detect immediately!
4. Status shows: "In Jitsi Meet meeting" 🟢
```

**Why Jitsi?**
- ✅ No account needed
- ✅ No app installation
- ✅ Instant browser access
- ✅ Guaranteed to work

### Option 2: Use Google Meet

```
1. Go to: https://meet.google.com/new
2. Click "Continue"
3. Wait for redirect to meeting page
4. Extension detects!
```

### Option 3: Use Zoom Web Client

```
1. Get a Zoom meeting link
2. Add ?web=1 to URL
3. Example: https://zoom.us/j/1234567890?web=1
4. Choose "Join from browser"
5. Extension works!
```

---

## 🎯 Quick Fix Checklist

Before reporting an issue, check:

- [ ] Are you in the **browser**, not a native app?
- [ ] Is the URL one of the supported patterns? (see manifest.json)
- [ ] Are you IN an active meeting (not just on homepage)?
- [ ] Did you reload the extension after updates?
- [ ] Do you see the console message "Content Script Loaded"?
- [ ] Is audio/video actually playing? (needed for generic detection)

---

## 🔧 Force Browser Mode for All Platforms

### Disable Protocol Handlers:

```
1. Go to: chrome://settings/content/protocolHandlers
2. Set to "Don't allow sites to ask to become default handlers"
3. Or block specific protocols:
   - zoommtg://
   - msteams://
   - slack://
```

This prevents links from opening native apps!

---

## 💡 Pro Tips

### For Consistent Testing:

1. **Use Jitsi** - Always works, no setup
2. **Bookmark test meetings** - Create room URLs you control
3. **Test in incognito** - No cache/extension conflicts
4. **Check console first** - Faster than guessing

### For Real Meetings:

1. **Join from browser** - Even if you have the app
2. **Use meeting links** - Not homepage URLs
3. **Wait for video** - Detection needs media elements
4. **Check side panel** - Open it manually if needed

---

## 📊 Platform Detection Summary

| Platform | Browser Required | Meeting URL Required | Account Required | Works Best |
|----------|------------------|---------------------|------------------|------------|
| Zoom | ✅ Yes (web client) | ✅ Yes | No | With `?web=1` |
| Google Meet | ✅ Yes | ✅ Yes | Sometimes | After creating meeting |
| Teams | ✅ Yes | ✅ Yes | ✅ Yes | In active meeting only |
| Jitsi | ✅ Yes | No | No | ⭐ Best for testing |
| Whereby | ✅ Yes | No | No | ⭐ Great for testing |
| Discord | ✅ Yes | No | ✅ Yes | In voice channel |
| Slack | ✅ Yes | No | ✅ Yes | In huddle |

---

## 🆘 Still Not Working?

### Debug Steps:

1. **Check Manifest Matches:**
   ```javascript
   // Does your URL match these patterns?
   "https://meet.google.com/*"  // ✅
   "https://meet.google.com/new" // ❌ Too general
   "https://meet.google.com/abc-defg-hij" // ✅
   ```

2. **Check Console Errors:**
   - F12 → Console
   - Look for red error messages
   - Share errors when reporting issues

3. **Reload Extension:**
   ```
   chrome://extensions/
   → Remove MeetingNotes
   → Load unpacked again
   → Try meeting again
   ```

4. **Try Different Browser:**
   - Edge (Chromium) should work
   - Chrome Canary for latest features

---

## 📞 Need Help?

Include this info when reporting issues:

- **Browser**: Chrome/Edge version
- **Platform**: Zoom/Meet/Teams/etc
- **URL**: Exact meeting URL
- **Console Output**: Any error messages
- **Detection Status**: What does side panel show?

---

**Remember**: The extension can ONLY work in the browser, not native apps! 🌐

**Version**: 1.0.0
**Last Updated**: October 24, 2025

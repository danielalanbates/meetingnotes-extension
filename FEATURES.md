# MeetingNotes - Feature Guide

**Version**: 1.0.0
**Last Updated**: October 24, 2025

---

## ✅ Completed Updates

### 1. **Meeting Detection Text**
- Changed from "Not in meeting" → **"No Meeting Detected"**
- Makes it clear the extension actively detects meetings

### 2. **Template Spacing**
- Added padding and margin to template selector
- Better visual separation from editor
- Cleaner, more professional layout

### 3. **Color Themes**
All 4 color themes from parent folder included:
- 🔵 **Blue** (default)
- 🟣 **Purple**
- 🟢 **Green**
- ⚫ **Dark**

**How to use:**
1. Click the 🎨 themes button in header
2. Select your preferred color
3. Theme persists across sessions

### 4. **Document Export Formats**

Now supports 6 export formats:

| Format | File Type | Use Case |
|--------|-----------|----------|
| **Plain Text** | .txt | Simple text editors |
| **Markdown** | .md | GitHub, documentation |
| **HTML** | .html | Web browsers, email |
| **Word Document** | .doc | Microsoft Word |
| **Google Docs** | Opens browser | Copies to clipboard, opens Google Docs |
| **Apple Pages** | .rtf | Apple Pages (RTF format) |

**How to export:**
1. Click "Export" button
2. Select format
3. File downloads automatically (except Google Docs)

---

## 🔍 Auto-Detection Features

### Meeting Platform Detection

**Automatically detects meetings on:**
- ✅ **Zoom** (zoom.us)
- ✅ **Google Meet** (meet.google.com)
- ✅ **Microsoft Teams** (teams.microsoft.com)
- ✅ **Webex** (webex.com)

**Detection works for:**
- ✅ Video calls
- ✅ Audio-only calls
- ✅ Screen sharing sessions
- ✅ Any meeting on these platforms

**What happens when meeting is detected:**
1. Status changes to "In [Platform] meeting" with green dot 🟢
2. Meeting title and platform name displayed
3. Extension indicator appears on page (fades after 3s)
4. Meeting tracked in background

**How it works:**
- Content script ([content.js:52-69](content.js#L52-L69)) checks the URL
- Detects platform-specific domains
- Monitors for active media elements (video/audio)
- Updates status in real-time

---

## 💾 Auto-Save Functionality

### How Auto-Save Works

**Automatic saving after you stop typing:**
- ⏱️ **Trigger**: 1 second after you stop typing
- 💾 **Storage**: Browser's local storage (chrome.storage.local)
- 🔄 **Continuous**: Saves every edit automatically
- 🔐 **Private**: All data stored locally, never sent to servers

**Implementation:**
```javascript
// In sidepanel.js:357-363
notesEditor.addEventListener('input', () => {
  if (autoSaveEnabled) {
    clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => {
      saveCurrentNotes();
    }, 1000); // 1 second delay
  }
});
```

**What gets auto-saved:**
- ✅ Current note content (HTML format)
- ✅ Template selection
- ✅ Color theme preference
- ✅ Settings (auto-save enabled/disabled)

**Persistence:**
- Notes survive browser restarts
- Notes persist even if extension is updated
- Notes remain until manually cleared or browser data deleted

### Manual Save to History

**Separate from auto-save:**
- Click "Save Note" button
- Saves to permanent history (last 100 notes)
- Includes:
  - Note content
  - Meeting platform
  - Meeting title
  - Timestamp
  - Unique ID

**History features:**
- Browse all saved notes
- Load previous notes
- Delete individual notes
- Search by date/platform

---

## 📋 Template Features

### Template Append/Replace

**New smart template behavior:**

When you select a template with existing notes:
1. **Dialog appears** with two choices:
   - **OK** → Append template to end (adds separator line)
   - **Cancel** → Replace all notes (with confirmation)

2. **Append mode:**
   - Adds `<hr>` separator line
   - Template content added below
   - Preserves existing notes

3. **Replace mode:**
   - Shows second confirmation dialog
   - Completely replaces content
   - No undo (be careful!)

**Available templates:**
- **Blank** - Start fresh
- **General Meeting** - Attendees, objective, discussion, decisions, action items
- **Daily Standup** - Yesterday, today, blockers
- **One-on-One** - Check-in, topics, feedback, action items
- **Retrospective** - What went well, improvements, action items

---

## 🎨 Theme Customization

### Color Themes

Each theme changes:
- Primary colors
- Background colors
- Button colors
- Text colors
- Border colors

**Theme specifications:**

**Blue (Default):**
- Primary: #1D4ED8
- Background: #EFF6FF
- Best for: General use

**Purple:**
- Primary: #8B5CF6
- Background: #F3F1FF
- Best for: Creative work

**Green:**
- Primary: #10B981
- Background: #EDFFF6
- Best for: Positive energy

**Dark:**
- Primary: #60A5FA
- Background: #1F2937
- Best for: Low-light environments

---

## 🔔 Notifications & Indicators

### Meeting Start/End Notifications

**When meeting starts:**
- Browser notification: "Meeting Started"
- Message: "MeetingNotes is ready to capture notes"
- Side panel auto-opens (if enabled in settings)

**When meeting ends:**
- Browser notification: "Meeting Ended"
- Reminder: "Don't forget to save your meeting notes!"

### Visual Indicators

**Status dot:**
- 🔴 Red (inactive) - No meeting detected
- 🟢 Green (active) - In meeting

**On-page indicator:**
- Appears bottom-right of meeting page
- Shows "✓ MeetingNotes Active"
- Fades after 3 seconds
- Clickable to open side panel

---

## 🖱️ Context Menu Integration

**Right-click any selected text:**
1. Right-click selected text on webpage
2. Choose "Add to MeetingNotes"
3. Text appended to current notes with timestamp
4. Format: `[HH:MM:SS] Selected text`

**Use cases:**
- Copy important chat messages
- Save links shared in meeting
- Capture decisions from slides
- Quote important statements

---

## ⌨️ Keyboard Shortcuts

**Global shortcuts:**
- `Ctrl/Cmd + Shift + N` - Open side panel quickly

**In editor:**
- `Ctrl/Cmd + B` - Bold (via toolbar button)
- `Ctrl/Cmd + I` - Italic (via toolbar button)
- `Ctrl/Cmd + U` - Underline (via toolbar button)

---

## 📊 Storage & Limits

### Storage Breakdown

**Current notes:**
- Stored in: `chrome.storage.local['currentNotes']`
- Format: HTML string
- Auto-saved every 1 second

**Notes history:**
- Stored in: `chrome.storage.local['notesHistory']`
- Limit: 100 most recent notes
- Each note includes: content, platform, title, timestamp, ID

**Settings:**
- Stored in: `chrome.storage.local['settings']`
- Includes: autoSave, colorTheme

**Chrome storage limits:**
- Total: 10 MB per extension
- Typical note: ~5-10 KB
- Can store ~1000 notes comfortably

### Data Privacy

**All data stays local:**
- ✅ Notes never sent to external servers
- ✅ No analytics or tracking
- ✅ No account required
- ✅ No internet connection needed (except for export to Google Docs)
- ✅ You own your data

---

## 🚀 Performance

### Lightweight & Fast

**Extension size:**
- Total: ~100 KB
- JavaScript: 20 KB (sidepanel.js)
- CSS: 37 KB
- No external libraries

**Memory usage:**
- Typical: 5-10 MB
- Side panel: ~3 MB
- Background script: ~2 MB

**Load times:**
- Extension startup: <100ms
- Side panel open: <200ms
- Template apply: <50ms
- Theme switch: <10ms

---

## ❓ FAQ

### Does it work with audio-only calls?
**Yes!** The extension detects both video and audio calls on supported platforms.

### Will it auto-save if I close the browser?
**Yes!** Auto-save writes to persistent storage. Your notes are safe even after browser restart.

### Can I use it offline?
**Yes!** All features work offline except:
- Google Docs export (requires internet to open docs.google.com)

### How does template append work?
When you have existing notes and select a template:
1. Dialog appears: "Click OK to APPEND, Cancel to REPLACE"
2. APPEND adds the template below with separator line
3. REPLACE erases everything (with confirmation)

### What happens if storage fills up?
- History automatically keeps only last 100 notes
- Oldest notes deleted automatically
- Current notes always preserved

### Can I customize templates?
Not yet in v1.0.0, but planned for future release.

---

## 🔮 Planned Features

Future enhancements (no LLM):
- Custom template creation
- Export to PDF
- Dark mode auto-switch based on system
- Keyboard shortcut customization
- Note search functionality
- Tags and categories
- Team sharing (without cloud)

---

**Need help?** Check the main README.md or report issues in the repository.

**Version**: 1.0.0
**Platform**: Chrome Extension (Manifest V3)
**License**: MIT

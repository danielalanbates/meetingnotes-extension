# Debug Guide - Keep My Text Not Working

## Changes Made

### 1. Added Hyphen Support ✅
**Change**: Updated regex to recognize hyphens as bullet symbols

**Line 322**:
```javascript
// OLD: text = text.replace(/^[☐•\*]\s*/, '');
// NEW:
text = text.replace(/^[☐•\-\*]\s*/, '');
```

Now supports:
- ☐ Checkbox
- • Bullet
- - Hyphen (NEW!)
- * Asterisk

### 2. Added Console Logging ✅
**Purpose**: Debug why text extraction might not be working

**What gets logged**:
```
MeetingNotes: extractUserContent called
MeetingNotes: Current editor HTML: <h1>Meeting Notes</h1>...
MeetingNotes: Found X headings to remove
MeetingNotes: Found X paragraphs total
MeetingNotes: Found X list items total
MeetingNotes: Removing X template elements
MeetingNotes: Extracted user content: [actual text here]
MeetingNotes: Starting text extraction...
MeetingNotes: User content extracted: YES/NO (length: X)
MeetingNotes: New template applied
MeetingNotes: User content added to top / No user content to add
```

## How to Debug

### Step 1: Reload Extension
```
1. Go to chrome://extensions/
2. Find "MeetingNotes"
3. Click reload 🔄
```

### Step 2: Open Side Panel Console
```
1. Click MeetingNotes extension icon
2. Right-click in the side panel → Inspect
3. Click "Console" tab
4. Clear console (🚫 icon or Cmd+K)
```

### Step 3: Test Text Extraction
```
1. Select "General Meeting" template
2. Type some text in "Attendees" or "Discussion":
   • John Smith
   • Sarah Lee
   - Task 1 (hyphen)
   - Task 2 (hyphen)

3. Switch to "Daily Standup" template
4. Click "✨ Keep My Text"
5. Watch console for log messages
```

### Step 4: Read Console Output

**If Working Correctly:**
```
MeetingNotes: extractUserContent called
MeetingNotes: Current editor HTML: <h1>Meeting Notes</h1>...
MeetingNotes: Found 6 headings to remove
MeetingNotes: Found 1 paragraphs total
MeetingNotes: Found 4 list items total
MeetingNotes: Removing 7 template elements
MeetingNotes: Extracted user content: • John Smith
• Sarah Lee
• Task 1
• Task 2
MeetingNotes: Starting text extraction...
MeetingNotes: User content extracted: YES (length: 47)
MeetingNotes: New template applied
MeetingNotes: User content added to top ✅
```

**If NOT Working:**
```
MeetingNotes: extractUserContent called
MeetingNotes: Found 6 headings to remove
MeetingNotes: Found 1 paragraphs total
MeetingNotes: Found 4 list items total
MeetingNotes: Removing 11 template elements  ← Too many removed!
MeetingNotes: Extracted user content:        ← Empty!
MeetingNotes: User content extracted: YES (length: 0)  ← Length 0
MeetingNotes: No user content to add ❌
```

## Common Issues

### Issue 1: Length is 0
**Symptom**: Console says "length: 0" even though you typed text

**Possible Causes**:
1. All list items are empty (just bullets with no text)
2. All paragraphs contain dates or are empty
3. Text is in a format not recognized (bold/italic inside divs?)

**Solution**: Check the "Current editor HTML" log - what does it show?

### Issue 2: Text Removed as Template
**Symptom**: Console shows items being removed that shouldn't be

**Example**:
```
MeetingNotes: Found 10 list items total
MeetingNotes: Removing 10 template elements  ← All list items removed!
```

**Cause**: List items might be empty or only contain bullet/hyphen

**Check**: Make sure you typed actual text, not just:
- Empty bullets: `•`
- Empty hyphens: `-`
- Empty checkboxes: `☐`

### Issue 3: Date Pattern Too Broad
**Symptom**: Your note "Meet on Friday" gets removed

**Cause**: Date pattern matches any text with day/month names

**Example**:
```
Your text: "Meeting on Friday at 3pm"
Pattern matches: "friday" → removed ❌
```

**Workaround**: For now, avoid typing day/month names in paragraphs

## What Gets Extracted

### ✅ Kept (User Content)
```html
<!-- List items with text -->
<li>John Smith</li>                    → • John Smith
<li>Sarah Lee</li>                     → • Sarah Lee
<li>☐ Task to do</li>                  → • Task to do
<li>- Hyphen item</li>                 → • Hyphen item

<!-- Paragraphs without dates -->
<p>This is a note</p>                  → This is a note
<p>Important point</p>                 → Important point
```

### ❌ Removed (Template Structure)
```html
<!-- All headings -->
<h1>Meeting Notes</h1>                 → Removed
<h2>Attendees</h2>                     → Removed

<!-- Date paragraphs -->
<p>Friday, October 25, 2025</p>        → Removed

<!-- Empty list items -->
<li></li>                              → Removed
<li>☐ </li>                            → Removed
<li>-</li>                             → Removed
```

## Testing Checklist

### Test 1: Bullet Points
```
Template: General Meeting
Fill: Attendees section
• John Smith
• Sarah Lee

Expected: Both names extracted
Console: "• John Smith\n• Sarah Lee"
```

### Test 2: Hyphens (NEW!)
```
Template: General Meeting
Fill: Discussion section
- Point 1
- Point 2

Expected: Both points extracted with bullets
Console: "• Point 1\n• Point 2"
```

### Test 3: Mixed Content
```
Template: 1-on-1 Meeting
Fill:
- Check-in paragraph: "Employee is happy"
- Discussion list:
  • Topic 1
  - Topic 2 (hyphen)

Expected: All extracted
Console: "Employee is happy\n• Topic 1\n• Topic 2"
```

### Test 4: Empty Template
```
Template: General Meeting
Fill: Nothing (leave all empty)

Switch template → Click "Keep My Text"

Expected: No "Your Notes" section appears
Console: "No user content to add"
```

## Files Changed

- **sidepanel.js** - Lines 277-381
  - Added hyphen to regex (line 322)
  - Added extensive console logging (multiple lines)
  - Better empty string check (line 362)

## Next Steps

1. **Reload extension**
2. **Open side panel console**
3. **Try extraction with your actual notes**
4. **Share console output if still not working**

The logs will tell us exactly what's happening:
- What HTML is in the editor
- How many elements are found/removed
- What text is extracted
- Whether it gets added to the top

---

**Issue**: Text extraction not working, need hyphen support
**Fix**: Added logging + hyphen support
**Status**: ✅ Ready to test
**Date**: 2025-10-25

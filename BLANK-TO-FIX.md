# Fix: Switching TO Blank Template

## Issue Fixed

**Problem**: When switching FROM "General Meeting" (or any structured template) TO "Blank" template using "Keep My Text", the user notes were being erased.

**Example**:
```
General Meeting template:
Meeting Notes
October 25, 2025

Attendees:
• John Smith
• Sarah Lee

Discussion:
• Budget concerns
```

**Switch to Blank + "Keep My Text" → Result was**:
```
[Empty - all text gone!] ❌
```

## Root Cause

The logic was:
1. Extract user content ✅
2. Clear editor ✅
3. Apply blank template (`content: ''`) → Sets `innerHTML = ''` ✅
4. Try to add user content on top...

But the blank template has EMPTY content (`''`), so there was a logic issue with how we were handling the blank case.

## The Solution

**Added special handling for switching TO blank template:**

```javascript
// Check if switching TO blank template
const isSwitchingToBlank = pendingTemplateId === 'blank';

if (userContent && userContent.length > 0) {
  if (isSwitchingToBlank) {
    // When switching TO blank, just put the content as plain text (no "Your Notes" box)
    notesEditor.innerHTML = userContent.replace(/\n/g, '<br>');
  } else {
    // Normal structured template - add "Your Notes" section with formatting
    const userSection = `<div>📝 Your Notes: ...</div>`;
    notesEditor.innerHTML = userSection + notesEditor.innerHTML;
  }
}
```

**Key difference**:
- **TO Blank**: Content becomes plain text (no "Your Notes" box)
- **TO Structured**: Content in "Your Notes" box above template

## Why This Makes Sense

**Blank template** is for freeform editing, so:
- ✅ No need for "Your Notes" label
- ✅ Just plain text you can immediately edit
- ✅ No template structure below

**Structured template** needs organization, so:
- ✅ "Your Notes" label separates extracted content from template
- ✅ Template structure below for you to fill in

## Example Workflow

### Workflow 1: Structured → Blank

**Starting Point (General Meeting)**:
```
Meeting Notes
October 25, 2025

Attendees:
• John Smith
• Sarah Lee

Discussion:
• Budget concerns
• Timeline issues
```

**Switch to Blank + "Keep My Text"**:
```
• John Smith
• Sarah Lee
• Budget concerns
• Timeline issues

[Blank canvas - continue typing]
```

✅ **All content preserved as plain text!**
✅ **No "Your Notes" box needed**
✅ **Ready to edit immediately**

### Workflow 2: Blank → Structured

**Starting Point (Blank)**:
```
Random notes
More notes
- Point 1
- Point 2
```

**Switch to General Meeting + "Keep My Text"**:
```
📝 Your Notes:
Random notes
More notes
- Point 1
- Point 2
────────────────────────────

Meeting Notes
October 25, 2025

Attendees:
•
```

✅ **Content preserved in "Your Notes" box**
✅ **Clear separation from template structure**

### Workflow 3: Structured → Structured

**Starting Point (General Meeting)**:
```
Meeting Notes
Attendees:
• John Smith
```

**Switch to Standup + "Keep My Text"**:
```
📝 Your Notes:
• John Smith
────────────────────────────

Daily Standup
October 25, 2025
```

✅ **Content in "Your Notes" box as usual**

## Console Logging

**When switching TO blank**:
```
MeetingNotes: Starting text extraction...
MeetingNotes: User content extracted: YES (length: 85)
MeetingNotes: Switching to blank template: true ← Detected!
MeetingNotes: New template applied
MeetingNotes: User content added as plain text (blank template) ← Special handling!
```

**When switching TO structured**:
```
MeetingNotes: Starting text extraction...
MeetingNotes: User content extracted: YES (length: 85)
MeetingNotes: Switching to blank template: false
MeetingNotes: New template applied
MeetingNotes: User content added to top (first notes)
```

## Testing

### Test 1: General Meeting → Blank

**Steps**:
1. Select "General Meeting"
2. Fill in sections:
   - Attendees: John Smith
   - Discussion: Budget review
3. Switch to "Blank"
4. Click "✨ Keep My Text"

**Expected Result**:
```
John Smith
Budget review

[Cursor here - ready to type more]
```

**Verify**:
- ✅ All text preserved
- ✅ No "Your Notes" label
- ✅ Plain text format
- ✅ Ready to edit

### Test 2: Blank → General Meeting → Blank Again

**Steps**:
1. Start in "Blank"
2. Type: "Notes from meeting"
3. Switch to "General Meeting" + "Keep My Text"
4. Type in Attendees: "John"
5. Switch back to "Blank" + "Keep My Text"

**Expected Result**:
```
John
Notes from meeting

[Blank canvas]
```

**Verify**:
- ✅ Both pieces of text preserved
- ✅ No "Your Notes" label
- ✅ Chronological order (newest first)

### Test 3: Multiple Structured → Blank

**Steps**:
1. Start in "General Meeting", type content
2. Switch to "Standup" + "Keep My Text"
3. Type more content
4. Switch to "Blank" + "Keep My Text"

**Expected Result**:
```
Standup content
General Meeting content

[All as plain text, no boxes]
```

**Verify**:
- ✅ All content from both templates
- ✅ No "Your Notes" labels
- ✅ All as editable plain text

## Edge Cases

### Edge Case 1: Empty Structured → Blank
**Scenario**: General Meeting with no content, switch to Blank

**Behavior**: Blank template with nothing (as expected)

**Console**: "No user content to add"

### Edge Case 2: Blank → Blank
**Scenario**: Already in Blank, switch to Blank again (shouldn't happen in UI, but possible)

**Behavior**: Content preserved as plain text

**Result**: Works fine, no issues

### Edge Case 3: Very Long Content → Blank
**Scenario**: Large document with many notes, switch to Blank

**Behavior**: All content preserved as plain text, may need scrolling

**Result**: Works fine, no truncation

## Visual Comparison

### Before Fix

**General Meeting → Blank**:
```
[EMPTY - all text lost!] ❌
```

### After Fix

**General Meeting → Blank**:
```
• John Smith           ← Preserved!
• Sarah Lee            ← Preserved!
• Budget concerns      ← Preserved!

[Continue typing...]
```

## Files Changed

**sidepanel.js** - Lines 407-420

**Added**:
```javascript
// Check if switching TO blank template
const isSwitchingToBlank = pendingTemplateId === 'blank';

if (userContent && userContent.length > 0) {
  if (isSwitchingToBlank) {
    // When switching TO blank, just put the content as plain text
    notesEditor.innerHTML = userContent.replace(/\n/g, '<br>');
  } else {
    // Normal structured template handling
    ...
  }
}
```

## Summary

✅ **Issue**: Text erased when switching TO blank template
✅ **Cause**: Blank template has empty content, needed special handling
✅ **Fix**: Detect blank template destination, add content as plain text (no "Your Notes" box)
✅ **Result**: All content preserved, ready for freeform editing

**The UX makes sense**:
- Blank → Structured: Needs "Your Notes" box (separation from template)
- Structured → Blank: No box needed (plain text for freeform editing)
- Structured → Structured: "Your Notes" box (organized notes above template)

---

**Issue**: User notes erased when switching TO blank template
**Fix**: Special handling for blank as destination - add as plain text
**Status**: ✅ Fixed
**Date**: 2025-10-25

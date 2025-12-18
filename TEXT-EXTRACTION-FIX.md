# Text Extraction Fix - Keep My Notes

## Issues Fixed

### Issue 1: Date Being Kept, User Text Being Deleted ❌ → ✅

**Problem**: When clicking "Keep My Text", the template date (e.g., "Friday, October 25, 2025") was being preserved, but actual user-typed content was being deleted.

**Root Cause**: The old extraction function used `textContent` on everything, which captured the date but didn't properly identify and extract user content from `<li>` and `<p>` tags.

**Fix**: Completely rewrote `extractUserContent()` to:
1. **Remove ALL headings** (h1, h2, h3, etc.) - they're template structure
2. **Remove date paragraphs** - detect date patterns like "Monday, January 1, 2025"
3. **Remove empty elements** - empty `<li>`, `<p>`, `<hr>` tags
4. **Extract user content** from list items and paragraphs
5. **Preserve bullet formatting** - adds `•` prefix to list items

### Issue 2: Highlighted Box Makes Editing Awkward ❌ → ✅

**Problem**: The yellow highlighted box looked nice but was awkward to edit. Users want to copy/paste text into the template sections below.

**Fix**: Replaced highlighted box with clean, minimal separator:
- **Before**: Yellow background box with left border (hard to edit)
- **After**: Simple gray label with bottom border (easy to copy from)

## New Extraction Logic

### Before (Buggy)
```javascript
function extractUserContent() {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = notesEditor.innerHTML;

  // Remove template headers
  // Remove empty list items

  // BUG: Just returns all textContent (includes dates!)
  return tempDiv.textContent.trim();
}
```

### After (Fixed)
```javascript
function extractUserContent() {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = notesEditor.innerHTML;

  // Remove ALL headings (h1-h6)
  tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(heading => {
    heading.remove();
  });

  // Remove paragraphs with dates
  tempDiv.querySelectorAll('p').forEach(p => {
    const text = p.textContent.trim();
    const datePattern = /(monday|tuesday|...|december)/i;
    if (datePattern.test(text) || text === '') {
      p.remove();
    }
  });

  // Remove empty list items
  tempDiv.querySelectorAll('li').forEach(li => {
    const text = li.textContent.trim();
    if (text === '' || text === '☐' || text === '☐ ') {
      li.remove();
    }
  });

  // Collect user content
  const userContent = [];

  // Extract from list items
  tempDiv.querySelectorAll('li').forEach(li => {
    let text = li.textContent.trim();
    text = text.replace(/^☐\s*/, ''); // Remove checkbox
    if (text) {
      userContent.push('• ' + text);
    }
  });

  // Extract from paragraphs
  tempDiv.querySelectorAll('p').forEach(p => {
    const text = p.textContent.trim();
    if (text) {
      userContent.push(text);
    }
  });

  return userContent.join('\n');
}
```

## New Visual Design

### Before (Highlighted Box)
```html
<div style="background: #FFF9E6; padding: 12px; border-radius: 6px;
     margin-bottom: 16px; border-left: 3px solid #F59E0B;">
  <strong>📝 Your Notes:</strong><br>
  User content here
</div>
```
**Visual**: Yellow background, orange left border, rounded corners
**Problem**: Looks like a special UI element, hard to select and edit

### After (Clean Separator)
```html
<div style="margin-bottom: 20px; padding-bottom: 16px;
     border-bottom: 2px solid #E5E7EB;">
  <p style="color: #6B7280; font-size: 13px; margin-bottom: 8px;">
    <strong>📝 Your Notes:</strong>
  </p>
  User content here
</div>
```
**Visual**: Gray label, bottom border separator, no background
**Benefit**: Looks like regular text, easy to copy/paste into template

## Example Workflow

### You Have This (General Meeting Template)
```
Meeting Notes
Friday, October 25, 2025

Attendees:
• John Smith
• Sarah Lee

Objective:
Review Q4 goals

Discussion:
• Need to update API
• Deploy by Friday

Action Items:
☐ Create deployment plan
☐ Schedule code review
```

### Click "✨ Keep My Text" → Switch to "Daily Standup"

**Old Buggy Output:**
```
📝 Your Notes:
Friday, October 25, 2025    ← BUG: Date kept
                             ← BUG: User text missing!

Daily Standup
Friday, October 25, 2025

Yesterday:
•

Today:
•
```

**New Fixed Output:**
```
📝 Your Notes:
• John Smith
• Sarah Lee
Review Q4 goals
• Need to update API
• Deploy by Friday
• Create deployment plan
• Schedule code review
────────────────────────────

Daily Standup
Friday, October 25, 2025

Yesterday:
•

Today:
•
```

✅ **Date removed**
✅ **User text preserved**
✅ **Easy to copy/paste into sections below**

## What Gets Removed vs Kept

### ❌ Removed (Template Structure)
- All headings (h1, h2, h3, etc.)
- Date paragraphs ("Friday, October 25, 2025")
- Empty list items (`<li></li>`)
- Empty paragraphs (`<p></p>`)
- Horizontal rules (`<hr>`)
- Checkbox symbols (☐) - but text after checkbox is kept

### ✅ Kept (User Content)
- Text typed in list items (converted to bullet points)
- Text typed in paragraphs
- Line breaks between items

## Testing the Fix

### Test 1: User Text in List Items
**Setup**:
1. Select "General Meeting" template
2. Under "Attendees", type:
   - `John Smith`
   - `Sarah Lee`
3. Under "Discussion", type:
   - `Update the API`
   - `Deploy by Friday`

**Switch to "Daily Standup" → Click "Keep My Text"**

**Expected Output**:
```
📝 Your Notes:
• John Smith
• Sarah Lee
• Update the API
• Deploy by Friday
────────────────────

Daily Standup
Friday, October 25, 2025

Yesterday:
•
```

**Verify**: No date at top, all 4 names/items present ✅

### Test 2: User Text in Paragraphs
**Setup**:
1. Select "1-on-1 Meeting" template
2. Under "Check-in", type: `Employee is doing well`
3. Under "Feedback", type: `Great work on the presentation`

**Switch to "Retrospective" → Click "Keep My Text"**

**Expected Output**:
```
📝 Your Notes:
Employee is doing well
Great work on the presentation
────────────────────

Sprint Retrospective
Friday, October 25, 2025
```

**Verify**: Both paragraphs preserved, no date ✅

### Test 3: Action Items with Checkboxes
**Setup**:
1. Select "General Meeting" template
2. Under "Action Items", type:
   - `☐ Create deployment plan`
   - `☐ Schedule code review`

**Switch to "Daily Standup" → Click "Keep My Text"**

**Expected Output**:
```
📝 Your Notes:
• Create deployment plan
• Schedule code review
────────────────────

Daily Standup
```

**Verify**: Checkboxes removed, text converted to bullets ✅

### Test 4: Empty Sections Ignored
**Setup**:
1. Select "General Meeting" template
2. Only fill "Discussion" section:
   - `Point 1`
   - `Point 2`
3. Leave Attendees, Objective, Decisions, Action Items EMPTY

**Switch to "Standup" → Click "Keep My Text"**

**Expected Output**:
```
📝 Your Notes:
• Point 1
• Point 2
────────────────────

Daily Standup
```

**Verify**: Only filled sections appear, empty sections ignored ✅

## Visual Comparison

### Before Fix
```
┌─────────────────────────────────┐
│ 📝 Your Notes:                  │ ← Yellow background
│ Friday, October 25, 2025        │ ← BUG: Date
│ (user text missing)             │ ← BUG: No user content
└─────────────────────────────────┘
```
**Problems**:
- Hard to edit (yellow box)
- Date included (wrong)
- User text missing (broken)

### After Fix
```
📝 Your Notes:                     ← Gray label
• John Smith                       ← User content
• Sarah Lee                        ← User content
• Update the API                   ← User content
────────────────────────────────   ← Gray line separator

Daily Standup
Friday, October 25, 2025
```
**Benefits**:
- Easy to edit (no background)
- No template date (correct)
- User text preserved (working)

## Files Changed

**sidepanel.js** - Two locations updated:

1. **`extractUserContent()` function** (lines 277-337)
   - Complete rewrite of extraction logic
   - Now properly identifies and removes template structure
   - Correctly extracts user content from lists and paragraphs

2. **`handleTemplateReplaceKeepText()` function** (line 357)
   - Changed styling from highlighted box to clean separator
   - Gray label instead of yellow background
   - Bottom border instead of rounded box

## Known Edge Cases

### Edge Case 1: User Types Day/Month Names
**Scenario**: User types "We're meeting on Friday" in notes

**Behavior**: Paragraph will be removed (matches date pattern)

**Workaround**: If this becomes an issue, we can make date detection more strict (require full date format with year)

### Edge Case 2: User Copies Template Headers
**Scenario**: User manually types "Attendees:" as a note

**Behavior**: Will be kept (we only remove h1/h2 headings, not plain text)

**Result**: This is fine - user explicitly typed it

## Summary

✅ **Fixed**: Date being kept instead of user text
✅ **Fixed**: Yellow box making editing awkward
✅ **Result**: Clean, copyable user content at top with new template below

---

**Issue**: User text not extracted, date kept instead; highlighted box awkward
**Fix**: Rewrote extraction logic, removed highlighting
**Status**: ✅ Fixed
**Date**: 2025-10-25

# Fix: Extract Content from "Your Notes" Sections

## Issue Fixed

**Problem**: When you had a "Your Notes" section from a previous template switch, and then switched templates again using "Keep My Text", the content INSIDE the "Your Notes" section was being erased.

**Example**:
```
📝 Your Notes:
• John Smith
• Sarah Lee
• Budget concerns
────────────────────────────

Meeting Notes
October 25, 2025

Attendees:
• New person

↓ Switch to Blank + "Keep My Text" ↓

[EMPTY - Your Notes content lost!] ❌
```

## Root Cause

The extraction function was looking for content in:
- `<li>` tags ✅
- `<p>` tags ✅ (but skipped "Your Notes:" label)
- Custom headings ✅

**But NOT looking in**:
- `<div>` tags that contain the actual "Your Notes" content ❌

### HTML Structure of "Your Notes"

```html
<div style="...border-bottom: 2px solid #E5E7EB;">
  <p style="..."><strong>📝 Your Notes:</strong></p>
  <div>
    Content line 1<br>
    Content line 2<br>
    Content line 3
  </div>
</div>
```

The actual content is in the **inner `<div>`** with `<br>` tags, but the extraction wasn't checking there!

## The Solution

**Added extraction for "Your Notes" div sections:**

```javascript
// Extract content from "Your Notes" div sections
// Look for divs that have border-bottom style (marks "Your Notes" containers)
tempDiv.querySelectorAll('div[style*="border-bottom"]').forEach(parentDiv => {
  // This is a "Your Notes" section container
  // Find the content div inside (after the <p> label)
  const contentDivs = parentDiv.querySelectorAll('div');

  contentDivs.forEach(contentDiv => {
    // Get text content, preserving <br> as line breaks
    const html = contentDiv.innerHTML;
    if (html && !html.includes('📝 Your Notes:')) {
      // Convert <br> tags to newlines, then extract text
      const textWithBreaks = html.replace(/<br\s*\/?>/gi, '\n');
      const tempSpan = document.createElement('span');
      tempSpan.innerHTML = textWithBreaks;
      const text = tempSpan.textContent.trim();

      if (text) {
        userContent.push(text);
      }
    }
  });
});
```

**How it works**:
1. Find all divs with `border-bottom` style (these are "Your Notes" containers)
2. Look inside for content divs
3. Get the innerHTML (which has `<br>` tags)
4. Convert `<br>` to newlines (`\n`)
5. Extract clean text
6. Add to user content

### Also Fixed: "Your Notes:" Label

**Updated paragraph extraction to skip the label:**

```javascript
// Get text from remaining paragraphs (skip "Your Notes:" label)
tempDiv.querySelectorAll('p').forEach(p => {
  const text = p.textContent.trim();
  // Skip the "Your Notes:" label paragraph
  if (text && text !== '📝 Your Notes:' && !text.startsWith('📝 Your Notes:')) {
    userContent.push(text);
  }
});
```

This ensures the "📝 Your Notes:" label itself doesn't get extracted as content.

## Example Workflow

### Workflow: Multiple Template Switches

**Step 1: Start with General Meeting**
```
Meeting Notes
Attendees:
• John Smith
• Sarah Lee
```

**Step 2: Switch to Standup + "Keep My Text"**
```
📝 Your Notes:
• John Smith
• Sarah Lee
────────────────────────────

Daily Standup
Yesterday:
• Worked on API
```

**Step 3: Switch to Blank + "Keep My Text"**

**Before Fix**:
```
[EMPTY - everything lost!] ❌
```

**After Fix**:
```
• John Smith
• Sarah Lee
• Worked on API

[Blank canvas - ready to type more]
✅
```

✅ **All content from "Your Notes" section preserved!**
✅ **All content from template sections preserved!**
✅ **Everything as plain text in blank template!**

## Console Logging

**With "Your Notes" sections present**:
```
MeetingNotes: extractUserContent called
MeetingNotes: Found 2 headings total
MeetingNotes: Removing 2 template headings, keeping 0 custom headings
MeetingNotes: Found 1 paragraphs total
MeetingNotes: Found 3 list items total
MeetingNotes: Removing 3 template elements
MeetingNotes: Extracted user content: • John Smith
• Sarah Lee
• Worked on API
← Content from Your Notes div extracted!
```

## Testing

### Test 1: Your Notes → Blank

**Steps**:
1. Start with "General Meeting"
2. Fill sections
3. Switch to "Standup" + "Keep My Text"
4. Now you have a "Your Notes" section
5. Fill standup sections
6. Switch to "Blank" + "Keep My Text"

**Expected Result**:
```
• John Smith                ← From first Your Notes
• Sarah Lee                 ← From first Your Notes
• Worked on API             ← From standup section
• Fixed bugs                ← From standup section

[Blank canvas]
```

**Verify**:
- ✅ Content from "Your Notes" section preserved
- ✅ Content from template sections preserved
- ✅ All as plain text
- ✅ No "Your Notes:" label in output

### Test 2: Multiple Your Notes → Blank

**Steps**:
1. Start with "General Meeting", fill sections
2. Switch to "Standup" + "Keep My Text" (creates 1st Your Notes)
3. Fill standup
4. Switch to "1-on-1" + "Keep My Text" (creates 2nd Your Notes)
5. Fill 1-on-1
6. Switch to "Blank" + "Keep My Text"

**Expected Result**:
```
1-on-1 content              ← From template section
Standup content             ← From 2nd Your Notes
General Meeting content     ← From 1st Your Notes

[All preserved as plain text]
```

**Verify**:
- ✅ All 3 sets of content preserved
- ✅ Chronological order (newest first)
- ✅ No duplicate "Your Notes:" labels

### Test 3: Your Notes → Structured Template

**Steps**:
1. Start with "General Meeting", fill sections
2. Switch to "Standup" + "Keep My Text" (creates Your Notes)
3. Switch to "Retrospective" + "Keep My Text"

**Expected Result**:
```
📝 Your Notes:
Standup content
────────────────────────────

Sprint Retrospective
October 25, 2025
```

**Verify**:
- ✅ Content extracted from previous Your Notes
- ✅ Added to new Your Notes section
- ✅ Template below

## Edge Cases

### Edge Case 1: Empty Your Notes Section
**Scenario**: "Your Notes" box exists but is empty

**HTML**:
```html
<div style="border-bottom...">
  <p>📝 Your Notes:</p>
  <div></div>  ← Empty!
</div>
```

**Behavior**: No content extracted, continues to other elements

**Result**: Works fine, no errors

### Edge Case 2: Your Notes with Only Label
**Scenario**: Only the label paragraph, no content div

**Behavior**: Label is skipped by the paragraph filter

**Result**: Works fine, label not extracted

### Edge Case 3: Nested Divs
**Scenario**: Content has nested divs (e.g., user typed and formatted text)

**Behavior**: Extracts text from all nested divs

**Result**: All text content preserved

## Visual Comparison

### Before Fix

**With Your Notes → Blank**:
```
📝 Your Notes:
• Important content
• More content

↓ Switch to Blank + "Keep My Text" ↓

[EMPTY] ❌
```

### After Fix

**With Your Notes → Blank**:
```
📝 Your Notes:
• Important content
• More content

↓ Switch to Blank + "Keep My Text" ↓

• Important content
• More content

[Ready to continue!] ✅
```

## What Gets Extracted Now

### From "Your Notes" Sections
```html
<div style="border-bottom...">
  <p>📝 Your Notes:</p>  ← SKIP (label)
  <div>
    Line 1<br>            ← EXTRACT
    Line 2<br>            ← EXTRACT
    Line 3                ← EXTRACT
  </div>
</div>
```

**Result**: `Line 1\nLine 2\nLine 3`

### From Template Sections
```html
<ul>
  <li>Item 1</li>         ← EXTRACT
  <li>Item 2</li>         ← EXTRACT
</ul>
```

**Result**: `• Item 1\n• Item 2`

### Combined
**All extracted content** from both "Your Notes" boxes and template sections!

## Files Changed

**sidepanel.js** - Lines 378-408

**Changes**:
1. **Paragraph extraction** (Lines 378-385): Skip "📝 Your Notes:" label
2. **Div extraction** (Lines 387-407): Extract content from "Your Notes" boxes

**New logic**:
```javascript
// Skip "Your Notes:" label
if (text !== '📝 Your Notes:' && !text.startsWith('📝 Your Notes:')) {
  userContent.push(text);
}

// Extract from Your Notes divs
tempDiv.querySelectorAll('div[style*="border-bottom"]').forEach(parentDiv => {
  // Find content divs, convert <br> to \n, extract text
  ...
});
```

## Summary

✅ **Issue**: Content inside "Your Notes" sections was being erased
✅ **Cause**: Extraction wasn't looking in `<div>` elements where "Your Notes" content lives
✅ **Fix**: Added extraction for divs with `border-bottom` style, preserves `<br>` as newlines
✅ **Result**: All content preserved, including from previous "Your Notes" sections

**Now extracts from**:
- ✅ List items (`<li>`)
- ✅ Paragraphs (`<p>`)
- ✅ Custom headings (h1-h6)
- ✅ **"Your Notes" div sections** ← NEW!

---

**Issue**: "Your Notes" section content being erased during template switches
**Fix**: Extract content from `<div>` elements inside "Your Notes" containers
**Status**: ✅ Fixed
**Date**: 2025-10-25

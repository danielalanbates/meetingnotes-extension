# Fix: Extract Direct Text Nodes (Text Before Appended Templates)

## Issue Fixed

**Problem**: When you have text in Blank template (e.g., "hi"), then append a structured template, then switch with "Keep My Text", the original text is lost.

**Example**:
```
BEFORE:
hi

APPEND Daily Standup:
hi
────────────────
Daily Standup
Saturday, October 25, 2025
Yesterday
Today
Blockers

SWITCH TO BLANK + "Keep My Text":
(empty - "hi" is gone!) ❌
```

## Root Cause

When you type "hi" in Blank template, it's stored as:
```html
hi<br>
```

Or sometimes as a direct text node (not wrapped in any element).

When you append Daily Standup, the HTML becomes:
```html
hi<br>
<hr>
<h1>Daily Standup</h1>
<p>Saturday, October 25, 2025</p>
...
```

**The extraction logic was checking**:
- ✅ `<li>` tags (list items)
- ✅ `<p>` tags (paragraphs)
- ✅ `<h1-h6>` tags (headings)
- ✅ `<div>` tags (Your Notes boxes)

**But NOT checking**:
- ❌ Direct text nodes (text not wrapped in any tag)
- ❌ Text inside `<br>` tags at the root level

So "hi" was invisible to the extraction!

## The Solution

**Extract direct text nodes from the root level:**

```javascript
// First, extract any direct text nodes (text that's not inside any element)
// This catches text like "hi" that appears before appended templates
const directTextNodes = Array.from(tempDiv.childNodes)
  .filter(node => node.nodeType === Node.TEXT_NODE)
  .map(node => node.textContent.trim())
  .filter(text => text.length > 0);

if (directTextNodes.length > 0) {
  console.log('MeetingNotes: Found direct text nodes:', directTextNodes);
  directTextNodes.forEach(text => {
    userContent.push(text);
  });
}
```

**How it works**:
1. Get all child nodes of the temp div (includes text nodes, not just elements)
2. Filter for TEXT_NODE type (Node.nodeType === 3)
3. Extract text content and trim whitespace
4. Filter out empty strings
5. Add to user content array

## Example Workflow

### Workflow: Blank → Append → Switch

**Step 1: Start in Blank**
```html
hi<br>
```

**Step 2: Append Daily Standup**
```html
hi<br>
<hr>
<h1>Daily Standup</h1>
<p>Saturday, October 25, 2025</p>
<h2>Yesterday</h2>
<ul><li></li></ul>
<h2>Today</h2>
<ul><li></li></ul>
<h2>Blockers</h2>
<ul><li></li></ul>
```

**Step 3: Switch to Blank + "Keep My Text"**

**Before Fix**:
```
(empty - "hi" lost) ❌
```

**After Fix**:
```
hi ✅

(extracted from direct text node!)
```

### Workflow: Blank with Content → Append → Fill → Switch

**Step 1: Blank with text**
```
hi
some notes
```

**Step 2: Append Standup, fill sections**
```
hi
some notes
────────────────
Daily Standup
Yesterday:
• Finished API
Today:
• Start UI
```

**Step 3: Switch to Retrospective + "Keep My Text"**

**Expected**:
```
📝 Your Notes:
hi
some notes
• Finished API
• Start UI
────────────────

Sprint Retrospective
October 25, 2025
```

✅ **All content preserved!**

## What Gets Extracted Now

### Direct Text Nodes
```html
hi<br>          ← "hi" extracted as direct text node
<hr>
<h1>Template</h1>
```

### Text in Elements
```html
<p>Paragraph text</p>  ← Extracted from <p>
<li>List item</li>     ← Extracted from <li>
```

### Text in Divs
```html
<div style="border-bottom...">
  <p>📝 Your Notes:</p>
  <div>Content</div>   ← Extracted from Your Notes div
</div>
```

### Combined
```html
hi<br>                          ← Direct text node ✅
<hr>
<h1>Daily Standup</h1>          ← Removed (template)
<h2>Yesterday</h2>              ← Removed (template)
<ul><li>Task 1</li></ul>        ← Extract "Task 1" ✅
```

**Result**: `hi\n• Task 1`

## Console Logging

**When direct text nodes found**:
```
MeetingNotes: Found direct text nodes: ['hi', 'some notes']
```

**When no direct text nodes**:
```
(No log - moves on to checking other element types)
```

## Testing

### Test 1: Blank Text → Append → Keep My Text

**Steps**:
1. Select "Blank"
2. Type: "hi"
3. Select "Daily Standup" → "📌 Append Template"
4. Select "Blank" → "✨ Keep My Text"

**Expected**:
```
hi
```

**Console**:
```
MeetingNotes: Found direct text nodes: ['hi']
MeetingNotes: Extracted user content: hi
```

**Verify**: ✅ "hi" preserved

### Test 2: Multi-line Blank Text → Append → Keep My Text

**Steps**:
1. Select "Blank"
2. Type:
   ```
   Line 1
   Line 2
   Line 3
   ```
3. Append "General Meeting"
4. Switch to "Blank" + "Keep My Text"

**Expected**:
```
Line 1
Line 2
Line 3
```

**Verify**: ✅ All lines preserved

### Test 3: Blank Text + Filled Template → Switch

**Steps**:
1. Blank: "hi"
2. Append Standup
3. Fill Standup:
   - Yesterday: Task 1
   - Today: Task 2
4. Switch to Blank + "Keep My Text"

**Expected**:
```
hi
• Task 1
• Task 2
```

**Verify**: ✅ Blank text + template content both preserved

### Test 4: No Direct Text (Normal Template)

**Steps**:
1. Start with "General Meeting" (no direct text nodes)
2. Fill sections
3. Switch to Blank + "Keep My Text"

**Expected**:
```
• Content from sections
```

**Console**:
```
(No "Found direct text nodes" log)
MeetingNotes: Remaining list items: 3
...
```

**Verify**: ✅ Works as before, no regression

## Edge Cases

### Edge Case 1: Only Whitespace Text Nodes
**HTML**:
```html

<hr>
<h1>Template</h1>
```

**Behavior**: Whitespace trimmed, empty string filtered out

**Result**: No direct text extracted (correct)

### Edge Case 2: Text with Special Characters
**Text**: "hi & bye"

**HTML**: `hi &amp; bye<br>`

**Extraction**: `textContent` automatically decodes HTML entities

**Result**: "hi & bye" extracted correctly ✅

### Edge Case 3: Text After Template (Unusual)
**HTML**:
```html
<h1>Daily Standup</h1>
...
trailing text
```

**Behavior**: `childNodes` includes all text nodes

**Result**: "trailing text" also extracted ✅

## Files Changed

**sidepanel.js** - Lines 371-383

**Added**:
```javascript
// First, extract any direct text nodes
const directTextNodes = Array.from(tempDiv.childNodes)
  .filter(node => node.nodeType === Node.TEXT_NODE)
  .map(node => node.textContent.trim())
  .filter(text => text.length > 0);

if (directTextNodes.length > 0) {
  console.log('MeetingNotes: Found direct text nodes:', directTextNodes);
  directTextNodes.forEach(text => {
    userContent.push(text);
  });
}
```

## Summary

✅ **Issue**: Text in Blank template lost when appending then switching
✅ **Cause**: Extraction wasn't checking direct text nodes (only elements)
✅ **Fix**: Extract direct text nodes from root level before checking elements
✅ **Result**: All text preserved, including freeform text before appended templates

**Now extracts from**:
- ✅ Direct text nodes (NEW!)
- ✅ Custom headings (h1-h6)
- ✅ List items (`<li>`)
- ✅ Paragraphs (`<p>`)
- ✅ "Your Notes" divs

---

**Issue**: "hi" in Blank lost after append + switch
**Fix**: Extract direct text nodes (text not wrapped in elements)
**Status**: ✅ Fixed
**Date**: 2025-10-25

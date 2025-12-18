# Custom Headings Fix - Keep My Text

## Issue Fixed

**Problem**: "Keep My Text" was removing ALL headings, including user-typed custom headings.

**Example**:
```
Meeting Notes  ← Template heading
October 25, 2025

Attendees  ← Template heading
• John Smith

## Important Topics  ← USER typed this!
• Security review
• Budget approval
```

**Before Fix**: All 3 headings removed (including "Important Topics") ❌

**After Fix**: Only template headings removed, "Important Topics" preserved ✅

## The Solution

### Changed Logic: Smart Heading Detection

**Old Code** (Buggy):
```javascript
// Remove ALL h1, h2, h3 headings (they're template structure)
tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(heading => {
  elementsToRemove.push(heading);  // ❌ Removes everything!
});
```

**New Code** (Smart):
```javascript
// Remove ONLY template headings, keep user-typed custom headings
const templateHeaders = [
  'meeting notes', 'attendees', 'objective', 'discussion', 'decisions',
  'action items', 'next steps', 'daily standup', 'yesterday', 'today',
  'blockers', 'one-on-one meeting', 'check-in', 'discussion topics',
  'feedback', 'sprint retrospective', 'what went well', 'what to improve'
];

headings.forEach(heading => {
  const text = heading.textContent.trim().toLowerCase();
  // Only remove if it matches a known template header
  if (templateHeaders.some(header => text === header || text.includes(header))) {
    elementsToRemove.push(heading);  // Remove template heading
  } else {
    // Keep custom heading - user typed this!
  }
});
```

### Added Heading Extraction

**Also updated the collection phase** to extract custom headings:

```javascript
// Collect remaining user content from headings, lists, and paragraphs
const userContent = [];

// Get custom headings (that weren't removed)
tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(heading => {
  const text = heading.textContent.trim();
  if (text) {
    userContent.push('## ' + text);  // Add as markdown-style heading
  }
});

// Then get list items...
// Then get paragraphs...
```

## Example Workflow

### You Have This (General Meeting Template)

```
Meeting Notes
Friday, October 25, 2025

Attendees
• John Smith
• Sarah Lee

## Key Decisions    ← USER typed this custom heading!
We decided to:
• Launch in Q1
• Hire 2 engineers

Discussion
• Budget review
• Timeline concerns
```

### Click "Keep My Text" → Switch to "Daily Standup"

**Output**:
```
📝 Your Notes:
## Key Decisions         ← Custom heading preserved! ✅
• John Smith
• Sarah Lee
We decided to:
• Launch in Q1
• Hire 2 engineers
• Budget review
• Timeline concerns
────────────────────────

Daily Standup
Friday, October 25, 2025

Yesterday:
•

Today:
•
```

**What Happened**:
- ✅ "Meeting Notes" removed (template)
- ✅ "Attendees" removed (template)
- ✅ "Discussion" removed (template)
- ✅ "Key Decisions" KEPT (custom!)
- ✅ Date removed
- ✅ All user text preserved

## Template Headers (Removed)

These headings are automatically removed as template structure:

- "Meeting Notes"
- "Attendees"
- "Objective"
- "Discussion"
- "Decisions"
- "Action Items"
- "Next Steps"
- "Daily Standup"
- "Yesterday"
- "Today"
- "Blockers"
- "One-on-One Meeting"
- "Check-in"
- "Discussion Topics"
- "Feedback"
- "Sprint Retrospective"
- "What Went Well"
- "What to Improve"

## Custom Headers (Kept)

Any heading NOT in the list above is considered user-typed and KEPT:

✅ "Key Decisions"
✅ "Important Notes"
✅ "Follow-up Items"
✅ "Budget Items"
✅ "Q4 Goals"
✅ Any other heading you type!

## Console Logging

The console will now show:

```
MeetingNotes: Found 6 headings total
MeetingNotes: Removing 5 template headings, keeping 1 custom headings
```

This tells you exactly how many custom headings were preserved!

## Testing

### Test 1: Custom Heading Preserved

**Setup**:
1. Select "General Meeting" template
2. After "Attendees", add a custom heading: Click Bold (H2 button) and type "Budget Items"
3. Under "Budget Items", type:
   - Server costs
   - Hiring budget
4. Fill other sections normally

**Switch to "Standup" → Click "Keep My Text"**

**Expected Output**:
```
📝 Your Notes:
## Budget Items          ← Your custom heading ✅
• John Smith
• Sarah Lee
• Server costs
• Hiring budget
...
```

**Console Check**:
```
MeetingNotes: Removing 5 template headings, keeping 1 custom headings
```

### Test 2: Multiple Custom Headings

**Setup**:
1. Select "General Meeting"
2. Add 2 custom headings:
   - "Q4 Goals"
   - "Blockers" (even though this matches a template in Standup, it's custom in General Meeting)
3. Fill content under each

**Switch to template → Click "Keep My Text"**

**Expected**: Both custom headings preserved with `## ` prefix

### Test 3: No Custom Headings

**Setup**:
1. Select "General Meeting"
2. Only fill template sections (don't add custom headings)

**Switch to template → Click "Keep My Text"**

**Expected**: No `## ` prefixed items in "Your Notes"

**Console Check**:
```
MeetingNotes: Removing 6 template headings, keeping 0 custom headings
```

## Edge Cases

### Edge Case 1: Heading Contains Template Word

**Scenario**: You type "Discussion of Budget"

**Behavior**: REMOVED (contains "discussion" which is a template header)

**Workaround**: Type "Budget Discussion" or "Budget Topics" instead

### Edge Case 2: Template Name as Part of Custom Heading

**Scenario**: You type "Meeting Notes Follow-up"

**Behavior**: REMOVED (contains "meeting notes")

**Workaround**: Type "Follow-up Notes" or "Additional Notes"

### Edge Case 3: Template Header in Different Case

**Scenario**: Template has "Action Items" (title case)
User types "action items" (lowercase)

**Behavior**: REMOVED (case-insensitive matching)

**This is correct**: If you manually type a template header name, it should be removed

## How Headings Appear in "Your Notes"

Custom headings use `## ` markdown-style prefix:

```
📝 Your Notes:
## My Custom Heading 1
• List item under heading 1

## My Custom Heading 2
Some paragraph text
• List item under heading 2
```

This makes them stand out from regular text while being easy to copy/paste into template sections.

## Files Changed

**sidepanel.js** - Lines 287-377

**Changes**:
1. Added `templateHeaders` array with known template headings
2. Changed logic to only remove headings that match template names
3. Added tracking: `templateHeadingsRemoved` vs `customHeadingsKept`
4. Added console log showing how many of each type
5. Added extraction for custom headings with `## ` prefix

## Summary

✅ **Before**: ALL headings removed (including custom ones)
✅ **After**: ONLY template headings removed, custom headings preserved
✅ **Format**: Custom headings appear with `## ` prefix in "Your Notes"
✅ **Console**: Shows count of template vs custom headings

---

**Issue**: Custom headings being removed with template headings
**Fix**: Smart detection - only remove known template headers
**Status**: ✅ Fixed
**Date**: 2025-10-25

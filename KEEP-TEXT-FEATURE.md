# Keep My Text Feature - Template Switching

## New Feature Added

When switching templates, you now have **3 options** instead of 2:

1. **✨ Keep My Text** ← NEW! (Recommended)
2. **📌 Append Template**
3. **🔄 Replace All Notes**

## How "Keep My Text" Works

### The Problem It Solves

**Before**: When you typed notes in the "General Meeting" template and switched to "Daily Standup", your text was mixed with old template formatting. You'd have to manually clean it up.

**Now**: The extension intelligently:
1. Extracts ONLY your typed content
2. Removes template headers and empty bullets
3. Applies the new template fresh
4. Puts your text in a highlighted box at the top

### Example

**You start with "General Meeting" template:**
```
Meeting Notes
October 25, 2025

Attendees:
• John typed this
• Sarah typed this

Objective:
Discuss Q4 goals

Discussion:
• User typed point 1
• User typed point 2

Action Items:
☐ User typed action 1
```

**You switch to "Daily Standup" template and click "✨ Keep My Text":**
```
┌────────────────────────────────────────┐
│ 📝 Your Notes:                         │
│ John typed this                        │
│ Sarah typed this                       │
│ Discuss Q4 goals                       │
│ User typed point 1                     │
│ User typed point 2                     │
│ User typed action 1                    │
└────────────────────────────────────────┘

Daily Standup
October 25, 2025

Yesterday:
•

Today:
•

Blockers:
•
```

## Technical Details

### Smart Content Extraction

The `extractUserContent()` function:

1. **Removes template headers** that match common patterns:
   - "Meeting Notes", "Attendees", "Objective", "Discussion"
   - "Daily Standup", "Yesterday", "Today", "Blockers"
   - "One-on-One Meeting", "Sprint Retrospective", etc.

2. **Removes empty template items**:
   - Empty list items (`<li></li>`)
   - Empty checkboxes (`<li>☐ </li>`)
   - Template placeholders

3. **Preserves user content**:
   - All text you typed
   - Line breaks preserved
   - Displayed in highlighted box at top of new template

### Code Implementation

**New function - Extract user content:**
```javascript
function extractUserContent() {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = notesEditor.innerHTML;

  // Remove template headers
  const templateHeaders = ['meeting notes', 'attendees', 'objective',
                          'discussion', 'decisions', 'action items', ...];

  tempDiv.querySelectorAll('h1, h2, h3').forEach(heading => {
    const text = heading.textContent.trim();
    if (templateHeaders.some(header => text.toLowerCase().includes(header))) {
      heading.remove();
    }
  });

  // Remove empty list items
  tempDiv.querySelectorAll('li').forEach(li => {
    const text = li.textContent.trim();
    if (text === '' || text === '☐' || text === '☐ ') {
      li.remove();
    }
  });

  return tempDiv.textContent.trim();
}
```

**New function - Apply template and keep text:**
```javascript
function handleTemplateReplaceKeepText() {
  // Extract user's text (without template formatting)
  const userContent = extractUserContent();

  // Clear everything
  notesEditor.innerHTML = '';
  notesEditor.style.cssText = '';

  // Apply new template
  notesEditor.innerHTML = template.content;

  // Add user content in highlighted box at top
  if (userContent) {
    const userSection = `<div style="background: #FFF9E6; padding: 12px;
                          border-radius: 6px; margin-bottom: 16px;
                          border-left: 3px solid #F59E0B;">
                          <strong>📝 Your Notes:</strong><br>
                          ${userContent.replace(/\n/g, '<br>')}</div>`;
    notesEditor.innerHTML = userSection + notesEditor.innerHTML;
  }
}
```

## Modal Button Order

The buttons are ordered by most common to least common use case:

1. **✨ Keep My Text** (Green) - Most users want this when switching templates
2. **📌 Append Template** (Blue) - When you want both old and new templates
3. **🔄 Replace All Notes** (Red) - When you want to completely start over
4. **✖️ Cancel** (Gray) - Changed your mind

## Visual Design

### Keep My Text Button
- **Color**: Green (`#10B981`) - Success/positive action
- **Icon**: ✨ (sparkles) - Indicates smart/magic extraction
- **Description**: "Remove template formatting but keep your typed content at the top"

### User Content Box
When your text is preserved, it appears in a highlighted box:
- **Background**: Light yellow (`#FFF9E6`) - Stands out but not distracting
- **Border**: Left border in orange (`#F59E0B`) - Visual accent
- **Label**: "📝 Your Notes:" - Clear indication this is your content
- **Position**: Top of document - Easy to find and edit

## Use Cases

### Use Case 1: Wrong Template Selected
**Scenario**: You started with "1-on-1 Meeting" but it's actually a standup.

**Action**:
1. Select "Daily Standup" template
2. Click "✨ Keep My Text"
3. Your typed notes move to the top
4. Edit into standup format

### Use Case 2: Meeting Type Changed Mid-Meeting
**Scenario**: Meeting started as general discussion, now needs action items template.

**Action**:
1. Select "Action Items" template
2. Click "✨ Keep My Text"
3. Your discussion notes preserved at top
4. Start filling action items template below

### Use Case 3: Consolidating Multiple Templates
**Scenario**: You tried multiple templates, want to keep all content with new structure.

**Action**:
1. Click "📌 Append Template" multiple times OR
2. Use "✨ Keep My Text" to extract just your content across all templates

## Testing the Feature

### Test 1: Basic Text Preservation
1. Select "General Meeting" template
2. Type notes under "Attendees" and "Discussion"
3. Switch to "Daily Standup"
4. Click "✨ Keep My Text"
5. **Expected**: Your typed names and discussion points appear in yellow box at top

### Test 2: Empty Template Items Removed
1. Select "Action Items" template
2. Fill in 2 action items, leave 3rd empty (`☐ `)
3. Switch to "General Meeting"
4. Click "✨ Keep My Text"
5. **Expected**: Only your 2 filled action items appear, empty one is removed

### Test 3: Template Headers Removed
1. Select "Sprint Retrospective"
2. Type under "What Went Well" and "What to Improve"
3. Switch to "1-on-1"
4. Click "✨ Keep My Text"
5. **Expected**: Template headers "What Went Well" removed, only your text preserved

### Test 4: Comparing All 3 Options
**Setup**: Fill out "Meeting Notes" template with content

**Test "✨ Keep My Text"**:
- Result: Text extracted, new template applied, content at top

**Test "📌 Append Template"**:
- Result: Old template + separator line + new template

**Test "🔄 Replace All Notes"**:
- Result: Everything deleted, fresh new template

## Files Changed

### sidepanel.js
**New functions added:**
- `extractUserContent()` - Intelligently extracts user text (lines 277-315)
- `handleTemplateReplaceKeepText()` - Applies template with text preservation (lines 317-350)

**Updated function:**
- Event listener setup to include new button (line 483-486)

### sidepanel.html
**New button added:**
- "✨ Keep My Text" button at top of modal options (lines 175-178)
- Green color scheme, left-aligned, clear description

## Known Limitations

1. **Complex Formatting**: Bold/italic/underline in your text is not preserved (extracted as plain text)
2. **Nested Lists**: Multi-level bullet points are flattened to single level
3. **Tables**: Tables are converted to plain text
4. **Images**: Images are not extracted (template switching is text-only)

**Rationale**: These limitations are intentional to provide a clean slate with the new template. If you need rich formatting, use "📌 Append Template" instead.

## Future Enhancements

Possible improvements:
- [ ] Option to preserve basic formatting (bold, italic)
- [ ] Detect which template sections contain user content
- [ ] Smarter mapping between similar template sections (e.g., "Attendees" → "Attendees")
- [ ] User-editable list of template headers to ignore

---

**Feature**: Keep My Text when switching templates
**Status**: ✅ Implemented
**Date**: 2025-10-25
**Recommended Use**: Default choice when switching templates with existing content

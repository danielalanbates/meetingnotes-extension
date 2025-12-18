// MeetingNotes - Side Panel Script
// Powerful note-taking with templates, themes, and premium features (no LLM)

const BASE_TEMPLATES = {
  blank: {
    id: 'blank',
    title: 'Blank',
    content: ''
  },
  general: {
    id: 'general',
    title: 'General Meeting',
    content: `<h1>Meeting Notes</h1><p>${formatDateHeading()}</p><h2>Attendees</h2><ul><li></li></ul><h2>Objective</h2><p></p><h2>Discussion</h2><ul><li></li></ul><h2>Decisions</h2><ul><li></li></ul><h2>Action Items</h2><ul><li>☐ </li></ul><h2>Next Steps</h2><ul><li></li></ul>`
  },
  standup: {
    id: 'standup',
    title: 'Daily Standup',
    content: `<h1>Daily Standup</h1><p>${formatDateHeading()}</p><h2>Yesterday</h2><ul><li></li></ul><h2>Today</h2><ul><li></li></ul><h2>Blockers</h2><ul><li></li></ul>`
  },
  '1on1': {
    id: '1on1',
    title: 'One-on-One',
    content: `<h1>One-on-One Meeting</h1><p>${formatDateHeading()}</p><h2>Check-in</h2><p></p><h2>Discussion Topics</h2><ul><li></li></ul><h2>Feedback</h2><p></p><h2>Action Items</h2><ul><li>☐ </li></ul>`
  },
  retrospective: {
    id: 'retrospective',
    title: 'Retrospective',
    content: `<h1>Sprint Retrospective</h1><p>${formatDateHeading()}</p><h2>What Went Well</h2><ul><li></li></ul><h2>What to Improve</h2><ul><li></li></ul><h2>Action Items</h2><ul><li>☐ </li></ul>`
  }
};

// Global variables
let notesEditor;
let autoSaveTimer;
let autoSaveEnabled = true;
let notesHistory = [];
let currentTheme = 'blue';
let pendingTemplateId = null;
let currentTemplateId = 'blank'; // Track current template

function formatDateHeading() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Simple MeetingNotes - Initializing...');

  notesEditor = document.getElementById('notesEditor');

  if (!notesEditor) {
    console.error('Notes editor not found!');
    return;
  }

  // Load saved data
  await loadSettings();
  await loadCurrentNotes();
  await loadHistory();
  await updateMeetingStatus();

  // Setup event listeners
  setupToolbarButtons();
  setupTemplateSelector();
  setupActionButtons();
  setupModals();
  setupAutoSave();
  setupCharCounter();
  setupThemeSwitcher();

  // Load and apply theme
  await loadTheme();

  console.log('MeetingNotes - Initialized successfully');
});

// Load settings from storage
async function loadSettings() {
  try {
    const result = await chrome.storage.local.get(['settings']);
    if (result.settings) {
      autoSaveEnabled = result.settings.autoSave !== false;

      // Update auto-save toggle if it exists
      const autoSaveToggle = document.getElementById('toggleAutoSave');
      if (autoSaveToggle) {
        autoSaveToggle.checked = autoSaveEnabled;
      }

      // Load per-platform auto-open settings
      const autoOpenPlatforms = result.settings.autoOpenPlatforms || {};
      document.querySelectorAll('.toggle-platform').forEach(toggle => {
        const platform = toggle.dataset.platform;
        // Default to true if not set
        toggle.checked = autoOpenPlatforms[platform] !== false;
      });
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

// Load current notes from storage
async function loadCurrentNotes() {
  try {
    const result = await chrome.storage.local.get(['currentNotes']);
    if (result.currentNotes && notesEditor) {
      notesEditor.innerHTML = result.currentNotes;
      updateCharCount();
    }
  } catch (error) {
    console.error('Error loading current notes:', error);
  }
}

// Load notes history
async function loadHistory() {
  try {
    const result = await chrome.storage.local.get(['notesHistory']);
    notesHistory = result.notesHistory || [];
  } catch (error) {
    console.error('Error loading history:', error);
  }
}

// Update meeting status display
async function updateMeetingStatus() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab || !tab.url) {
      console.log('MeetingNotes: No active tab found');
      return;
    }

    const url = tab.url.toLowerCase();
    console.log('MeetingNotes: Checking URL:', tab.url);
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    const meetingDetails = document.getElementById('meetingDetails');
    const meetingTitle = document.getElementById('meetingTitle');
    const meetingPlatform = document.getElementById('meetingPlatform');

    let platform = null;

    // Check all supported platforms (matches content.js detection)
    if (url.includes('zoom.us')) {
      platform = 'Zoom';
    } else if (url.includes('meet.google.com')) {
      platform = 'Google Meet';
    } else if (url.includes('teams.microsoft.com') || url.includes('teams.live.com')) {
      platform = 'Microsoft Teams';
    } else if (url.includes('webex.com')) {
      platform = 'Webex';
    } else if (url.includes('whereby.com')) {
      platform = 'Whereby';
    } else if (url.includes('bluejeans.com')) {
      platform = 'BlueJeans';
    } else if (url.includes('gotomeeting.com')) {
      platform = 'GoToMeeting';
    } else if (url.includes('ringcentral.com')) {
      platform = 'RingCentral';
    } else if (url.includes('skype.com')) {
      platform = 'Skype';
    } else if (url.includes('slack.com')) {
      platform = 'Slack';
    } else if (url.includes('dialpad.com')) {
      platform = 'Dialpad';
    } else if (url.includes('chime.aws')) {
      platform = 'Amazon Chime';
    } else if (url.includes('discord.com')) {
      platform = 'Discord';
    } else if (url.includes('jitsi') || url.includes('meet.jit.si')) {
      platform = 'Jitsi Meet';
    } else if (url.includes('around.co')) {
      platform = 'Around';
    }

    console.log('MeetingNotes: Platform detected:', platform || 'none');

    if (platform && statusDot && statusText && meetingDetails) {
      statusDot.classList.add('active');
      statusText.textContent = `In ${platform} meeting`;
      meetingDetails.style.display = 'block';

      if (meetingPlatform) {
        meetingPlatform.textContent = platform;
      }

      if (meetingTitle) {
        meetingTitle.textContent = tab.title || 'Meeting';
      }
    } else if (statusDot && statusText && meetingDetails) {
      statusDot.classList.remove('active');
      statusText.textContent = 'No Meeting Detected';
      meetingDetails.style.display = 'none';
    }
  } catch (error) {
    console.error('Error updating meeting status:', error);
  }
}

// Setup toolbar formatting buttons
function setupToolbarButtons() {
  const toolbarButtons = document.querySelectorAll('.toolbar-btn[data-command]');

  toolbarButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      const command = button.dataset.command;

      if (command) {
        document.execCommand(command, false, null);
        notesEditor.focus();
      }
    });
  });

  // Add keyboard shortcuts
  notesEditor.addEventListener('keydown', (e) => {
    // Check for Ctrl/Cmd + Shift + 7 (bullet list)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === '7') {
      e.preventDefault();
      document.execCommand('insertUnorderedList', false, null);
    }
    // Check for Ctrl/Cmd + Shift + 8 (numbered list)
    else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === '8') {
      e.preventDefault();
      document.execCommand('insertOrderedList', false, null);
    }
  });
}

// Setup template selector
function setupTemplateSelector() {
  const templateSelect = document.getElementById('templateSelect');

  if (!templateSelect) return;

  templateSelect.addEventListener('change', (e) => {
    const templateId = e.target.value;
    applyTemplate(templateId);
  });
}

// Apply a template to the editor
function applyTemplate(templateId) {
  const template = BASE_TEMPLATES[templateId];

  if (!template) {
    console.error('Template not found:', templateId);
    return;
  }

  // Check if editor has any content (even just whitespace or placeholder)
  const hasContent = notesEditor.innerHTML.trim() !== '' &&
                     notesEditor.innerHTML.trim() !== '<br>' &&
                     notesEditor.textContent.trim() !== '';

  // Always show modal if there's content, even if selecting the same template
  // This gives user control over whether to append, replace, or keep existing text
  if (hasContent) {
    // Show modal for append/replace/keep choice
    pendingTemplateId = templateId;
    openModal('templateApplyModal');
  } else {
    // No existing content, just apply template
    notesEditor.innerHTML = template.content;
    currentTemplateId = templateId; // Track current template
    notesEditor.focus();

    // Trigger auto-save
    if (autoSaveEnabled) {
      saveCurrentNotes();
    }

    updateCharCount();
  }
}

// Handle template append
function handleTemplateAppend() {
  if (!pendingTemplateId) return;

  const template = BASE_TEMPLATES[pendingTemplateId];
  if (template) {
    const separator = '<hr>';
    notesEditor.innerHTML += separator + template.content;
    currentTemplateId = pendingTemplateId; // Track current template
    notesEditor.focus();

    if (autoSaveEnabled) {
      saveCurrentNotes();
    }

    updateCharCount();
  }

  pendingTemplateId = null;
  closeModal('templateApplyModal');
}

// Extract user-typed content (strip template structure)
function extractUserContent() {
  console.log('MeetingNotes: extractUserContent called');
  console.log('MeetingNotes: Current editor HTML:', notesEditor.innerHTML.substring(0, 200) + '...');

  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = notesEditor.innerHTML;

  // Check if this is blank template (no template structure at all)
  const hasNoTemplateStructure = !tempDiv.querySelector('h1, h2, h3');
  console.log('MeetingNotes: Is blank template (no headings):', hasNoTemplateStructure);

  // If blank template, return all content as user content
  if (hasNoTemplateStructure) {
    const allText = tempDiv.textContent.trim();
    console.log('MeetingNotes: Blank template - extracting all text as user content');
    return allText;
  }

  const elementsToRemove = [];

  // Remove ONLY template headings, keep user-typed custom headings
  const templateHeaders = [
    'meeting notes', 'attendees', 'objective', 'discussion', 'decisions',
    'action items', 'next steps', 'daily standup', 'yesterday', 'today',
    'blockers', 'one-on-one meeting', 'check-in', 'discussion topics',
    'feedback', 'sprint retrospective', 'what went well', 'what to improve'
  ];

  const headings = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6');
  console.log('MeetingNotes: Found', headings.length, 'headings total');

  let templateHeadingsRemoved = 0;
  let customHeadingsKept = 0;

  headings.forEach(heading => {
    const text = heading.textContent.trim().toLowerCase();
    // Only remove if it matches a known template header
    if (templateHeaders.some(header => text === header || text.includes(header))) {
      elementsToRemove.push(heading);
      templateHeadingsRemoved++;
    } else {
      // Keep custom heading - user typed this!
      customHeadingsKept++;
    }
  });

  console.log('MeetingNotes: Removing', templateHeadingsRemoved, 'template headings, keeping', customHeadingsKept, 'custom headings');

  // Remove paragraphs that contain dates (template timestamps)
  const paragraphs = tempDiv.querySelectorAll('p');
  console.log('MeetingNotes: Found', paragraphs.length, 'paragraphs total');
  paragraphs.forEach(p => {
    const text = p.textContent.trim();
    // Match date patterns like "Friday, October 25, 2025" or "October 25, 2025"
    const datePattern = /(monday|tuesday|wednesday|thursday|friday|saturday|sunday|january|february|march|april|may|june|july|august|september|october|november|december)/i;
    if (datePattern.test(text) || text === '') {
      elementsToRemove.push(p);
    }
  });

  // Remove empty list items (just bullets with no text or just checkbox)
  const listItems = tempDiv.querySelectorAll('li');
  console.log('MeetingNotes: Found', listItems.length, 'list items total');
  listItems.forEach(li => {
    const text = li.textContent.trim();
    if (text === '' || text === '☐' || text === '☐ ' || text === '•' || text === '-') {
      elementsToRemove.push(li);
    }
  });

  // Remove horizontal rules
  tempDiv.querySelectorAll('hr').forEach(hr => {
    elementsToRemove.push(hr);
  });

  // Remove the elements
  console.log('MeetingNotes: Removing', elementsToRemove.length, 'template elements');
  elementsToRemove.forEach(el => el.remove());

  // Collect remaining user content from headings, lists, and paragraphs
  const userContent = [];

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

  // Get custom headings (that weren't removed) - preserve HTML formatting
  const remainingHeadings = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6');
  console.log('MeetingNotes: Remaining headings after removal:', remainingHeadings.length);
  remainingHeadings.forEach(heading => {
    const text = heading.textContent.trim();
    if (text) {
      console.log('MeetingNotes: Adding custom heading:', text);
      // Preserve the heading HTML instead of converting to markdown
      const tagName = heading.tagName.toLowerCase();
      userContent.push(`<${tagName}>${heading.innerHTML}</${tagName}>`);
    }
  });

  // Get text from list items that have actual content
  const remainingListItems = tempDiv.querySelectorAll('li');
  console.log('MeetingNotes: Remaining list items after removal:', remainingListItems.length);
  remainingListItems.forEach(li => {
    let text = li.textContent.trim();
    // Remove checkbox, bullets, or hyphens if present at start
    text = text.replace(/^[☐•\-\*]\s*/, '');
    if (text) {
      console.log('MeetingNotes: Adding list item:', text);
      userContent.push('• ' + text);
    }
  });

  // Get text from remaining paragraphs (skip "Your Notes:" label)
  const remainingParagraphs = tempDiv.querySelectorAll('p');
  console.log('MeetingNotes: Remaining paragraphs after removal:', remainingParagraphs.length);
  remainingParagraphs.forEach(p => {
    const text = p.textContent.trim();
    // Skip the "Your Notes:" label paragraph
    if (text && text !== '📝 Your Notes:' && !text.startsWith('📝 Your Notes:')) {
      console.log('MeetingNotes: Adding paragraph:', text);
      userContent.push(text);
    } else if (text) {
      console.log('MeetingNotes: Skipping paragraph (Your Notes label):', text);
    }
  });

  // Extract content from "Your Notes" div sections
  // Look for divs that have the pattern: parent div with border-bottom containing content div
  const yourNotesDivs = tempDiv.querySelectorAll('div[style*="border-bottom"]');
  console.log('MeetingNotes: Found Your Notes sections:', yourNotesDivs.length);
  yourNotesDivs.forEach((parentDiv, index) => {
    // This is a "Your Notes" section container
    // Find the content div inside (it's the second div, after the <p> label)
    const contentDivs = parentDiv.querySelectorAll('div');
    console.log(`MeetingNotes: Your Notes section ${index + 1} has ${contentDivs.length} content divs`);
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
          console.log('MeetingNotes: Adding Your Notes content:', text.substring(0, 50) + '...');
          userContent.push(text);
        }
      }
    });
  });

  // Join with <br> instead of \n since we're mixing HTML and text
  const result = userContent.join('<br>');
  console.log('MeetingNotes: Extracted user content:', result.substring(0, 100) + '...');
  return result;
}

// Handle template replace (keeps user text)
function handleTemplateReplaceKeepText() {
  if (!pendingTemplateId) return;

  const template = BASE_TEMPLATES[pendingTemplateId];
  if (template) {
    console.log('MeetingNotes: Starting text extraction...');

    // Extract user's text content (without template formatting)
    const userContent = extractUserContent();
    console.log('MeetingNotes: User content extracted:', userContent ? 'YES' : 'NO', '(length:', userContent.length, ')');

    // Clear all content and formatting
    notesEditor.innerHTML = '';
    notesEditor.style.cssText = '';

    // Check if switching TO blank template
    const isSwitchingToBlank = pendingTemplateId === 'blank';
    console.log('MeetingNotes: Switching to blank template:', isSwitchingToBlank);

    // Apply new template
    notesEditor.innerHTML = template.content;
    currentTemplateId = pendingTemplateId; // Track current template
    console.log('MeetingNotes: New template applied');

    // If user had content, add it
    if (userContent && userContent.length > 0) {
      if (isSwitchingToBlank) {
        // When switching TO blank, just put the content as HTML (no "Your Notes" box)
        // Content already has <br> tags from join, so no need to replace \n
        notesEditor.innerHTML = userContent;
        console.log('MeetingNotes: User content added as HTML (blank template)');
      } else {
        // Check if template already has "Your Notes" sections from previous switches
        const hasExistingNotes = notesEditor.innerHTML.includes('📝 Your Notes:');
        console.log('MeetingNotes: Template has existing Your Notes sections:', hasExistingNotes);

        // Create separator to add AFTER new notes IF there are existing notes below
        const separatorAfter = hasExistingNotes ? '<hr style="margin: 24px 0; border: none; border-top: 2px dashed #D1D5DB;">' : '';

        // Content is already HTML with <br> tags, so just insert it directly
        const userSection = `<div style="margin-bottom: 20px; padding-bottom: 16px; border-bottom: 2px solid #E5E7EB;">
          <p style="color: #6B7280; font-size: 13px; margin-bottom: 8px;"><strong>📝 Your Notes:</strong></p>
          <div>${userContent}</div>
        </div>${separatorAfter}`;

        notesEditor.innerHTML = userSection + notesEditor.innerHTML;
        console.log('MeetingNotes: User content added to top', hasExistingNotes ? '(with separator after)' : '(first notes)');
      }
    } else {
      console.log('MeetingNotes: No user content to add');
    }

    notesEditor.focus();

    if (autoSaveEnabled) {
      saveCurrentNotes();
    }

    updateCharCount();
  }

  pendingTemplateId = null;
  closeModal('templateApplyModal');
}

// Handle template replace (discard everything)
function handleTemplateReplace() {
  if (!pendingTemplateId) return;

  const template = BASE_TEMPLATES[pendingTemplateId];
  if (template) {
    // Clear all content and formatting first
    notesEditor.innerHTML = '';

    // Remove any residual formatting
    notesEditor.style.cssText = '';

    // Apply new template with fresh formatting
    notesEditor.innerHTML = template.content;
    currentTemplateId = pendingTemplateId; // Track current template
    notesEditor.focus();

    if (autoSaveEnabled) {
      saveCurrentNotes();
    }

    updateCharCount();
  }

  pendingTemplateId = null;
  closeModal('templateApplyModal');
}

// Handle template cancel
function handleTemplateCancel() {
  // Reset template selector to blank
  const templateSelect = document.getElementById('templateSelect');
  if (templateSelect) {
    templateSelect.value = 'blank';
  }

  pendingTemplateId = null;
  closeModal('templateApplyModal');
}

// Setup action buttons
function setupActionButtons() {
  // Clear button
  const clearBtn = document.getElementById('clearBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (confirm('Clear all notes? This cannot be undone.')) {
        notesEditor.innerHTML = '';
        notesEditor.focus();
        saveCurrentNotes();
        updateCharCount();
      }
    });
  }

  // Export button
  const exportBtn = document.getElementById('exportBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      openModal('exportModal');
    });
  }

  // Save button
  const saveBtn = document.getElementById('saveBtn');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      promptForNoteTitle();
    });
  }

  // View history button
  const viewHistoryBtn = document.getElementById('viewHistoryBtn');
  if (viewHistoryBtn) {
    viewHistoryBtn.addEventListener('click', () => {
      displayHistory();
      openModal('historyModal');
    });
  }

  // Settings button
  const settingsBtn = document.getElementById('settingsBtn');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      openModal('settingsModal');
    });
  }
}

// Setup modals
function setupModals() {
  // Export modal options
  const exportOptions = document.querySelectorAll('.export-option[data-format]');
  exportOptions.forEach(option => {
    option.addEventListener('click', () => {
      const format = option.dataset.format;
      exportNotes(format);
      closeModal('exportModal');
    });
  });

  // Close buttons
  const closeButtons = document.querySelectorAll('.close-btn');
  closeButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const modal = e.target.closest('.modal');
      if (modal) {
        closeModal(modal.id);
      }
    });
  });

  // Click outside to close
  const modals = document.querySelectorAll('.modal');
  modals.forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal(modal.id);
      }
    });
  });

  // Auto-save toggle
  const autoSaveToggle = document.getElementById('toggleAutoSave');
  if (autoSaveToggle) {
    autoSaveToggle.addEventListener('change', (e) => {
      autoSaveEnabled = e.target.checked;
      saveSettings();
    });
  }

  // Per-platform auto-open toggles
  document.querySelectorAll('.toggle-platform').forEach(toggle => {
    toggle.addEventListener('change', () => {
      saveSettings();
    });
  });

  // Template apply modal buttons
  const replaceKeepTextBtn = document.getElementById('replaceKeepTextBtn');
  if (replaceKeepTextBtn) {
    replaceKeepTextBtn.addEventListener('click', handleTemplateReplaceKeepText);
  }

  const appendTemplateBtn = document.getElementById('appendTemplateBtn');
  if (appendTemplateBtn) {
    appendTemplateBtn.addEventListener('click', handleTemplateAppend);
  }

  const replaceTemplateBtn = document.getElementById('replaceTemplateBtn');
  if (replaceTemplateBtn) {
    replaceTemplateBtn.addEventListener('click', handleTemplateReplace);
  }

  const cancelTemplateBtn = document.getElementById('cancelTemplateBtn');
  if (cancelTemplateBtn) {
    cancelTemplateBtn.addEventListener('click', handleTemplateCancel);
  }

  // Save title modal buttons
  const confirmSaveBtn = document.getElementById('confirmSaveBtn');
  if (confirmSaveBtn) {
    confirmSaveBtn.addEventListener('click', handleConfirmSave);
  }

  const cancelSaveBtn = document.getElementById('cancelSaveBtn');
  if (cancelSaveBtn) {
    cancelSaveBtn.addEventListener('click', () => {
      closeModal('saveTitleModal');
    });
  }

  // Allow Enter key to save in title input
  const noteTitleInput = document.getElementById('noteTitleInput');
  if (noteTitleInput) {
    noteTitleInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        handleConfirmSave();
      }
    });
  }
}

// Setup auto-save functionality
function setupAutoSave() {
  if (!notesEditor) return;

  notesEditor.addEventListener('input', () => {
    if (autoSaveEnabled) {
      clearTimeout(autoSaveTimer);
      autoSaveTimer = setTimeout(() => {
        saveCurrentNotes();
      }, 1000); // Save 1 second after user stops typing
    }
  });
}

// Setup character counter
function setupCharCounter() {
  if (!notesEditor) return;

  notesEditor.addEventListener('input', updateCharCount);
  updateCharCount();
}

// Update character count display
function updateCharCount() {
  const charCount = document.getElementById('charCount');
  if (!charCount || !notesEditor) return;

  const text = notesEditor.innerText || '';
  const count = text.length;

  charCount.textContent = `${count} character${count !== 1 ? 's' : ''}`;
}

// Save current notes to storage
async function saveCurrentNotes() {
  try {
    const content = notesEditor.innerHTML;
    await chrome.storage.local.set({ currentNotes: content });
  } catch (error) {
    console.error('Error saving current notes:', error);
  }
}

// Prompt user for note title
function promptForNoteTitle() {
  const content = notesEditor.innerHTML.trim();

  if (!content) {
    alert('Cannot save empty notes.');
    return;
  }

  // Clear previous input and open modal
  const noteTitleInput = document.getElementById('noteTitleInput');
  if (noteTitleInput) {
    noteTitleInput.value = '';
    noteTitleInput.focus();
  }

  openModal('saveTitleModal');
}

// Handle confirm save button
async function handleConfirmSave() {
  const noteTitleInput = document.getElementById('noteTitleInput');
  const customTitle = noteTitleInput?.value.trim() || '';

  if (!customTitle) {
    alert('Please enter a title for your note.');
    return;
  }

  closeModal('saveTitleModal');
  await saveToHistory(customTitle);
}

// Save notes to history
async function saveToHistory(customTitle = null) {
  const content = notesEditor.innerHTML.trim();

  if (!content) {
    alert('Cannot save empty notes.');
    return;
  }

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    const noteEntry = {
      id: Date.now(),
      content: content,
      timestamp: new Date().toISOString(),
      platform: detectPlatform(tab?.url || ''),
      title: customTitle || tab?.title || 'Untitled Meeting'
    };

    notesHistory.unshift(noteEntry);

    // Keep only last 100 notes
    if (notesHistory.length > 100) {
      notesHistory = notesHistory.slice(0, 100);
    }

    await chrome.storage.local.set({ notesHistory: notesHistory });

    alert('Notes saved to history!');
  } catch (error) {
    console.error('Error saving to history:', error);
    alert('Error saving notes. Please try again.');
  }
}

// Detect platform from URL
function detectPlatform(url) {
  const urlLower = url.toLowerCase();

  if (urlLower.includes('zoom.us')) return 'Zoom';
  if (urlLower.includes('meet.google.com')) return 'Google Meet';
  if (urlLower.includes('teams.microsoft.com')) return 'Microsoft Teams';
  if (urlLower.includes('webex.com')) return 'Webex';
  if (urlLower.includes('whereby.com')) return 'Whereby';
  if (urlLower.includes('bluejeans.com')) return 'BlueJeans';
  if (urlLower.includes('gotomeeting.com')) return 'GoToMeeting';
  if (urlLower.includes('ringcentral.com')) return 'RingCentral';
  if (urlLower.includes('skype.com')) return 'Skype';
  if (urlLower.includes('slack.com')) return 'Slack';
  if (urlLower.includes('dialpad.com')) return 'Dialpad';
  if (urlLower.includes('chime.aws')) return 'Amazon Chime';
  if (urlLower.includes('discord.com')) return 'Discord';
  if (urlLower.includes('jitsi') || urlLower.includes('meet.jit.si')) return 'Jitsi Meet';
  if (urlLower.includes('around.co')) return 'Around';

  return 'Other';
}

// Display history in modal
function displayHistory() {
  const historyList = document.getElementById('historyList');

  if (!historyList) return;

  historyList.innerHTML = '';

  if (notesHistory.length === 0) {
    historyList.innerHTML = '<p class="empty-state">No saved notes yet. Click "Save Note" to add your first note to history.</p>';
    return;
  }

  notesHistory.forEach(note => {
    const item = document.createElement('div');
    item.className = 'history-item';

    const date = new Date(note.timestamp);
    const dateStr = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    item.innerHTML = `
      <div class="history-item-header">
        <strong>${escapeHtml(note.title)}</strong>
        <span class="history-date">${dateStr}</span>
      </div>
      <div class="history-platform">${note.platform}</div>
      <div class="history-actions">
        <button class="btn btn-secondary btn-sm" data-action="load" data-id="${note.id}">Load</button>
        <button class="btn btn-danger btn-sm" data-action="delete" data-id="${note.id}">Delete</button>
      </div>
    `;

    historyList.appendChild(item);
  });

  // Setup action buttons
  historyList.querySelectorAll('[data-action="load"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const noteId = parseInt(btn.dataset.id);
      loadFromHistory(noteId);
      closeModal('historyModal');
    });
  });

  historyList.querySelectorAll('[data-action="delete"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const noteId = parseInt(btn.dataset.id);
      deleteFromHistory(noteId);
    });
  });
}

// Load note from history
function loadFromHistory(noteId) {
  const note = notesHistory.find(n => n.id === noteId);

  if (!note) {
    alert('Note not found.');
    return;
  }

  if (notesEditor.innerHTML.trim() !== '') {
    if (!confirm('Loading this note will replace your current notes. Continue?')) {
      return;
    }
  }

  notesEditor.innerHTML = note.content;
  saveCurrentNotes();
  updateCharCount();
}

// Delete note from history
async function deleteFromHistory(noteId) {
  if (!confirm('Delete this note from history?')) {
    return;
  }

  notesHistory = notesHistory.filter(n => n.id !== noteId);

  await chrome.storage.local.set({ notesHistory: notesHistory });

  displayHistory();
}

// Export notes in various formats
function exportNotes(format) {
  const content = notesEditor.innerHTML.trim();

  if (!content) {
    alert('Cannot export empty notes.');
    return;
  }

  let filename = `meeting-notes-${new Date().toISOString().split('T')[0]}`;
  let blob;
  let mimeType;

  switch (format) {
    case 'email':
      // Convert HTML to plain text for email body
      const emailText = htmlToPlainText(content);
      const subject = encodeURIComponent('Meeting Notes - ' + new Date().toLocaleDateString());
      const body = encodeURIComponent(emailText);
      // Open default email client with pre-filled content
      window.location.href = `mailto:?subject=${subject}&body=${body}`;
      return; // Don't download

    case 'txt':
      const plainText = htmlToPlainText(content);
      blob = new Blob([plainText], { type: 'text/plain' });
      filename += '.txt';
      mimeType = 'text/plain';
      break;

    case 'md':
      const markdown = htmlToMarkdown(content);
      blob = new Blob([markdown], { type: 'text/markdown' });
      filename += '.md';
      mimeType = 'text/markdown';
      break;

    case 'html':
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Meeting Notes</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.6; }
    h1 { color: #333; border-bottom: 2px solid #4A90E2; padding-bottom: 10px; }
    h2 { color: #555; margin-top: 30px; }
    ul { margin: 10px 0; padding-left: 30px; }
    li { margin: 5px 0; }
  </style>
</head>
<body>
${content}
</body>
</html>`;
      blob = new Blob([html], { type: 'text/html' });
      filename += '.html';
      mimeType = 'text/html';
      break;

    case 'docx':
      // Export as HTML that Word can open (.doc format)
      const docHtml = `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head><meta charset='utf-8'><title>Meeting Notes</title></head>
<body>${content}</body>
</html>`;
      blob = new Blob([docHtml], { type: 'application/msword' });
      filename += '.doc';
      mimeType = 'application/msword';
      break;

    case 'gdoc':
      // Open Google Docs - user can manually paste
      alert('Opening Google Docs...\n\nYour notes have been copied to clipboard. Paste them into the new Google Doc.');
      const gdocMarkdown = htmlToMarkdown(content);
      navigator.clipboard.writeText(gdocMarkdown);
      window.open('https://docs.google.com/document/create', '_blank');
      return; // Don't download

    case 'pages':
      // Export as RTF which Pages can open
      const rtfContent = htmlToRTF(content);
      blob = new Blob([rtfContent], { type: 'application/rtf' });
      filename += '.rtf';
      mimeType = 'application/rtf';
      break;

    default:
      alert('Unknown export format.');
      return;
  }

  // Download the file
  const url = URL.createObjectURL(blob);
  chrome.downloads.download({
    url: url,
    filename: filename,
    saveAs: true
  });
}

// Convert HTML to plain text
function htmlToPlainText(html) {
  const temp = document.createElement('div');
  temp.innerHTML = html;

  // Replace <br> with newlines
  temp.querySelectorAll('br').forEach(br => {
    br.replaceWith('\n');
  });

  // Replace block elements with newlines
  temp.querySelectorAll('p, h1, h2, h3, h4, h5, h6, div').forEach(el => {
    el.insertAdjacentText('afterend', '\n\n');
  });

  // Replace list items with bullets
  temp.querySelectorAll('li').forEach(li => {
    li.insertAdjacentText('beforebegin', '• ');
    li.insertAdjacentText('afterend', '\n');
  });

  return temp.innerText.trim();
}

// Convert HTML to Markdown
function htmlToMarkdown(html) {
  let markdown = html;

  // Headers
  markdown = markdown.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n');
  markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n');
  markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n');

  // Bold and italic
  markdown = markdown.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
  markdown = markdown.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
  markdown = markdown.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
  markdown = markdown.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');
  markdown = markdown.replace(/<u[^>]*>(.*?)<\/u>/gi, '_$1_');

  // Lists
  markdown = markdown.replace(/<ul[^>]*>/gi, '\n');
  markdown = markdown.replace(/<\/ul>/gi, '\n');
  markdown = markdown.replace(/<ol[^>]*>/gi, '\n');
  markdown = markdown.replace(/<\/ol>/gi, '\n');
  markdown = markdown.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n');

  // Paragraphs and breaks
  markdown = markdown.replace(/<p[^>]*>/gi, '\n');
  markdown = markdown.replace(/<\/p>/gi, '\n');
  markdown = markdown.replace(/<br\s*\/?>/gi, '\n');
  markdown = markdown.replace(/<div[^>]*>/gi, '\n');
  markdown = markdown.replace(/<\/div>/gi, '\n');

  // Remove remaining HTML tags
  markdown = markdown.replace(/<[^>]*>/g, '');

  // Clean up multiple newlines
  markdown = markdown.replace(/\n{3,}/g, '\n\n');

  return markdown.trim();
}

// Convert HTML to RTF (for Apple Pages)
function htmlToRTF(html) {
  const plainText = htmlToPlainText(html);

  // Basic RTF structure
  let rtf = '{\\rtf1\\ansi\\deff0\n';
  rtf += '{\\fonttbl{\\f0 Helvetica;}}\n';
  rtf += '\\f0\\fs24\n';

  // Convert text to RTF, escaping special characters
  const lines = plainText.split('\n');
  lines.forEach(line => {
    if (line.trim()) {
      const escapedLine = line
        .replace(/\\/g, '\\\\')
        .replace(/{/g, '\\{')
        .replace(/}/g, '\\}');
      rtf += escapedLine + '\\par\n';
    } else {
      rtf += '\\par\n';
    }
  });

  rtf += '}';
  return rtf;
}

// Save settings to storage
async function saveSettings() {
  try {
    // Collect per-platform auto-open settings
    const autoOpenPlatforms = {};
    document.querySelectorAll('.toggle-platform').forEach(toggle => {
      const platform = toggle.dataset.platform;
      autoOpenPlatforms[platform] = toggle.checked;
    });

    const settings = {
      autoSave: autoSaveEnabled,
      autoOpenPlatforms: autoOpenPlatforms
    };

    await chrome.storage.local.set({ settings: settings });
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}

// Test notification button
document.getElementById('testNotificationBtn')?.addEventListener('click', async () => {
  console.log('Test notification button clicked');
  try {
    const response = await chrome.runtime.sendMessage({ action: 'testNotification' });
    console.log('Test notification response:', response);
  } catch (error) {
    console.error('Error sending test notification:', error);
  }
});

// Modal functions
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'flex';
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'none';
  }
}

// Utility function to escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ========== THEME FUNCTIONALITY ==========

// Setup theme switcher
function setupThemeSwitcher() {
  const themesBtn = document.getElementById('themesBtn');
  const themeSection = document.getElementById('themeSection');
  const themeButtons = document.querySelectorAll('.theme-btn');

  if (themesBtn && themeSection) {
    themesBtn.addEventListener('click', () => {
      const isVisible = themeSection.style.display !== 'none';
      themeSection.style.display = isVisible ? 'none' : 'block';
    });
  }

  themeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const theme = btn.dataset.colorTheme;
      if (theme) {
        applyTheme(theme);
        saveTheme(theme);
      }
    });
  });
}

// Apply theme to UI
function applyTheme(theme) {
  currentTheme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  document.body.setAttribute('data-theme', theme);

  // Update active theme button
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.colorTheme === theme);
  });
}

// Save theme to storage
async function saveTheme(theme) {
  try {
    await chrome.storage.local.set({ colorTheme: theme });
  } catch (error) {
    console.error('Error saving theme:', error);
  }
}

// Load theme from storage
async function loadTheme() {
  try {
    const result = await chrome.storage.local.get(['colorTheme']);
    const theme = result.colorTheme || 'blue';
    applyTheme(theme);
  } catch (error) {
    console.error('Error loading theme:', error);
    applyTheme('blue'); // Fallback to blue theme
  }
}

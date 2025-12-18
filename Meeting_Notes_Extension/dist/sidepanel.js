// MeetPad Side Panel Script
// Handles persistent side panel functionality and AI features

// Global variables
let currentNotes = '';
let isPremium = false;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
  console.log('🚀 Side panel initializing...');

  // Load saved data
  await loadSavedNotes();
  await loadColorTheme();
  await checkPremiumStatus();

  // Initialize event listeners
  initializeEventListeners();

  // Initialize AI service (if available) so features are ready
  try {
    if (typeof aiService !== 'undefined' && aiService && typeof aiService.initialize === 'function') {
      const hasKey = await aiService.initialize();
      if (!hasKey) {
        console.log('ℹ️ OpenAI API key not configured. Prompting user to set key in Premium.');
        // show minimal hint in UI
        const premiumHint = document.getElementById('premiumHint');
        if (premiumHint) {
          premiumHint.style.display = 'block';
        }
      } else {
        console.log('✅ AI service initialized');
      }
    }
  } catch (err) {
    console.error('AI service initialization error:', err);
  }

  // Update meeting detection
  updateMeetingStatus();

  console.log('✅ Side panel ready');
});

// Load saved notes
async function loadSavedNotes() {
  try {
    const result = await chrome.storage.local.get(['currentNotes', 'selectedTemplate']);
    currentNotes = result.currentNotes || '';

    // Update notes display
    const notesEditor = document.getElementById('notesEditor');
    if (notesEditor) {
      notesEditor.value = currentNotes;
      updateCharCount();
    }

    // Load template if specified
    const template = result.selectedTemplate;
    if (template) {
      const templateSelect = document.getElementById('templateInsert');
      if (templateSelect) {
        templateSelect.value = template;
      }
    }
  } catch (error) {
    console.error('Error loading saved notes:', error);
  }
}

// Load color theme
async function loadColorTheme() {
  try {
    const result = await chrome.storage.local.get(['colorTheme']);
    const theme = result.colorTheme || 'blue';
    applyTheme(theme);
  } catch (error) {
    console.error('Error loading theme:', error);
  }
}

// Check premium status
async function checkPremiumStatus() {
  try {
    const result = await chrome.storage.local.get(['isPremium']);
    isPremium = result.isPremium || false;
    console.log('Premium status:', isPremium);
  } catch (error) {
    console.error('Error checking premium:', error);
  }
}

// Initialize event listeners
function initializeEventListeners() {
  // Template selector
  const templateSelect = document.getElementById('templateInsert');
  if (templateSelect) {
    templateSelect.addEventListener('change', handleTemplateChange);
  }

  // Notes editor
  const notesEditor = document.getElementById('notesEditor');
  if (notesEditor) {
    notesEditor.addEventListener('input', handleNotesInput);
  }

  // Toolbar buttons
  const saveBtn = document.getElementById('saveBtn');
  if (saveBtn) {
    saveBtn.addEventListener('click', saveNotes);
  }

  const clearBtn = document.getElementById('clearBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', clearNotes);
  }

  const exportBtn = document.getElementById('exportBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', exportNotes);
  }

  const emailBtn = document.getElementById('emailBtn');
  if (emailBtn) {
    emailBtn.addEventListener('click', emailNotes);
  }

  // AI button
  const aiBtn = document.getElementById('aiBtn');
  if (aiBtn) {
    aiBtn.addEventListener('click', handleAIAssist);
  }

  // Premium button
  const premiumBtn = document.getElementById('premiumBtn');
  if (premiumBtn) {
    premiumBtn.addEventListener('click', openPremiumPage);
  }

  // Theme toggle button
  const toggleThemesBtn = document.getElementById('toggleThemesBtn');
  const themeOptions = document.getElementById('themeOptions');
  if (toggleThemesBtn && themeOptions) {
    toggleThemesBtn.addEventListener('click', () => {
      const isVisible = themeOptions.style.display !== 'none';
      themeOptions.style.display = isVisible ? 'none' : 'flex';
      // Keep as paint palette, don't change to X
      toggleThemesBtn.textContent = '🎨';
    });
  }

  // Theme buttons
  const themeButtons = document.querySelectorAll('.theme-btn');
  themeButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const theme = e.target.dataset.colorTheme;
      if (theme) {
        applyTheme(theme);
        saveTheme(theme);
        // Keep theme options visible after selection
        // Don't hide them automatically
      }
    });
  });

  // Formatting toolbar buttons
  const boldBtn = document.getElementById('boldBtn');
  if (boldBtn) {
    boldBtn.addEventListener('click', () => formatText('bold'));
  }

  const italicBtn = document.getElementById('italicBtn');
  if (italicBtn) {
    italicBtn.addEventListener('click', () => formatText('italic'));
  }

  const underlineBtn = document.getElementById('underlineBtn');
  if (underlineBtn) {
    underlineBtn.addEventListener('click', () => formatText('underline'));
  }

  const strikeBtn = document.getElementById('strikeBtn');
  if (strikeBtn) {
    strikeBtn.addEventListener('click', () => formatText('strikethrough'));
  }

  const h1Btn = document.getElementById('h1Btn');
  if (h1Btn) {
    h1Btn.addEventListener('click', () => formatText('h1'));
  }

  const h2Btn = document.getElementById('h2Btn');
  if (h2Btn) {
    h2Btn.addEventListener('click', () => formatText('h2'));
  }

  const h3Btn = document.getElementById('h3Btn');
  if (h3Btn) {
    h3Btn.addEventListener('click', () => formatText('h3'));
  }

  const bulletBtn = document.getElementById('bulletBtn');
  if (bulletBtn) {
    bulletBtn.addEventListener('click', () => formatText('bullet'));
  }

  const numberedBtn = document.getElementById('numberedBtn');
  if (numberedBtn) {
    numberedBtn.addEventListener('click', () => formatText('numbered'));
  }

  const taskBtn = document.getElementById('taskBtn');
  if (taskBtn) {
    taskBtn.addEventListener('click', () => formatText('task'));
  }

  const dashBtn = document.getElementById('dashBtn');
  if (dashBtn) {
    dashBtn.addEventListener('click', () => formatText('dash'));
  }

  const quoteBtn = document.getElementById('quoteBtn');
  if (quoteBtn) {
    quoteBtn.addEventListener('click', () => formatText('quote'));
  }

  const codeBtn = document.getElementById('codeBtn');
  if (codeBtn) {
    codeBtn.addEventListener('click', () => formatText('code'));
  }

  const linkBtn = document.getElementById('linkBtn');
  if (linkBtn) {
    linkBtn.addEventListener('click', () => formatText('link'));
  }

  const highlightBtn = document.getElementById('highlightBtn');
  if (highlightBtn) {
    highlightBtn.addEventListener('click', () => formatText('highlight'));
  }

  // Settings button
  const settingsBtn = document.getElementById('settingsBtn');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', toggleSettings);
  }

  // API Key quick button (open modal)
  const apiKeyBtn = document.getElementById('apiKeyBtn');
  if (apiKeyBtn) {
    apiKeyBtn.addEventListener('click', () => {
      const modal = document.getElementById('apiKeyModal');
      if (modal) modal.style.display = 'block';
    });
  }

  // Quick action buttons
  const viewHistoryBtn = document.getElementById('viewHistoryBtn');
  if (viewHistoryBtn) {
    viewHistoryBtn.addEventListener('click', viewHistory);
  }

  const templatesBtn = document.getElementById('templatesBtn');
  if (templatesBtn) {
    templatesBtn.addEventListener('click', manageTemplates);
  }

  // Modal close/save handlers
  const closeApiKeyModal = document.getElementById('closeApiKeyModal');
  if (closeApiKeyModal) closeApiKeyModal.addEventListener('click', () => document.getElementById('apiKeyModal').style.display = 'none');

  const cancelSideApiKeyBtn = document.getElementById('cancelSideApiKeyBtn');
  if (cancelSideApiKeyBtn) cancelSideApiKeyBtn.addEventListener('click', () => document.getElementById('apiKeyModal').style.display = 'none');

  const saveSideApiKeyBtn = document.getElementById('saveSideApiKeyBtn');
  if (saveSideApiKeyBtn) saveSideApiKeyBtn.addEventListener('click', async () => {
    const input = document.getElementById('sideApiKeyInput');
    if (!input) return;
    const key = input.value.trim();
    if (!key) { alert('Please enter an API key'); return; }
    if (!key.startsWith('sk-')) { alert('API key should begin with "sk-"'); return; }
    try {
      await chrome.storage.local.set({ openai_api_key: key });
      input.value = '';
      document.getElementById('apiKeyModal').style.display = 'none';
      // Re-initialize aiService if present
      if (typeof aiService !== 'undefined' && aiService && typeof aiService.initialize === 'function') {
        await aiService.initialize();
      }
      alert('OpenAI API key saved locally.');
    } catch (err) {
      console.error('Error saving API key:', err);
      alert('Failed to save API key.');
    }
  });
}

// Handle template change
function handleTemplateChange(e) {
  const template = e.target.value;
  if (template && templates[template]) {
    const notesEditor = document.getElementById('notesEditor');
    if (notesEditor) {
      if (template === 'custom' || template === '') {
        // Blank template - clear the text
        notesEditor.value = '';
        currentNotes = '';
      } else {
        // Other templates - append if there's existing content, replace if empty
        if (notesEditor.value.trim()) {
          // Append template to existing content
          notesEditor.value = notesEditor.value + '\n\n' + templates[template];
          currentNotes = notesEditor.value;
        } else {
          // Replace with template
          notesEditor.value = templates[template];
          currentNotes = templates[template];
        }
      }
      updateCharCount();
      saveCurrentNotes();
    }
  }

  // Save selected template
  chrome.storage.local.set({ selectedTemplate: template });
}

// Handle notes input
function handleNotesInput(e) {
  currentNotes = e.target.value;
  updateCharCount();
  saveCurrentNotes();
}

// Update character count
function updateCharCount() {
  const notesEditor = document.getElementById('notesEditor');
  const charCount = document.getElementById('charCount');

  if (notesEditor && charCount) {
    const count = notesEditor.value.length;
    charCount.textContent = `${count} characters`;
  }
}

// Save current notes
function saveCurrentNotes() {
  chrome.storage.local.set({ currentNotes });
}

// Save notes to history
async function saveNotes() {
  const notes = currentNotes;
  if (!notes.trim()) {
    alert('Please enter some notes before saving.');
    return;
  }

  const timestamp = new Date().toISOString();
  const platform = 'Unknown'; // TODO: Get from content script

  const noteEntry = {
    id: `note_${Date.now()}`,
    content: notes,
    timestamp,
    platform,
    template: document.getElementById('templateInsert')?.value || 'custom'
  };

  try {
    const result = await chrome.storage.local.get(['notesHistory']);
    const history = result.notesHistory || [];
    history.unshift(noteEntry);

    // Keep last 100 entries
    if (history.length > 100) {
      history.pop();
    }

    await chrome.storage.local.set({ notesHistory: history });

    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn) {
      saveBtn.textContent = 'Saved!';
      saveBtn.classList.add('success');

      setTimeout(() => {
        saveBtn.textContent = 'Save Notes';
        saveBtn.classList.remove('success');
      }, 2000);
    }
  } catch (error) {
    console.error('Error saving notes:', error);
    alert('Error saving notes. Please try again.');
  }
}

// Clear notes
function clearNotes() {
  if (confirm('Are you sure you want to clear all notes? This cannot be undone.')) {
    currentNotes = '';
    document.getElementById('notesEditor').value = '';
    updateCharCount();
    chrome.storage.local.set({ currentNotes: '' });
  }
}

// Export notes
function exportNotes() {
  const notes = currentNotes;
  if (!notes.trim()) {
    alert('Please enter some notes before exporting.');
    return;
  }

  const format = document.querySelector('.export-option.active')?.dataset.format || 'txt';
  let content = notes;
  let filename = `meeting-notes-${new Date().toISOString().split('T')[0]}`;
  let mimeType = 'text/plain';

  switch (format) {
    case 'markdown':
      content = convertToMarkdown(notes);
      filename += '.md';
      break;
    case 'html':
      content = convertToHTML(notes);
      filename += '.html';
      mimeType = 'text/html';
      break;
    case 'json':
      content = JSON.stringify({
        content: notes,
        timestamp: new Date().toISOString(),
        platform: 'Unknown'
      }, null, 2);
      filename += '.json';
      mimeType = 'application/json';
      break;
    default:
      filename += '.txt';
  }

  // Create and download file immediately
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  // Use immediate download instead of chrome.downloads API for speed
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// View history
function viewHistory() {
  // TODO: Implement history view
  alert('History view coming soon! Notes are saved locally.');
}

// Manage templates
function manageTemplates() {
  // TODO: Implement template management
  alert('Template management coming soon!');
}

// Email notes
function emailNotes() {
  const notes = currentNotes;
  if (!notes.trim()) {
    alert('Please enter some notes before emailing.');
    return;
  }

  const subject = encodeURIComponent('Meeting Notes');
  const body = encodeURIComponent(notes);
  const mailtoUrl = `mailto:?subject=${subject}&body=${body}`;

  window.open(mailtoUrl);
}

// Handle AI assist
async function handleAIAssist() {
  if (!isPremium) {
    openPremiumPage();
    return;
  }

  // Show AI features menu
  showAIFeaturesMenu();
}

// Show AI features menu
function showAIFeaturesMenu() {
  // Create modal overlay
  const modal = document.createElement('div');
  modal.className = 'ai-modal-overlay';
  modal.innerHTML = `
    <div class="ai-modal">
      <div class="ai-modal-header">
        <h3>AI Features</h3>
        <button class="ai-modal-close">&times;</button>
      </div>
      <div class="ai-features-grid">
        <button class="ai-feature-btn" data-action="summarize">
          <div class="ai-feature-icon">🧠</div>
          <div class="ai-feature-title">Summarize</div>
          <div class="ai-feature-desc">Create concise summary</div>
        </button>
        <button class="ai-feature-btn" data-action="action-items">
          <div class="ai-feature-icon">✅</div>
          <div class="ai-feature-title">Action Items</div>
          <div class="ai-feature-desc">Extract tasks & owners</div>
        </button>
        <button class="ai-feature-btn" data-action="format">
          <div class="ai-feature-icon">📝</div>
          <div class="ai-feature-title">Format Notes</div>
          <div class="ai-feature-desc">Professional formatting</div>
        </button>
        <button class="ai-feature-btn" data-action="email">
          <div class="ai-feature-icon">📧</div>
          <div class="ai-feature-title">Follow-up Email</div>
          <div class="ai-feature-desc">Generate email draft</div>
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Add event listeners
  modal.querySelector('.ai-modal-close').addEventListener('click', () => {
    modal.remove();
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });

  // AI feature buttons
  modal.querySelectorAll('.ai-feature-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const action = e.currentTarget.dataset.action;
      handleAIFeature(action);
      modal.remove();
    });
  });
}

// Handle AI feature
async function handleAIFeature(action) {
  const notes = currentNotes.trim();
  if (!notes) {
    alert('Please enter some notes first.');
    return;
  }

  // Show loading
  showAILoading();

  try {
    let result;
    switch (action) {
      case 'summarize':
        result = await aiService.summarizeNotes(notes);
        break;
      case 'action-items':
        result = await aiService.extractActionItems(notes);
        break;
      case 'format':
        result = await aiService.formatNotes(notes);
        break;
      case 'email':
        result = await aiService.generateFollowUpEmail(notes);
        break;
      default:
        throw new Error('Unknown AI feature');
    }

    // Show result
    showAIResult(action, result);

  } catch (error) {
    console.error('AI feature error:', error);
    alert('AI feature failed. Please check your API key and try again.');
  } finally {
    hideAILoading();
  }
}

// Show AI loading
function showAILoading() {
  const loading = document.createElement('div');
  loading.className = 'ai-loading-overlay';
  loading.innerHTML = `
    <div class="ai-loading">
      <div class="ai-loading-spinner"></div>
      <div class="ai-loading-text">AI processing...</div>
    </div>
  `;
  document.body.appendChild(loading);
}

// Hide AI loading
function hideAILoading() {
  const loading = document.querySelector('.ai-loading-overlay');
  if (loading) {
    loading.remove();
  }
}

// Show AI result
function showAIResult(action, result) {
  const modal = document.createElement('div');
  modal.className = 'ai-modal-overlay';
  modal.innerHTML = `
    <div class="ai-modal ai-result-modal">
      <div class="ai-modal-header">
        <h3>AI ${action.charAt(0).toUpperCase() + action.slice(1).replace('-', ' ')} Result</h3>
        <button class="ai-modal-close">&times;</button>
      </div>
      <div class="ai-result-content">
        <pre>${result}</pre>
      </div>
      <div class="ai-result-actions">
        <button class="ai-result-btn ai-result-replace">Replace Notes</button>
        <button class="ai-result-btn ai-result-append">Append to Notes</button>
        <button class="ai-result-btn ai-result-copy">Copy to Clipboard</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Event listeners
  modal.querySelector('.ai-modal-close').addEventListener('click', () => modal.remove());
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });

  // Action buttons
  modal.querySelector('.ai-result-replace').addEventListener('click', () => {
    document.getElementById('notesEditor').value = result;
    currentNotes = result;
    updateCharCount();
    saveCurrentNotes();
    modal.remove();
  });

  modal.querySelector('.ai-result-append').addEventListener('click', () => {
    const newNotes = currentNotes + '\n\n' + result;
    document.getElementById('notesEditor').value = newNotes;
    currentNotes = newNotes;
    updateCharCount();
    saveCurrentNotes();
    modal.remove();
  });

  modal.querySelector('.ai-result-copy').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(result);
      alert('Copied to clipboard!');
    } catch (error) {
      console.error('Copy failed:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = result;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Copied to clipboard!');
    }
  });
}

// Open premium page
function openPremiumPage() {
  chrome.tabs.create({ url: chrome.runtime.getURL('premium.html') });
}

// Apply theme
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);

  // Update active theme button
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.colorTheme === theme);
  });
}

// Save theme
async function saveTheme(theme) {
  try {
    await chrome.storage.local.set({ colorTheme: theme });
  } catch (error) {
    console.error('Error saving theme:', error);
  }
}

// Toggle settings
function toggleSettings() {
  // TODO: Implement settings panel
  alert('Settings panel coming soon!');
}

// Update meeting status
async function updateMeetingStatus() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.url) {
      const platform = detectPlatform(new URL(tab.url).hostname);
      const statusDot = document.getElementById('statusDot');
      const statusText = document.getElementById('statusText');
      const meetingDetails = document.getElementById('meetingDetails');

      if (platform !== 'Unknown') {
        statusDot.style.backgroundColor = '#10B981';
        statusText.textContent = `In ${platform} meeting`;
        if (meetingDetails) {
          meetingDetails.style.display = 'block';
          document.getElementById('meetingPlatform').textContent = platform;
        }
      } else {
        statusDot.style.backgroundColor = '#6B7280';
        statusText.textContent = 'Not in meeting';
        if (meetingDetails) {
          meetingDetails.style.display = 'none';
        }
      }
    }
  } catch (error) {
    console.error('Error updating meeting status:', error);
  }
}

// Detect platform from hostname
function detectPlatform(hostname) {
  if (hostname.includes('zoom.us')) return 'Zoom';
  if (hostname.includes('meet.google.com')) return 'Google Meet';
  if (hostname.includes('teams.microsoft.com')) return 'Microsoft Teams';
  if (hostname.includes('webex.com')) return 'Webex';
  return 'Unknown';
}

// Template definitions
const templates = {
  general: `MEETING NOTES
${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ATTENDEES
   •

MEETING OBJECTIVE


KEY DISCUSSION POINTS
   •


DECISIONS MADE
   •


ACTION ITEMS
   ☐


NEXT STEPS


NOTES

`,
  standup: `DAILY STANDUP
${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

COMPLETED YESTERDAY
   •


PLANNED FOR TODAY
   •


BLOCKERS & CHALLENGES


TEAM UPDATES


`,
  retrospective: `RETROSPECTIVE
${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

WHAT WENT WELL
   •


WHAT DIDN'T GO WELL
   •


WHAT CAN WE IMPROVE
   •


ACTION ITEMS
   ☐


`,
  oneonone: `1-ON-1 MEETING
${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CHECK-IN


TOPICS DISCUSSED
   •


FEEDBACK GIVEN
   •


GOALS & OBJECTIVES
   •


ACTION ITEMS
   ☐


NEXT MEETING


`,
  custom: ''
};

// Utility functions for export
function convertToMarkdown(text) {
  return text
    .replace(/^(\s*)•/gm, '$1-')
    .replace(/^(\s*)☐/gm, '$1- [ ]')
    .replace(/^(\s*)☑/gm, '$1- [x]');
}

function convertToHTML(text) {
  return `<html><body><pre>${text}</pre></body></html>`;
}

// Format text in the editor
function formatText(type) {
  const editor = document.getElementById('notesEditor');
  if (!editor) return;

  const start = editor.selectionStart;
  const end = editor.selectionEnd;
  const selectedText = editor.value.substring(start, end);
  let formattedText = '';

  switch (type) {
    case 'bold':
      formattedText = `**${selectedText || 'bold text'}**`;
      break;
    case 'italic':
      formattedText = `*${selectedText || 'italic text'}*`;
      break;
    case 'underline':
      formattedText = `<u>${selectedText || 'underlined text'}</u>`;
      break;
    case 'strikethrough':
      formattedText = `~~${selectedText || 'strikethrough text'}~~`;
      break;
    case 'h1':
      formattedText = `# ${selectedText || 'Heading 1'}`;
      break;
    case 'h2':
      formattedText = `## ${selectedText || 'Heading 2'}`;
      break;
    case 'h3':
      formattedText = `### ${selectedText || 'Heading 3'}`;
      break;
    case 'bullet':
      formattedText = `• ${selectedText || 'List item'}`;
      break;
    case 'numbered':
      formattedText = `1. ${selectedText || 'List item'}`;
      break;
    case 'task':
      formattedText = `☐ ${selectedText || 'Task item'}`;
      break;
    case 'dash':
      formattedText = `- ${selectedText || 'List item'}`;
      break;
    case 'quote':
      formattedText = `> ${selectedText || 'Quote'}`;
      break;
    case 'code':
      formattedText = `\`${selectedText || 'code'}\``;
      break;
    case 'link':
      formattedText = `[${selectedText || 'link text'}](url)`;
      break;
    case 'highlight':
      formattedText = `==${selectedText || 'highlighted text'}==`;
      break;
    default:
      return;
  }

  // Replace the selected text or insert at cursor
  if (selectedText) {
    editor.value = editor.value.substring(0, start) + formattedText + editor.value.substring(end);
    editor.focus();
    editor.setSelectionRange(start, start + formattedText.length);
  } else {
    editor.value = editor.value.substring(0, start) + formattedText + editor.value.substring(end);
    editor.focus();
    editor.setSelectionRange(start + formattedText.length, start + formattedText.length);
  }

  // Update current notes and save
  currentNotes = editor.value;
  updateCharCount();
  saveCurrentNotes();
}

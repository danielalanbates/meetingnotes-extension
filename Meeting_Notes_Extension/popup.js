// MeetingNotes - Popup Script

// Template definitions
const templates = {
  general: {
    title: 'General Meeting',
    themeClass: 'theme-professional',
    content: `# Meeting Notes\n${formatDateHeading()}\n\n## Attendees\n- \n\n## Objective\n\n\n## Discussion\n- \n\n## Decisions\n- \n\n## Action Items\n- [ ] \n\n## Next Steps\n- \n`
  },
  standup: {
    title: 'Daily Standup',
    themeClass: 'theme-minimal',
    content: `# Daily Standup\n${formatDateHeading()}\n\n## Yesterday\n- \n\n## Today\n- \n\n## Blockers\n- \n\n## Team Updates\n- \n`
  },
  retrospective: {
    title: 'Sprint Retrospective',
    themeClass: 'theme-modern',
    content: `# Sprint Retrospective\n${formatDateHeading()}\n\n## What Went Well\n- \n\n## Improvements\n- \n\n## Action Items\n- [ ] \n\n## Appreciation\n- \n`
  },
  '1on1': {
    title: '1-on-1 Meeting',
    themeClass: 'theme-classic',
    content: `# One-on-One Meeting\n${formatDateHeading()}\n\n## Check-in\n- \n\n## Discussion Topics\n- \n\n## Feedback\n- \n\n## Commitments\n- [ ] \n\n## Follow-up\n- \n`
  },
  custom: {
    title: 'Blank',
    themeClass: 'theme-minimal',
    content: ''
  }
};

function formatDateHeading() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// DOM Elements
const notesEditor = document.getElementById('notesEditor');
const templateInsert = document.getElementById('templateInsert');
const charCount = document.getElementById('charCount');
const autoSaveStatus = document.getElementById('autoSaveStatus');
const saveBtn = document.getElementById('saveBtn');
const clearBtn = document.getElementById('clearBtn');
const exportBtn = document.getElementById('exportBtn');
const downloadBtn = document.getElementById('downloadBtn');
const exportModal = document.getElementById('exportModal');
const closeExportModal = document.getElementById('closeExportModal');
const meetingStatus = document.getElementById('statusText');
const statusDot = document.getElementById('statusDot');
const emailToInput = document.getElementById('emailTo');
const emailSubjectInput = document.getElementById('emailSubject');
const emailPreviewInput = document.getElementById('emailPreview');
const sendEmailBtn = document.getElementById('sendEmailBtn');
const copyEmailBtn = document.getElementById('copyEmailBtn');
const settingsModal = document.getElementById('settingsModal');
const closeSettingsModal = document.getElementById('closeSettingsModal');
const toggleAutoSaveEl = document.getElementById('toggleAutoSave');
const toggleSystemThemeEl = document.getElementById('toggleSystemTheme');

// Current color theme
let currentColorTheme = 'blue';
let matchSystemTheme = false;
let autoSaveEnabled = true;
let isPremium = false;

// Auto-save timer
let autoSaveTimer;

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  await loadConfiguration();
  await loadSavedNotes();
  await loadColorTheme();
  await loadPremiumStatus();
  checkMeetingStatus();
  await hydrateEmailDefaults();
  setupEventListeners();
  applyTemplateTheme(templateInsert.value || 'custom');
});

async function loadConfiguration() {
  try {
    const result = await chrome.storage.local.get(['autoSaveEnabled', 'matchSystemTheme']);
    autoSaveEnabled = result.autoSaveEnabled !== undefined ? result.autoSaveEnabled : true;
    matchSystemTheme = result.matchSystemTheme || false;

    if (toggleAutoSaveEl) toggleAutoSaveEl.checked = autoSaveEnabled;
    if (toggleSystemThemeEl) toggleSystemThemeEl.checked = matchSystemTheme;

    if (matchSystemTheme) {
      applySystemTheme();
    }
  } catch (error) {
    console.error('Error loading configuration:', error);
  }
}

async function loadPremiumStatus() {
  try {
    const result = await chrome.storage.local.get(['isPremium']);
    isPremium = !!result.isPremium;
  } catch (error) {
    console.error('Error loading premium status:', error);
  }
}

async function hydrateEmailDefaults() {
  try {
    const result = await chrome.storage.local.get(['userEmail']);
    if (result.userEmail && emailToInput) {
      emailToInput.value = result.userEmail;
    }
  } catch (error) {
    console.error('Error loading email defaults:', error);
  }
}

// Load saved notes from storage
async function loadSavedNotes() {
  try {
    const result = await chrome.storage.local.get(['currentNotes', 'selectedTemplate']);
    if (result.currentNotes) {
      notesEditor.value = result.currentNotes;
      updateCharCount();
    }
    if (result.selectedTemplate) {
      templateInsert.value = result.selectedTemplate;
    }
  } catch (error) {
    console.error('Error loading notes:', error);
  }
}

// Load saved color theme
async function loadColorTheme() {
  try {
    let theme;
    if (matchSystemTheme) {
      theme = detectSystemTheme();
    } else {
      const result = await chrome.storage.local.get(['colorTheme']);
      theme = result.colorTheme || 'blue';
    }

    applyTheme(theme);
  } catch (error) {
    console.error('Error loading color theme:', error);
  }
}

// Check if user is in a meeting
async function checkMeetingStatus() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url) {
      const url = new URL(tab.url);
      const platform = detectPlatform(url.hostname);

      if (platform) {
        statusDot.className = 'status-dot active';
        meetingStatus.textContent = `In ${platform} meeting`;
        document.getElementById('meetingDetails').style.display = 'block';
        document.getElementById('meetingPlatform').textContent = platform;
      } else {
        statusDot.className = 'status-dot';
        meetingStatus.textContent = 'Not in meeting';
      }
    }
  } catch (error) {
    console.error('Error checking meeting status:', error);
  }
}

// Detect meeting platform
function detectPlatform(hostname) {
  if (hostname.includes('zoom.us')) return 'Zoom';
  if (hostname.includes('meet.google.com')) return 'Google Meet';
  if (hostname.includes('teams.microsoft.com')) return 'Microsoft Teams';
  if (hostname.includes('webex.com')) return 'Webex';
  return null;
}

// Setup event listeners
function setupEventListeners() {
  // Color theme selector
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const colorTheme = e.target.dataset.colorTheme;
      if (!colorTheme) return;

      document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      currentColorTheme = colorTheme;
      matchSystemTheme = false;
      if (toggleSystemThemeEl) toggleSystemThemeEl.checked = false;
      await chrome.storage.local.set({ matchSystemTheme: false });

      applyTheme(colorTheme);
      await chrome.storage.local.set({ colorTheme: colorTheme });
    });
  });

  // Template insert
  templateInsert.addEventListener('change', (e) => {
    applyTemplateContent(e.target.value);
    chrome.storage.local.set({ selectedTemplate: e.target.value || 'custom' }).catch((error) => {
      console.error('Error saving selected template:', error);
    });
  });

  // Notes editor
  notesEditor.addEventListener('input', () => {
    updateCharCount();
    if (autoSaveEnabled) {
      scheduleAutoSave();
    } else {
      autoSaveStatus.textContent = 'Auto-save off';
      autoSaveStatus.className = 'auto-save';
    }
    updateEmailPreview();
  });

  // Toolbar buttons - Text formatting
  document.getElementById('boldBtn').addEventListener('click', () => insertFormatting('**', '**'));
  document.getElementById('italicBtn').addEventListener('click', () => insertFormatting('_', '_'));
  document.getElementById('underlineBtn').addEventListener('click', () => insertFormatting('<u>', '</u>'));
  document.getElementById('strikeBtn').addEventListener('click', () => insertFormatting('~~', '~~'));

  // Heading buttons
  document.getElementById('h1Btn').addEventListener('click', () => insertHeading(1));
  document.getElementById('h2Btn').addEventListener('click', () => insertHeading(2));
  document.getElementById('h3Btn').addEventListener('click', () => insertHeading(3));

  // List buttons
  document.getElementById('bulletBtn').addEventListener('click', () => insertList('bullet'));
  document.getElementById('numberedBtn').addEventListener('click', () => insertList('numbered'));
  document.getElementById('taskBtn').addEventListener('click', () => insertList('task'));
  document.getElementById('dashBtn').addEventListener('click', () => insertList('dash'));

  // Special formatting
  document.getElementById('quoteBtn').addEventListener('click', () => insertQuote());
  document.getElementById('codeBtn').addEventListener('click', () => insertCode());
  document.getElementById('linkBtn').addEventListener('click', () => insertLink());
  document.getElementById('highlightBtn').addEventListener('click', () => insertFormatting('==', '=='));
  document.getElementById('aiBtn').addEventListener('click', handleAIAssist);

  // Premium button - Open premium page
  document.getElementById('premiumBtn').addEventListener('click', openPremiumPage);

  // Header buttons
  document.getElementById('themesBtn').addEventListener('click', toggleThemeSection);

  // Action buttons
  saveBtn.addEventListener('click', saveNotes);
  clearBtn.addEventListener('click', clearNotes);
  exportBtn.addEventListener('click', () => {
    exportModal.style.display = 'flex';
    updateEmailPreview();
  });
  downloadBtn.addEventListener('click', () => {
    exportNotes('txt');
  });
  closeExportModal.addEventListener('click', () => exportModal.style.display = 'none');

  // Export options
  document.querySelectorAll('.export-option').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const format = e.currentTarget.dataset.format;
      if (format) {
        exportNotes(format);
      }
    });
  });

  // Email actions
  if (sendEmailBtn) sendEmailBtn.addEventListener('click', sendEmail);
  if (copyEmailBtn) copyEmailBtn.addEventListener('click', copyEmailToClipboard);

  // Quick actions
  document.getElementById('viewHistoryBtn').addEventListener('click', viewHistory);
  document.getElementById('templatesBtn').addEventListener('click', manageTemplates);

  // Settings
  document.getElementById('settingsBtn').addEventListener('click', openSettings);
  if (closeSettingsModal) closeSettingsModal.addEventListener('click', () => settingsModal.style.display = 'none');
  if (toggleAutoSaveEl) {
    toggleAutoSaveEl.addEventListener('change', (e) => {
      autoSaveEnabled = e.target.checked;
      chrome.storage.local.set({ autoSaveEnabled });
      autoSaveStatus.textContent = autoSaveEnabled ? 'Auto-save on' : 'Auto-save off';
      autoSaveStatus.className = 'auto-save';
    });
  }

  if (toggleSystemThemeEl) {
    toggleSystemThemeEl.addEventListener('change', async (e) => {
      matchSystemTheme = e.target.checked;
      await chrome.storage.local.set({ matchSystemTheme });
      if (matchSystemTheme) {
        applySystemTheme();
      }
    });
  }

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (matchSystemTheme) {
      applySystemTheme();
    }
  });
}

// Update character count
function updateCharCount() {
  const count = notesEditor.value.length;
  charCount.textContent = `${count} character${count !== 1 ? 's' : ''}`;
}

// Schedule auto-save
function scheduleAutoSave() {
  clearTimeout(autoSaveTimer);
  autoSaveStatus.textContent = 'Saving...';
  autoSaveStatus.className = 'auto-save saving';

  autoSaveTimer = setTimeout(async () => {
    await chrome.storage.local.set({ currentNotes: notesEditor.value });
    autoSaveStatus.textContent = 'Saved';
    autoSaveStatus.className = 'auto-save saved';

    setTimeout(() => {
      autoSaveStatus.textContent = 'Auto-save on';
      autoSaveStatus.className = 'auto-save';
    }, 2000);
  }, 1000);
}

function applyTemplateContent(templateKey) {
  const template = templates[templateKey] || templates.custom;
  if (!template) return;

  applyTemplateTheme(templateKey);
  notesEditor.value = template.content;
  updateCharCount();
  if (autoSaveEnabled) scheduleAutoSave();
  updateEmailPreview();
}

function applyTemplateTheme(templateKey) {
  const template = templates[templateKey] || templates.custom;
  const themeClass = template.themeClass || 'theme-minimal';
  notesEditor.classList.remove('theme-professional', 'theme-minimal', 'theme-modern', 'theme-classic');
  notesEditor.classList.add(themeClass);
}

// Insert formatting at cursor
function insertFormatting(before, after) {
  const start = notesEditor.selectionStart;
  const end = notesEditor.selectionEnd;
  const text = notesEditor.value;
  const selectedText = text.substring(start, end);

  const newText = text.substring(0, start) + before + selectedText + after + text.substring(end);
  notesEditor.value = newText;

  const newCursor = start + before.length + selectedText.length + after.length;
  notesEditor.setSelectionRange(newCursor, newCursor);
  notesEditor.focus();

  updateCharCount();
  scheduleAutoSave();
}

// Insert heading
function insertHeading(level) {
  const start = notesEditor.selectionStart;
  const text = notesEditor.value;

  // Find start of current line
  let lineStart = start;
  while (lineStart > 0 && text[lineStart - 1] !== '\n') {
    lineStart--;
  }

  // Get the line text
  let lineEnd = start;
  while (lineEnd < text.length && text[lineEnd] !== '\n') {
    lineEnd++;
  }

  const lineText = text.substring(lineStart, lineEnd);
  const prefix = '='.repeat(level * 20) + '\n';
  const suffix = '\n' + '='.repeat(level * 20);

  const newLine = lineText ? prefix + lineText.toUpperCase() + suffix : prefix + 'HEADING' + suffix;
  const newText = text.substring(0, lineStart) + newLine + text.substring(lineEnd);

  notesEditor.value = newText;
  notesEditor.setSelectionRange(lineStart + prefix.length, lineStart + prefix.length + (lineText || 'HEADING').length);
  notesEditor.focus();

  updateCharCount();
  scheduleAutoSave();
}

// Insert list item
function insertList(type) {
  const start = notesEditor.selectionStart;
  const text = notesEditor.value;

  let prefix;
  switch(type) {
    case 'bullet':
      prefix = '\n   • ';
      break;
    case 'numbered':
      prefix = '\n   1. ';
      break;
    case 'task':
      prefix = '\n   ☐ ';
      break;
    case 'dash':
      prefix = '\n   - ';
      break;
  }

  const newText = text.substring(0, start) + prefix + text.substring(start);
  notesEditor.value = newText;
  notesEditor.setSelectionRange(start + prefix.length, start + prefix.length);
  notesEditor.focus();

  updateCharCount();
  scheduleAutoSave();
}

// Insert quote
function insertQuote() {
  const start = notesEditor.selectionStart;
  const end = notesEditor.selectionEnd;
  const text = notesEditor.value;
  const selectedText = text.substring(start, end);

  const quote = selectedText || 'Quote text here';
  const formatted = '\n\n   " ' + quote + ' "\n\n';

  const newText = text.substring(0, start) + formatted + text.substring(end);
  notesEditor.value = newText;
  notesEditor.setSelectionRange(start + 7, start + 7 + quote.length);
  notesEditor.focus();

  updateCharCount();
  scheduleAutoSave();
}

// Insert code block
function insertCode() {
  const start = notesEditor.selectionStart;
  const end = notesEditor.selectionEnd;
  const text = notesEditor.value;
  const selectedText = text.substring(start, end);

  const code = selectedText || 'code';
  const formatted = '`' + code + '`';

  const newText = text.substring(0, start) + formatted + text.substring(end);
  notesEditor.value = newText;
  notesEditor.setSelectionRange(start + 1, start + 1 + code.length);
  notesEditor.focus();

  updateCharCount();
  scheduleAutoSave();
}

// Insert link
function insertLink() {
  const start = notesEditor.selectionStart;
  const end = notesEditor.selectionEnd;
  const text = notesEditor.value;
  const selectedText = text.substring(start, end);

  const linkText = selectedText || 'link text';
  const formatted = '[' + linkText + '](url)';

  const newText = text.substring(0, start) + formatted + text.substring(end);
  notesEditor.value = newText;

  // Select the 'url' part for easy replacement
  const urlStart = start + linkText.length + 3;
  notesEditor.setSelectionRange(urlStart, urlStart + 3);
  notesEditor.focus();

  updateCharCount();
  scheduleAutoSave();
}

// Open premium page in new tab
function openPremiumPage() {
  chrome.tabs.create({ url: chrome.runtime.getURL('premium.html') });
}

// Handle AI assist (old button - keep for compatibility)
async function handleAIAssist() {
  if (!isPremium) {
    exportModal.style.display = 'none';
    openPremiumPage();
    return;
  }

  // Placeholder for premium AI modal trigger
  alert('AI Assist coming soon to this panel.');
}


// Save notes
async function saveNotes() {
  const notes = notesEditor.value;
  if (!notes.trim()) {
    alert('Please enter some notes before saving.');
    return;
  }

  const timestamp = new Date().toISOString();
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const platform = tab?.url ? detectPlatform(new URL(tab.url).hostname) : 'Unknown';

  const noteEntry = {
    id: `note_${Date.now()}`,
    content: notes,
    timestamp,
    platform,
    template: templateInsert.value
  };

  // Save to history
  const result = await chrome.storage.local.get(['notesHistory']);
  const history = result.notesHistory || [];
  history.unshift(noteEntry);

  // Keep last 100 entries
  if (history.length > 100) {
    history.pop();
  }

  await chrome.storage.local.set({
    notesHistory: history,
    currentNotes: notes
  });

  saveBtn.textContent = 'Saved!';
  saveBtn.classList.add('success');

  setTimeout(() => {
    saveBtn.textContent = 'Save Note';
    saveBtn.classList.remove('success');
  }, 2000);
}

// Clear notes
function clearNotes() {
  if (confirm('Are you sure you want to clear all notes? This cannot be undone.')) {
    notesEditor.value = '';
    updateCharCount();
    chrome.storage.local.set({ currentNotes: '' });
  }
}

// Export notes
function exportNotes(format) {
  const notes = notesEditor.value;
  if (!notes.trim()) {
    alert('No notes to export.');
    return;
  }

  const timestamp = new Date().toISOString().split('T')[0];
  let filename = `meeting-notes-${timestamp}`;
  let content = notes;
  let mimeType = 'text/plain';

  switch (format) {
    case 'txt':
      filename += '.txt';
      mimeType = 'text/plain';
      break;
    case 'md':
      filename += '.md';
      mimeType = 'text/markdown';
      break;
    case 'html':
      filename += '.html';
      content = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Meeting Notes - ${timestamp}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.6; }
    h1, h2, h3 { color: #333; }
    pre { background: #f4f4f4; padding: 10px; border-radius: 4px; }
  </style>
</head>
<body>
  <pre>${notes}</pre>
</body>
</html>`;
      mimeType = 'text/html';
      break;
    case 'json':
      filename += '.json';
      content = JSON.stringify({
        timestamp: new Date().toISOString(),
        template: templateInsert.value,
        content: notes
      }, null, 2);
      mimeType = 'application/json';
      break;
  }

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  chrome.downloads.download({
    url: url,
    filename: filename,
    saveAs: true
  });

  exportModal.style.display = 'none';
}

// Email actions
async function sendEmail() {
  const notes = collectEmailBody();
  if (!notes) return;

  const to = emailToInput.value.trim();
  if (!to) {
    alert('Please enter a recipient email address.');
    return;
  }

  await chrome.storage.local.set({ userEmail: to });

  const subject = encodeURIComponent(emailSubjectInput.value.trim() || `Meeting Notes - ${formatDateHeading()}`);
  const body = encodeURIComponent(notesEditor.value);

  const mailtoLink = `mailto:${to}?subject=${subject}&body=${body}`;
  window.open(mailtoLink, '_blank');
  exportModal.style.display = 'none';
}

function copyEmailToClipboard() {
  const notes = collectEmailBody();
  if (!notes) return;

  navigator.clipboard.writeText(notes)
    .then(() => alert('Email copied to clipboard'))
    .catch(err => console.error('Clipboard error:', err));
}

function collectEmailBody() {
  const notes = notesEditor.value.trim();
  if (!notes) {
    alert('No notes to share.');
    return null;
  }

  const subject = emailSubjectInput.value.trim() || `Meeting Notes - ${formatDateHeading()}`;
  const body = `Subject: ${subject}\n\n${notes}`;
  return body;
}

function updateEmailPreview() {
  if (!emailPreviewInput) return;
  emailSubjectInput.value = emailSubjectInput.value || `Meeting Notes - ${formatDateHeading()}`;
  emailPreviewInput.value = notesEditor.value.trim();
}

// View history
function viewHistory() {
  chrome.tabs.create({ url: 'history.html' });
}

// Manage templates
function manageTemplates() {
  alert('Template management coming soon! You will be able to:\n\n• Create custom templates\n• Edit existing templates\n• Share templates with your team');
}


// Toggle theme section visibility
function toggleThemeSection() {
  const themeSection = document.getElementById('themeSection');
  themeSection.classList.toggle('hidden');
}

// Close modal when clicking outside
exportModal.addEventListener('click', (e) => {
  if (e.target === exportModal) {
    exportModal.style.display = 'none';
  }
});

settingsModal.addEventListener('click', (e) => {
  if (e.target === settingsModal) {
    settingsModal.style.display = 'none';
  }
});

function openSettings() {
  settingsModal.style.display = 'flex';
}

function applyTheme(theme) {
  currentColorTheme = theme;
  document.body.setAttribute('data-theme', theme);
  document.documentElement.setAttribute('data-theme', theme);

  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.colorTheme === theme);
  });
}

function applySystemTheme() {
  const systemTheme = detectSystemTheme();
  applyTheme(systemTheme);
}

function detectSystemTheme() {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'blue';
}

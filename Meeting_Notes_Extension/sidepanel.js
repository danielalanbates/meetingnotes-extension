// MeetingNotes Side Panel Script
// Handles persistent side panel functionality and AI features

const BASE_TEMPLATES = {
  general: {
    id: 'general',
    title: 'General Meeting',
    themeClass: 'theme-professional',
    content: `<h1>Meeting Notes</h1><p>${formatDateHeading()}</p><h2>Attendees</h2><ul><li></li></ul><h2>Objective</h2><p></p><h2>Discussion</h2><ul><li></li></ul><h2>Decisions</h2><ul><li></li></ul><h2>Action Items</h2><ul><li>☐ </li></ul><h2>Next Steps</h2><ul><li></li></ul>`
  },
  standup: {
    id: 'standup',
    title: 'Daily Standup',
    themeClass: 'theme-minimal',
    content: `<h1>Daily Standup</h1><p>${formatDateHeading()}</p><h2>Yesterday</h2><ul><li></li></ul><h2>Today</h2><ul><li></li></ul><h2>Blockers</h2><ul><li></li></ul><h2>Team Updates</h2><ul><li></li></ul>`
  },
  retrospective: {
    id: 'retrospective',
    title: 'Sprint Retrospective',
    themeClass: 'theme-modern',
    content: `<h1>Sprint Retrospective</h1><p>${formatDateHeading()}</p><h2>What Went Well</h2><ul><li></li></ul><h2>Improvements</h2><ul><li></li></ul><h2>Action Items</h2><ul><li>☐ </li></ul><h2>Appreciation</h2><ul><li></li></ul>`
  },
  '1on1': {
    id: '1on1',
    title: '1-on-1 Meeting',
    themeClass: 'theme-classic',
    content: `<h1>One-on-One Meeting</h1><p>${formatDateHeading()}</p><h2>Check-in</h2><p></p><h2>Discussion Topics</h2><ul><li></li></ul><h2>Feedback</h2><p></p><h2>Commitments</h2><ul><li>☐ </li></ul><h2>Follow-up</h2><p></p>`
  },
  custom: {
    id: 'custom',
    title: 'Blank',
    themeClass: 'theme-minimal',
    content: ''
  }
};

let customTemplates = {};
let templates = { ...BASE_TEMPLATES };

function formatDateHeading() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Global variables
let currentNotes = '';
let isPremium = false;
let autoSaveEnabled = true;
let matchSystemTheme = false;
let autoSaveResetTimer;
let notesEditorEl;
let pendingTemplateKey = null;
let customTemplateOrder = [];
let notesHistory = [];
let selectedTemplateKey = 'custom';
let previousTemplateKey = 'custom';
let editingTemplateId = null;
let autoSaveTimer;
let integrationsState = {}; // populated during configuration load

const MODAL_IDS = [
  'exportModal',
  'shareModal',
  'settingsModal',
  'apiKeyModal',
  'templateApplyModal',
  'historyModal',
  'templateManagerModal',
  'integrationsModal'
];

const modalStack = [];

const TEMPLATE_STORAGE_KEY = 'customTemplates';
const TEMPLATE_ORDER_STORAGE_KEY = 'customTemplateOrder';
const CURRENT_NOTES_HTML_KEY = 'currentNotesHtml';
const CURRENT_NOTES_TEXT_KEY = 'currentNotesText';
const INTEGRATIONS_STORAGE_KEY = 'integrations';

const INTEGRATIONS_CONFIG = {
  onenote: {
    id: 'onenote',
    title: 'Microsoft OneNote',
    description: 'Send notes to your OneNote notebook instantly.',
    icon: '📘',
    connectLabel: 'Connect Microsoft account'
  },
  googleKeep: {
    id: 'googleKeep',
    title: 'Google Keep',
    description: 'Create a new Google Keep note with one click.',
    icon: '🗂️',
    connectLabel: 'Connect Google account'
  },
  appleNotes: {
    id: 'appleNotes',
    title: 'Apple Notes',
    description: 'Save a copy to Apple Notes (requires macOS).',
    icon: '🍏',
    connectLabel: 'Enable Apple Notes sync'
  }
};

function DEFAULT_INTEGRATIONS_STATE() {
  return {
    onenote: { connected: false, lastSync: null },
    googleKeep: { connected: false, lastSync: null },
    appleNotes: { connected: false, lastSync: null }
  };
}

function openIntegrationsModal() {
  const modal = document.getElementById('integrationsModal');
  if (!modal) return;
  modal.style.display = 'flex';
  modal.setAttribute('data-open', 'true');
  pushModal('integrationsModal');
  renderIntegrationsList();
}

function renderIntegrationsList() {
  const list = document.getElementById('integrationsList');
  if (!list) return;
  list.innerHTML = '';

  Object.values(INTEGRATIONS_CONFIG).forEach(config => {
    const state = integrationsState[config.id] || { connected: false };
    const item = document.createElement('div');
    item.className = 'integration-item';
    item.innerHTML = `
      <div class="integration-icon">${config.icon}</div>
      <div class="integration-info">
        <h3>${config.title}</h3>
        <p>${config.description}</p>
      </div>
      <div class="integration-actions">
        <button class="btn btn-secondary" data-action="${state.connected ? 'disconnect' : 'connect'}" data-id="${config.id}">
          ${state.connected ? 'Disconnect' : config.connectLabel}
        </button>
      </div>
    `;
    list.appendChild(item);
  });

  list.querySelectorAll('button[data-action]').forEach(button => {
    button.addEventListener('click', async (event) => {
      const action = event.currentTarget?.dataset.action;
      const id = event.currentTarget?.dataset.id;
      if (!id || !action) return;
      if (action === 'connect') {
        await connectIntegration(id);
      } else {
        await disconnectIntegration(id);
      }
      renderIntegrationsList();
      renderIntegrationActions();
    });
  });

  const closeBtn = document.getElementById('closeIntegrationsModal');
  if (closeBtn) closeBtn.addEventListener('click', () => closeModal('integrationsModal'));

  const modal = document.getElementById('integrationsModal');
  if (modal) {
    modal.addEventListener('click', (event) => {
      if (event.target === modal) closeModal('integrationsModal');
    });
  }
}

async function connectIntegration(id) {
  integrationsState[id] = { connected: true, lastSync: new Date().toISOString() };
  await chrome.storage.local.set({ [INTEGRATIONS_STORAGE_KEY]: integrationsState });
}

async function disconnectIntegration(id) {
  integrationsState[id] = { connected: false, lastSync: null };
  await chrome.storage.local.set({ [INTEGRATIONS_STORAGE_KEY]: integrationsState });
}

function sendToIntegration(id, htmlContent) {
  console.log(`Sending to ${id}:`, htmlContent?.slice(0, 100));
}

function openHistoryModal() {
  const modal = document.getElementById('historyModal');
  if (!modal) return;
  modal.style.display = 'flex';
  modal.setAttribute('data-open', 'true');
  pushModal('historyModal');
  renderHistoryList();
}

async function renderHistoryList() {
  const historyContainer = document.getElementById('historyList');
  if (!historyContainer) return;
  historyContainer.innerHTML = '';

  const { notesHistory: storedHistory = [] } = await chrome.storage.local.get(['notesHistory']);
  const history = storedHistory.slice(0, 50);

  if (!history.length) {
    const emptyState = document.createElement('div');
    emptyState.className = 'history-empty';
    emptyState.textContent = 'No saved notes yet.';
    historyContainer.appendChild(emptyState);
    return;
  }

  history.forEach(entry => {
    const item = document.createElement('div');
    item.className = 'history-item';
    item.innerHTML = `
      <div class="history-meta">
        <strong>${new Date(entry.timestamp).toLocaleString()}</strong>
        <span>${entry.template || 'custom'}</span>
      </div>
      <div class="history-actions">
        <button class="btn btn-secondary" data-action="apply" data-id="${entry.id}">Restore</button>
        <button class="btn btn-secondary" data-action="delete" data-id="${entry.id}">Delete</button>
      </div>
      <div class="history-preview">${entry.content.slice(0, 200)}${entry.content.length > 200 ? '…' : ''}</div>
    `;
    historyContainer.appendChild(item);
  });

  historyContainer.querySelectorAll('button[data-action="apply"]').forEach(btn => {
    btn.addEventListener('click', (event) => {
      const id = event.currentTarget?.dataset.id;
      if (!id) return;
      const entry = history.find(item => item.id === id);
      if (!entry) return;
      setEditorHTML(entry.content);
      updateCharCount();
      closeModal('historyModal');
    });
  });

  historyContainer.querySelectorAll('button[data-action="delete"]').forEach(btn => {
    btn.addEventListener('click', async (event) => {
      const id = event.currentTarget?.dataset.id;
      if (!id) return;
      const updated = history.filter(item => item.id !== id);
      await chrome.storage.local.set({ notesHistory: updated });
      renderHistoryList();
    });
  });

  const closeBtn = document.getElementById('closeHistoryModal');
  if (closeBtn) closeBtn.addEventListener('click', () => closeModal('historyModal'));

  const modal = document.getElementById('historyModal');
  if (modal) {
    modal.addEventListener('click', (event) => {
      if (event.target === modal) closeModal('historyModal');
    });
  }
}

function openTemplateManager() {
  const modal = document.getElementById('templateManagerModal');
  if (!modal) return;
  modal.style.display = 'flex';
  modal.setAttribute('data-open', 'true');
  pushModal('templateManagerModal');
  renderTemplateManagerList();
  wireTemplateManagerControls();
}

function renderTemplateManagerList() {
  const list = document.getElementById('templateList');
  if (!list) return;
  list.innerHTML = '';

  const order = customTemplateOrder.length ? customTemplateOrder : Object.keys(customTemplates);
  order.forEach(id => {
    const template = customTemplates[id];
    if (!template) return;
    const item = document.createElement('button');
    item.className = 'template-item';
    item.dataset.templateId = id;
    item.textContent = template.title || 'Untitled';
    item.addEventListener('click', () => selectTemplateForEditing(id));
    list.appendChild(item);
  });
}

function wireTemplateManagerControls() {
  const newBtn = document.getElementById('newTemplateBtn');
  if (newBtn) newBtn.addEventListener('click', createNewTemplate);

  const saveBtn = document.getElementById('saveTemplateBtn');
  if (saveBtn) saveBtn.addEventListener('click', saveTemplateFromEditor);

  const deleteBtn = document.getElementById('deleteTemplateBtn');
  if (deleteBtn) deleteBtn.addEventListener('click', deleteCurrentTemplate);

  const closeBtn = document.getElementById('closeTemplateManager');
  if (closeBtn) closeBtn.addEventListener('click', () => closeModal('templateManagerModal'));
}

function createNewTemplate() {
  editingTemplateId = null;
  const titleInput = document.getElementById('templateTitleInput');
  const editor = document.getElementById('templateContentEditor');
  if (titleInput) titleInput.value = '';
  if (editor) editor.innerHTML = '';
}

function selectTemplateForEditing(id) {
  editingTemplateId = id;
  const template = customTemplates[id];
  if (!template) return;
  const titleInput = document.getElementById('templateTitleInput');
  const editor = document.getElementById('templateContentEditor');
  if (titleInput) titleInput.value = template.title || '';
  if (editor) editor.innerHTML = template.content || '';
}

async function saveTemplateFromEditor() {
  const titleInput = document.getElementById('templateTitleInput');
  const editor = document.getElementById('templateContentEditor');
  if (!titleInput || !editor) return;

  const title = titleInput.value.trim() || 'Untitled Template';
  const content = editor.innerHTML.trim();
  const id = editingTemplateId || `template_${Date.now()}`;

  customTemplates[id] = {
    id,
    title,
    content,
    themeClass: editor.dataset.themeClass || 'theme-minimal'
  };

  if (!customTemplateOrder.includes(id)) {
    customTemplateOrder.unshift(id);
  }

  await chrome.storage.local.set({
    [TEMPLATE_STORAGE_KEY]: customTemplates,
    [TEMPLATE_ORDER_STORAGE_KEY]: customTemplateOrder
  });

  renderTemplateManagerList();
  refreshTemplateSelectOptions();
}

async function deleteCurrentTemplate() {
  if (!editingTemplateId) return;
  delete customTemplates[editingTemplateId];
  customTemplateOrder = customTemplateOrder.filter(id => id !== editingTemplateId);
  await chrome.storage.local.set({
    [TEMPLATE_STORAGE_KEY]: customTemplates,
    [TEMPLATE_ORDER_STORAGE_KEY]: customTemplateOrder
  });
  editingTemplateId = null;
  renderTemplateManagerList();
  refreshTemplateSelectOptions();
  clearTemplateEditor();
}

function clearTemplateEditor() {
  const titleInput = document.getElementById('templateTitleInput');
  const editor = document.getElementById('templateContentEditor');
  if (titleInput) titleInput.value = '';
  if (editor) editor.innerHTML = '';
}

function refreshTemplateSelectOptions() {
  const select = document.getElementById('templateInsert');
  if (!select) return;
  
  const currentValue = select.value;
  select.innerHTML = '';
  
  // Add Blank template first
  const blankTemplate = BASE_TEMPLATES.custom;
  if (blankTemplate) {
    const option = document.createElement('option');
    option.value = blankTemplate.id;
    option.textContent = blankTemplate.title + '...';
    select.appendChild(option);
  }
  
  // Add other base templates
  Object.values(BASE_TEMPLATES).forEach(template => {
    if (template.id === 'custom') return; // Skip, already added
    const option = document.createElement('option');
    option.value = template.id;
    option.textContent = template.title + '...';
    select.appendChild(option);
  });
  
  // Add custom templates
  const order = customTemplateOrder.length ? customTemplateOrder : Object.keys(customTemplates);
  order.forEach(id => {
    const template = customTemplates[id];
    if (!template) return;
    const option = document.createElement('option');
    option.value = id;
    option.textContent = template.title + '...';
    select.appendChild(option);
  });
  
  // Restore selection
  if (currentValue && templates[currentValue]) {
    select.value = currentValue;
  }
}

function renderIntegrationActions() {
  const container = document.getElementById('integrationActions');
  if (!container) return;
  container.innerHTML = '';
  
  Object.values(INTEGRATIONS_CONFIG).forEach(config => {
    const state = integrationsState[config.id] || { connected: false };
    if (!state.connected) return;
    
    const button = document.createElement('button');
    button.className = 'export-option';
    button.dataset.format = config.id;
    button.innerHTML = `
      <span class="export-icon">${config.icon}</span>
      <span>Send to ${config.title}</span>
    `;
    button.addEventListener('click', () => {
      exportNotes(config.id);
    });
    container.appendChild(button);
  });
  
  if (container.children.length === 0) {
    const emptyMsg = document.createElement('p');
    emptyMsg.className = 'integration-empty';
    emptyMsg.textContent = 'No integrations connected yet.';
    container.appendChild(emptyMsg);
  }
}

function openTemplateApplyModal(templateKey) {
  const modal = document.getElementById('templateApplyModal');
  if (!modal) {
    // Fallback: just confirm
    if (confirm('Replace current notes with this template?')) {
      const template = templates[templateKey] || templates.custom;
      setEditorHTML(template.content || '');
      currentNotes = template.content || '';
      updateCharCount();
      if (autoSaveEnabled) {
        saveCurrentNotes();
      }
    }
    return;
  }
  
  modal.style.display = 'flex';
  modal.setAttribute('data-open', 'true');
  pushModal('templateApplyModal');
}

async function loadTemplatesFromStorage() {
  try {
    const [storedTemplates, storedOrder] = await Promise.all([
      chrome.storage.local.get([TEMPLATE_STORAGE_KEY]),
      chrome.storage.local.get([TEMPLATE_ORDER_STORAGE_KEY])
    ]);

    customTemplates = storedTemplates[TEMPLATE_STORAGE_KEY] || {};
    customTemplateOrder = storedOrder[TEMPLATE_ORDER_STORAGE_KEY] || Object.keys(customTemplates);

    templates = { ...BASE_TEMPLATES, ...customTemplates };
    refreshTemplateSelectOptions();
  } catch (error) {
    console.error('Error loading templates:', error);
  }
}

function getEditorHTML() {
  return (notesEditorEl?.innerHTML || '').trim();
}

function getEditorPlainText() {
  return (notesEditorEl?.innerText || '')
    .replace(/\u00A0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function setEditorHTML(html = '') {
  if (!notesEditorEl) return;
  notesEditorEl.innerHTML = html || '';
  applyTemplateClasses(selectedTemplateKey);
  requestAnimationFrame(() => {
    placeCaretAtEnd(notesEditorEl);
  });
}

function isEditorEmpty() {
  return getEditorPlainText().length === 0 && !getEditorHTML();
}

function placeCaretAtEnd(element) {
  if (!element) return;
  const range = document.createRange();
  range.selectNodeContents(element);
  range.collapse(false);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
}

function handleEditorChange() {
  currentNotes = getEditorHTML();
  updateCharCount();
  updateEmailPreview();
  if (autoSaveEnabled) {
    scheduleAutoSave();
  } else {
    updateAutoSaveStatus('Auto-save off');
  }
}

function handleEditorPaste(event) {
  if (!event.clipboardData) return;
  event.preventDefault();
  const text = event.clipboardData.getData('text/plain');
  insertHtmlAtCursor(text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\n/g, '<br>'));
  handleEditorChange();
}

function scheduleAutoSave() {
  clearTimeout(autoSaveTimer);
  updateAutoSaveStatus('Saving...');
  autoSaveTimer = setTimeout(() => {
    saveCurrentNotes();
    updateAutoSaveStatus('Saved');
    resetAutoSaveStatus();
  }, 600);
}

function insertHtmlAtCursor(html) {
  if (!notesEditorEl) return;
  notesEditorEl.focus();
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;
  const range = selection.getRangeAt(0);
  range.deleteContents();
  const temp = document.createElement('div');
  temp.innerHTML = html;
  const fragment = document.createDocumentFragment();
  let node;
  let lastNode;
  while ((node = temp.firstChild)) {
    lastNode = fragment.appendChild(node);
  }
  range.insertNode(fragment);
  if (lastNode) {
    range.setStartAfter(lastNode);
    range.collapse(true);
  }
  selection.removeAllRanges();
  selection.addRange(range);
}

function applyTemplateClasses(templateKey) {
  if (!notesEditorEl) return;
  notesEditorEl.dataset.template = templateKey;
}

function pushModal(modalId) {
  if (!modalId) return;
  if (!modalStack.includes(modalId)) {
    modalStack.push(modalId);
  }
}

function closeModal(modalId) {
  if (!modalId) return;
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'none';
    modal.removeAttribute('data-open');
  }
  const index = modalStack.lastIndexOf(modalId);
  if (index !== -1) {
    modalStack.splice(index, 1);
  }
}

function peekModal() {
  if (!modalStack.length) return null;
  return modalStack[modalStack.length - 1];
}

function handleGlobalKeydown(event) {
  if (event.key !== 'Escape') return;
  const topModal = peekModal();
  if (topModal) {
    closeModal(topModal);
    event.preventDefault();
    return;
  }
  if (notesEditorEl && document.activeElement !== notesEditorEl) {
    notesEditorEl.focus();
    event.preventDefault();
  }
}

function handleEditorKeydown(event) {
  if (!notesEditorEl) return;

  if (event.key === 'Tab') {
    event.preventDefault();
    document.execCommand('insertHTML', false, '&nbsp;&nbsp;&nbsp;&nbsp;');
    handleEditorChange();
    return;
  }

  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
    event.preventDefault();
    saveNotes();
  }
}

function formatEditorCommand(command, value = null) {
  if (!notesEditorEl) return;
  notesEditorEl.focus();
  document.execCommand('styleWithCSS', false, true);

  switch (command) {
    case 'highlight':
      applyHighlight();
      return;
    case 'createLink': {
      const url = prompt('Enter URL');
      if (!url) return;
      document.execCommand('createLink', false, url.startsWith('http') ? url : `https://${url}`);
      handleEditorChange();
      return;
    }
    case 'formatBlock':
      if (value) {
        document.execCommand('formatBlock', false, `<${value.toLowerCase()}>`);
      } else {
        document.execCommand('formatBlock', false, 'P');
      }
      break;
    case 'insertHTML':
      if (value) {
        document.execCommand('insertHTML', false, value);
      }
      break;
    default:
      document.execCommand(command, false, value);
  }

  handleEditorChange();
}

function applyHighlight() {
  if (!notesEditorEl) return;
  notesEditorEl.focus();
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
    insertHtmlAtCursor('<span style="background: #FFF3B0;">Highlighted text</span>');
  } else {
    document.execCommand('hiliteColor', false, '#FFF3B0');
  }
  handleEditorChange();
}

function wrapHtmlDocument(innerHtml, timestamp) {
  return `<!DOCTYPE html>\n<html>\n<head>\n  <meta charset="UTF-8">\n  <title>Meeting Notes - ${timestamp}</title>\n  <style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;line-height:1.6;padding:24px;color:#111827;background:#F8FAFF;} h1,h2,h3{color:#1D4ED8;}</style>\n</head>\n<body>\n${innerHtml}\n</body>\n</html>`;
}

function htmlToPlainText(html) {
  const temp = document.createElement('div');
  temp.innerHTML = html;
  return temp.textContent || temp.innerText || '';
}

function convertHtmlToMarkdown(html) {
  const container = document.createElement('div');
  container.innerHTML = html;
  const lines = [];

  function process(node, depth = 0) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent.replace(/\s+/g, ' ').trim();
      if (text) lines.push(text);
      return;
    }

    switch (node.nodeName) {
      case 'H1':
        lines.push(`# ${node.textContent.trim()}`);
        lines.push('');
        break;
      case 'H2':
        lines.push(`## ${node.textContent.trim()}`);
        lines.push('');
        break;
      case 'H3':
        lines.push(`### ${node.textContent.trim()}`);
        lines.push('');
        break;
      case 'UL':
        Array.from(node.children).forEach(li => {
          lines.push(`${'  '.repeat(depth)}- ${li.textContent.trim()}`);
        });
        lines.push('');
        break;
      case 'OL':
        Array.from(node.children).forEach((li, index) => {
          lines.push(`${'  '.repeat(depth)}${index + 1}. ${li.textContent.trim()}`);
        });
        lines.push('');
        break;
      case 'P':
        lines.push(node.textContent.trim());
        lines.push('');
        break;
      case 'BLOCKQUOTE':
        lines.push(`> ${node.textContent.trim()}`);
        lines.push('');
        break;
      case 'PRE':
        lines.push('```');
        lines.push(node.textContent);
        lines.push('```');
        lines.push('');
        break;
      default:
        Array.from(node.childNodes).forEach(child => process(child, depth + 1));
    }
  }

  Array.from(container.childNodes).forEach(child => process(child));
  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

function convertHtmlToRTF(html) {
  const text = htmlToPlainText(html)
    .replace(/\\/g, '\\\\')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/\n/g, '\\par ');
  return `{\\rtf1\\ansi ${text}}`;
}

function formatTemplateEditor(command, value = null) {
  const editor = document.getElementById('templateContentEditor');
  if (!editor) return;
  editor.focus();
  document.execCommand('styleWithCSS', false, true);
  if (command === 'highlight') {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      document.execCommand('insertHTML', false, '<span style="background:#FFF3B0;">Highlight</span>');
    } else {
      document.execCommand('hiliteColor', false, '#FFF3B0');
    }
  } else if (command === 'formatBlock' && value) {
    document.execCommand(command, false, value);
  } else {
    document.execCommand(command, false, value);
  }
}

function getTemplateEditorHTML() {
  const editor = document.getElementById('templateContentEditor');
  return (editor?.innerHTML || '').trim();
}

function setTemplateEditorHTML(html = '') {
  const editor = document.getElementById('templateContentEditor');
  if (!editor) return;
  editor.innerHTML = html;
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
  console.log('🚀 Side panel initializing...');

  notesEditorEl = document.getElementById('notesEditor');
  if (notesEditorEl) {
    notesEditorEl.addEventListener('input', handleEditorChange);
    notesEditorEl.addEventListener('paste', handleEditorPaste);
    notesEditorEl.addEventListener('keydown', handleEditorKeydown);
    notesEditorEl.setAttribute('data-placeholder', notesEditorEl.dataset.placeholder || 'Start taking notes...');
  }

  await loadTemplatesFromStorage();

  // Load saved data
  await loadConfiguration();
  await loadSavedNotes();
  await loadColorTheme();
  await checkPremiumStatus();
  await hydrateEmailDefaults();
  updateAutoSaveStatus(autoSaveEnabled ? 'Auto-save on' : 'Auto-save off');

  // Initialize event listeners
  initializeEventListeners();
  document.addEventListener('keydown', handleGlobalKeydown);

  // Initialize AI service (if available) so features are ready
  try {
    if (typeof aiService !== 'undefined' && aiService && typeof aiService.initialize === 'function') {
      const hasKey = await aiService.initialize();
      if (!hasKey) {
        console.log('ℹ️ OpenAI API key not configured. Prompting user to set key in Premium.');
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
    const result = await chrome.storage.local.get([CURRENT_NOTES_HTML_KEY, 'selectedTemplate']);
    currentNotes = result[CURRENT_NOTES_HTML_KEY] || '';

    // Update notes display
    if (notesEditorEl) {
      setEditorHTML(currentNotes);
      updateCharCount();
    }

    // Load template if specified
    const template = result.selectedTemplate;
    if (template) {
      const templateSelect = document.getElementById('templateInsert');
      if (templateSelect) {
        templateSelect.value = template;
      }
      if (getEditorPlainText().length > 0) {
        applyTemplateTheme(template);
      } else {
        applyTemplateContent(template);
      }
    } else {
      applyTemplateTheme('custom');
    }
  } catch (error) {
    console.error('Error loading saved notes:', error);
  }
}

// Load color theme
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
    console.error('Error loading theme:', error);
  }
}

async function loadConfiguration() {
  try {
    const result = await chrome.storage.local.get(['autoSaveEnabled', 'matchSystemTheme', 'integrations']);
    autoSaveEnabled = result.autoSaveEnabled !== undefined ? result.autoSaveEnabled : true;
    matchSystemTheme = result.matchSystemTheme || false;
    integrationsState = result.integrations || DEFAULT_INTEGRATIONS_STATE();

    const toggleAutoSave = document.getElementById('toggleAutoSave');
    if (toggleAutoSave) toggleAutoSave.checked = autoSaveEnabled;

    const toggleSystemTheme = document.getElementById('toggleSystemTheme');
    if (toggleSystemTheme) toggleSystemTheme.checked = matchSystemTheme;

    if (matchSystemTheme) {
      applySystemTheme();
    } else {
      const stored = await chrome.storage.local.get(['colorTheme']);
      applyTheme(stored.colorTheme || 'blue');
    }
  } catch (error) {
    console.error('Error loading configuration:', error);
  }
}

async function hydrateEmailDefaults() {
  try {
    const result = await chrome.storage.local.get(['userEmail']);
    const emailTo = document.getElementById('emailTo');
    if (result.userEmail && emailTo) {
      emailTo.value = result.userEmail;
    }
  } catch (error) {
    console.error('Error loading email defaults:', error);
  }
}

// Check premium status
async function checkPremiumStatus() {
  try {
    const result = await chrome.storage.local.get(['isPremium']);
    // Unlock premium for testing
    isPremium = true; // result.isPremium || false;
    console.log('Premium status (UNLOCKED FOR TESTING):', isPremium);
    
    // Show/hide AI features section based on premium status
    const aiFeaturesSection = document.getElementById('aiFeaturesSection');
    if (aiFeaturesSection) {
      aiFeaturesSection.style.display = isPremium ? 'block' : 'none';
    }
  } catch (error) {
    console.error('Error checking premium:', error);
  }
}

// Initialize event listeners
function initializeEventListeners() {
  // Template selector
  const templateSelect = document.getElementById('templateInsert');
  if (templateSelect) {
    templateSelect.addEventListener('change', (e) => {
      applyTemplateContent(e.target.value);
      chrome.storage.local.set({ selectedTemplate: e.target.value || 'custom' }).catch((error) => {
        console.error('Error saving selected template:', error);
      });
    });

    chrome.storage.local.get(['selectedTemplate']).then((result) => {
      const savedTemplate = result.selectedTemplate;
      if (savedTemplate && templates[savedTemplate]) {
        templateSelect.value = savedTemplate;
        if (currentNotes.trim().length > 0) {
          applyTemplateTheme(savedTemplate);
        } else {
          applyTemplateContent(savedTemplate);
        }
      } else {
        applyTemplateContent('custom');
      }
    }).catch((error) => {
      console.error('Error loading saved template:', error);
      applyTemplateContent('custom');
    });
  }

  const notesEditor = notesEditorEl;

  // Toolbar buttons
  const saveBtn = document.getElementById('saveBtn');
  if (saveBtn) {
    saveBtn.addEventListener('click', saveNotes);
  }

  const clearBtn = document.getElementById('clearBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', clearNotes);
  }

  // Export button - opens export modal with download formats
  const exportBtn = document.getElementById('exportBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const modal = document.getElementById('exportModal');
      if (!modal) return;
      modal.style.display = 'flex';
      modal.setAttribute('data-open', 'true');
      pushModal('exportModal');
    });
  }

  // Share button - auto-sends email to user's registered email
  const shareBtn = document.getElementById('shareBtn');
  if (shareBtn) {
    shareBtn.addEventListener('click', async () => {
      await autoSendEmailToUser();
    });
  }

    document.querySelectorAll('.export-option[data-format]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const format = e.currentTarget.dataset.format;
      if (!format) return;
      exportNotes(format);
    });
  });

  document.querySelectorAll('.premium-option').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!isPremium) {
        closeModal('exportModal');
        openPremiumPage();
        return;
      }
      const format = btn.dataset.premiumFormat;
      exportPremium(format);
    });
  });

  // AI button - shows AI features menu
  const aiBtn = document.getElementById('aiBtn');
  if (aiBtn) {
    aiBtn.addEventListener('click', async () => {
      const isPremium = await checkPremiumStatus();

      if (!isPremium) {
        openPremiumPage();
        return;
      }

      // Show AI features menu
      const aiSection = document.getElementById('aiFeaturesSection');
      if (aiSection) {
        aiSection.style.display = aiSection.style.display === 'none' ? 'block' : 'none';
      }
    });
  }

  // Individual AI feature buttons
  const aiSummarizeBtn = document.getElementById('aiSummarizeBtn');
  if (aiSummarizeBtn) {
    aiSummarizeBtn.addEventListener('click', () => handleAIFeature('summarize'));
  }

  const aiActionItemsBtn = document.getElementById('aiActionItemsBtn');
  if (aiActionItemsBtn) {
    aiActionItemsBtn.addEventListener('click', () => handleAIFeature('action-items'));
  }

  const aiFormatBtn = document.getElementById('aiFormatBtn');
  if (aiFormatBtn) {
    aiFormatBtn.addEventListener('click', () => handleAIFeature('format'));
  }

  const aiFollowUpBtn = document.getElementById('aiFollowUpBtn');
  if (aiFollowUpBtn) {
    aiFollowUpBtn.addEventListener('click', () => handleAIFeature('email'));
  }

  // Premium button
  const premiumBtn = document.getElementById('premiumBtn');
  if (premiumBtn) {
    premiumBtn.addEventListener('click', openPremiumPage);
  }

  const integrationsBtn = document.getElementById('integrationsBtn');
  if (integrationsBtn) {
    integrationsBtn.addEventListener('click', openIntegrationsModal);
  }

  // Theme buttons
  const themeButtons = document.querySelectorAll('.theme-btn');
  themeButtons.forEach(btn => {
    btn.addEventListener('click', (event) => {
      const target = event.currentTarget || btn;
      const theme = target.dataset.colorTheme;
      if (theme) {
        matchSystemTheme = false;
        const toggleSystemTheme = document.getElementById('toggleSystemTheme');
        if (toggleSystemTheme) toggleSystemTheme.checked = false;
        chrome.storage.local.set({ matchSystemTheme: false });
        applyTheme(theme);
        saveTheme(theme);
        resetAutoSaveStatus();
      }
    });
  });

  // Formatting toolbar buttons
  document.querySelectorAll('[data-editor-command]').forEach(btn => {
    btn.addEventListener('click', () => {
      const command = btn.dataset.editorCommand;
      const value = btn.dataset.editorValue || null;
      if (!command) return;
      if (command === 'formatBlock') {
        formatEditorCommand(command, value);
      } else {
        formatEditorCommand(command, value);
      }
    });
  });

  // Settings button
  const settingsBtn = document.getElementById('settingsBtn');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', openSettings);
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

  const closeExportModal = document.getElementById('closeExportModal');
  const exportModal = document.getElementById('exportModal');
  if (closeExportModal && exportModal) {
    closeExportModal.addEventListener('click', () => closeModal('exportModal'));
    exportModal.addEventListener('click', (e) => {
      if (e.target === exportModal) closeModal('exportModal');
    });
  }

  const closeShareModal = document.getElementById('closeShareModal');
  const shareModal = document.getElementById('shareModal');
  if (closeShareModal && shareModal) {
    closeShareModal.addEventListener('click', () => closeModal('shareModal'));
    shareModal.addEventListener('click', (e) => {
      if (e.target === shareModal) closeModal('shareModal');
    });
  }

  const sendEmailBtn = document.getElementById('sendEmailBtn');
  if (sendEmailBtn) sendEmailBtn.addEventListener('click', sendEmail);

  const copyEmailBtn = document.getElementById('copyEmailBtn');
  if (copyEmailBtn) copyEmailBtn.addEventListener('click', copyEmailToClipboard);

  const settingsModal = document.getElementById('settingsModal');
  const closeSettingsModal = document.getElementById('closeSettingsModal');
  if (closeSettingsModal && settingsModal) {
    closeSettingsModal.addEventListener('click', () => closeModal('settingsModal'));
    settingsModal.addEventListener('click', (e) => {
      if (e.target === settingsModal) closeModal('settingsModal');
    });
  }

  const toggleAutoSave = document.getElementById('toggleAutoSave');
  if (toggleAutoSave) {
    toggleAutoSave.addEventListener('change', (e) => {
      autoSaveEnabled = e.target.checked;
      chrome.storage.local.set({ autoSaveEnabled });
      updateAutoSaveStatus(autoSaveEnabled ? 'Auto-save on' : 'Auto-save off');
    });
  }

  const toggleSystemTheme = document.getElementById('toggleSystemTheme');
  if (toggleSystemTheme) {
    toggleSystemTheme.addEventListener('change', async (e) => {
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

  // Modal close/save handlers
  const closeApiKeyModal = document.getElementById('closeApiKeyModal');
  if (closeApiKeyModal) closeApiKeyModal.addEventListener('click', () => closeModal('apiKeyModal'));

  const cancelSideApiKeyBtn = document.getElementById('cancelSideApiKeyBtn');
  if (cancelSideApiKeyBtn) cancelSideApiKeyBtn.addEventListener('click', () => closeModal('apiKeyModal'));

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
      closeModal('apiKeyModal');
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

  // Template apply modal handlers
  const replaceNotesBtn = document.getElementById('replaceNotesBtn');
  if (replaceNotesBtn) replaceNotesBtn.addEventListener('click', () => {
    if (!pendingTemplateKey) return;
    const template = templates[pendingTemplateKey] || templates.custom;
    setEditorHTML(template.content || '');
    currentNotes = template.content || '';
    updateCharCount();
    if (autoSaveEnabled) saveCurrentNotes();
    closeModal('templateApplyModal');
    pendingTemplateKey = null;
  });

  const appendTemplateBtn = document.getElementById('appendTemplateBtn');
  if (appendTemplateBtn) appendTemplateBtn.addEventListener('click', () => {
    if (!pendingTemplateKey) return;
    const template = templates[pendingTemplateKey] || templates.custom;
    const currentContent = getEditorHTML();
    const newContent = currentContent + '<br>' + (template.content || '');
    setEditorHTML(newContent);
    currentNotes = newContent;
    updateCharCount();
    if (autoSaveEnabled) saveCurrentNotes();
    closeModal('templateApplyModal');
    pendingTemplateKey = null;
  });

  const cancelTemplateBtn = document.getElementById('cancelTemplateBtn');
  if (cancelTemplateBtn) cancelTemplateBtn.addEventListener('click', () => {
    closeModal('templateApplyModal');
    pendingTemplateKey = null;
  });

  const closeTemplateApplyModal = document.getElementById('closeTemplateApplyModal');
  if (closeTemplateApplyModal) closeTemplateApplyModal.addEventListener('click', () => {
    closeModal('templateApplyModal');
    pendingTemplateKey = null;
  });
}

// Handle template change
function applyTemplateContent(templateKey) {
  const template = templates[templateKey] || templates.custom;
  const editor = notesEditorEl;
  if (!editor) return;

  selectedTemplateKey = templateKey;
  applyTemplateTheme(templateKey);

  if (!isEditorEmpty()) {
    pendingTemplateKey = templateKey;
    openTemplateApplyModal(templateKey);
    return;
  }

  const templateHtml = template.content || '';
  setEditorHTML(templateHtml);
  currentNotes = templateHtml;
  updateCharCount();
  if (autoSaveEnabled) {
    saveCurrentNotes();
    updateAutoSaveStatus('Saved');
    resetAutoSaveStatus();
  }
  updateEmailPreview();
}

function applyTemplateTheme(templateKey) {
  const template = templates[templateKey] || templates.custom;
  const themeClass = template.themeClass || 'theme-minimal';
  applyTemplateClasses(templateKey);
  if (notesEditorEl) {
    notesEditorEl.classList.remove('theme-professional', 'theme-minimal', 'theme-modern', 'theme-classic');
    notesEditorEl.classList.add(themeClass);
  }
}

function updateCharCount() {
  const charCount = document.getElementById('charCount');

  if (charCount) {
    const count = getEditorPlainText().length;
    charCount.textContent = `${count} characters`;
  }
}

// Save current notes
function saveCurrentNotes() {
  chrome.storage.local.set({ [CURRENT_NOTES_HTML_KEY]: getEditorHTML() });
}

// Save notes to history
async function saveNotes() {
  const notes = getEditorHTML();
  if (!getEditorPlainText()) {
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
    notesHistory = result.notesHistory || [];
    notesHistory.unshift(noteEntry);

    if (notesHistory.length > 100) {
      notesHistory.pop();
    }

    await chrome.storage.local.set({ notesHistory });

    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn) {
      saveBtn.textContent = 'Saved!';
      saveBtn.classList.add('success');

      setTimeout(() => {
        saveBtn.textContent = 'Save Note';
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
    setEditorHTML('');
    updateCharCount();
    chrome.storage.local.set({ [CURRENT_NOTES_HTML_KEY]: '' });
  }
}

function exportNotes(format) {
  const notesHtml = getEditorHTML();
  const notesText = getEditorPlainText();
  if (!notesText) {
    alert('No notes to export.');
    return;
  }

  const timestamp = new Date().toISOString().split('T')[0];
  let filename = `meeting-notes-${timestamp}`;
  let content = notesText;
  let mimeType = 'text/plain';

  switch (format) {
    case 'md':
      filename += '.md';
      mimeType = 'text/markdown';
      content = convertHtmlToMarkdown(notesHtml);
      break;
    case 'html':
      filename += '.html';
      content = wrapHtmlDocument(notesHtml, timestamp);
      mimeType = 'text/html';
      break;
    case 'json':
      filename += '.json';
      content = JSON.stringify({
        timestamp: new Date().toISOString(),
        template: document.getElementById('templateInsert')?.value || 'custom',
        content: notesHtml
      }, null, 2);
      mimeType = 'application/json';
      break;
    case 'doc':
      filename += '.doc';
      content = wrapHtmlDocument(notesHtml, timestamp);
      mimeType = 'application/msword';
      break;
    case 'rtf':
      filename += '.rtf';
      content = convertHtmlToRTF(notesHtml);
      mimeType = 'application/rtf';
      break;
    case 'onenote':
      sendToIntegration('onenote', notesHtml);
      closeModal('exportModal');
      return;
    case 'googleKeep':
      sendToIntegration('googleKeep', notesHtml);
      closeModal('exportModal');
      return;
    case 'appleNotes':
      sendToIntegration('appleNotes', notesHtml);
      closeModal('exportModal');
      return;
    case 'txt':
    default:
      filename += '.txt';
      mimeType = 'text/plain';
  }

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  chrome.downloads.download({
    url,
    filename,
    saveAs: false
  });

  URL.revokeObjectURL(url);

  const modal = document.getElementById('exportModal');
  if (modal) closeModal('exportModal');
}

function exportPremium(format) {
  if (!format) return;
  switch (format) {
    case 'word':
      exportNotes('doc');
      break;
    case 'pages':
      exportNotes('rtf');
      break;
    case 'gdocs':
      // Download as RTF instead of copy-paste
      exportNotes('rtf');
      break;
    default:
      exportNotes('txt');
  }
}

// View history
function viewHistory() {
  openHistoryModal();
}

// Manage templates
function manageTemplates() {
  openTemplateManager();
}

// Auto-send email to user's registered email
async function autoSendEmailToUser() {
  const notes = getEditorPlainText();
  if (!notes) {
    alert('No notes to share.');
    return;
  }

  // Get user's registered email from storage
  const result = await chrome.storage.local.get(['userEmail']);
  const userEmail = result.userEmail;
  
  if (!userEmail) {
    alert('No email address registered. Please set up your account in Premium settings.');
    openPremiumPage();
    return;
  }

  const subject = encodeURIComponent(`Meeting Notes - ${formatDateHeading()}`);
  const body = encodeURIComponent(notes);

  window.open(`mailto:${userEmail}?subject=${subject}&body=${body}`, '_blank');
}

async function sendEmail() {
  const notes = getEditorPlainText();
  if (!notes) {
    alert('No notes to share.');
    return;
  }

  const emailTo = document.getElementById('emailTo');
  const emailSubject = document.getElementById('emailSubject');
  const to = emailTo?.value.trim();
  if (!to) {
    alert('Please enter a recipient email address.');
    return;
  }

  await chrome.storage.local.set({ userEmail: to });

  const subject = encodeURIComponent(emailSubject?.value.trim() || `Meeting Notes - ${formatDateHeading()}`);
  const body = encodeURIComponent(notes);

  window.open(`mailto:${to}?subject=${subject}&body=${body}`, '_blank');

  const modal = document.getElementById('shareModal');
  if (modal) closeModal('shareModal');
}

function copyEmailToClipboard() {
  const notes = getEditorPlainText();
  if (!notes) {
    alert('No notes to copy.');
    return;
  }

  const subject = document.getElementById('emailSubject')?.value.trim() || `Meeting Notes - ${formatDateHeading()}`;
  const composed = `Subject: ${subject}\n\n${notes}`;

  navigator.clipboard.writeText(composed)
    .then(() => alert('Email copied to clipboard'))
    .catch(err => console.error('Clipboard error:', err));
}

function updateEmailPreview() {
  const preview = document.getElementById('emailPreview');
  const subject = document.getElementById('emailSubject');
  if (!preview) return;

  if (subject && !subject.value) {
    subject.value = `Meeting Notes - ${formatDateHeading()}`;
  }

  preview.value = getEditorPlainText();
}

async function shareToGoogleDocs() {
  const notes = getEditorPlainText();
  if (!notes) {
    alert('No notes to share.');
    return;
  }

  try {
    await navigator.clipboard.writeText(notes);
    window.open('https://docs.google.com/document/u/0/create', '_blank');
    alert('Notes copied to clipboard. Paste into your new Google Doc.');
  } catch (error) {
    console.error('Clipboard error:', error);
    alert('Unable to copy notes automatically. Please copy manually.');
  }

  const modal = document.getElementById('exportModal');
  if (modal) modal.style.display = 'none';
}

// Handle AI assist - now just opens premium page
async function handleAIAssist() {
  openPremiumPage();
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
  document.body.setAttribute('data-theme', theme);

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

function updateAutoSaveStatus(text) {
  const status = document.getElementById('autoSaveStatus');
  if (!status) return;
  status.textContent = text;
  status.className = 'auto-save';
}

function resetAutoSaveStatus() {
  clearTimeout(autoSaveResetTimer);
  autoSaveResetTimer = setTimeout(() => {
    if (autoSaveEnabled) {
      updateAutoSaveStatus('Auto-save on');
    }
  }, 2000);
}

function openSettings() {
  const modal = document.getElementById('settingsModal');
  if (modal) modal.style.display = 'flex';
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

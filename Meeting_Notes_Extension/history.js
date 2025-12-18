// BatesAI Meeting Notes - History Page Script

document.addEventListener('DOMContentLoaded', async () => {
  await loadHistory();
});

async function loadHistory() {
  try {
    const result = await chrome.storage.local.get(['notesHistory']);
    const history = result.notesHistory || [];

    const historyList = document.getElementById('historyList');
    const emptyState = document.getElementById('emptyState');
    const totalNotes = document.getElementById('totalNotes');

    totalNotes.textContent = history.length;

    if (history.length === 0) {
      historyList.style.display = 'none';
      emptyState.style.display = 'block';
      return;
    }

    historyList.innerHTML = '';

    history.forEach((note, index) => {
      const item = createHistoryItem(note, index);
      historyList.appendChild(item);
    });

  } catch (error) {
    console.error('Error loading history:', error);
  }
}

function createHistoryItem(note, index) {
  const item = document.createElement('div');
  item.className = 'history-item';

  const date = new Date(note.timestamp);
  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const preview = note.content.substring(0, 150).replace(/\n/g, ' ');

  item.innerHTML = `
    <div class="history-item-header">
      <div class="history-date">${formattedDate}</div>
      <div class="history-platform">${note.platform || 'Unknown'}</div>
    </div>
    <div class="history-preview">${preview}${note.content.length > 150 ? '...' : ''}</div>
    <div class="history-actions">
      <button class="history-btn view-btn" data-index="${index}">View</button>
      <button class="history-btn restore-btn" data-index="${index}">Restore</button>
      <button class="history-btn export-btn" data-index="${index}">Export</button>
      <button class="history-btn delete-btn" data-index="${index}">Delete</button>
    </div>
  `;

  // Add event listeners
  item.querySelector('.view-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    viewNote(note);
  });

  item.querySelector('.restore-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    restoreNote(note);
  });

  item.querySelector('.export-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    exportNote(note);
  });

  item.querySelector('.delete-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    deleteNote(index);
  });

  // Click on item to view
  item.addEventListener('click', () => viewNote(note));

  return item;
}

function viewNote(note) {
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 20px;
  `;

  const date = new Date(note.timestamp);
  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  modal.innerHTML = `
    <div style="
      background: white;
      border-radius: 16px;
      max-width: 800px;
      width: 100%;
      max-height: 80vh;
      overflow: auto;
      padding: 40px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    ">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2 style="margin: 0; font-size: 24px;">Meeting Notes</h2>
        <button id="closeModal" style="
          width: 32px;
          height: 32px;
          border: none;
          background: transparent;
          font-size: 24px;
          cursor: pointer;
          color: #6b7280;
        ">&times;</button>
      </div>
      <div style="color: #6b7280; font-size: 14px; margin-bottom: 20px;">
        ${formattedDate} • ${note.platform || 'Unknown'}
      </div>
      <pre style="
        white-space: pre-wrap;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        line-height: 1.7;
        color: #1a1a1a;
        font-size: 15px;
      ">${note.content}</pre>
    </div>
  `;

  document.body.appendChild(modal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
    }
  });

  modal.querySelector('#closeModal').addEventListener('click', () => {
    document.body.removeChild(modal);
  });
}

async function restoreNote(note) {
  if (confirm('Restore this note to the editor? This will replace any current notes.')) {
    await chrome.storage.local.set({ currentNotes: note.content });
    alert('Note restored! Open the extension popup to see it.');
  }
}

function exportNote(note) {
  const date = new Date(note.timestamp);
  const filename = `meeting-notes-${date.toISOString().split('T')[0]}.txt`;

  const blob = new Blob([note.content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);

  chrome.downloads.download({
    url: url,
    filename: filename,
    saveAs: true
  });
}

async function deleteNote(index) {
  if (confirm('Delete this note? This cannot be undone.')) {
    const result = await chrome.storage.local.get(['notesHistory']);
    const history = result.notesHistory || [];

    history.splice(index, 1);

    await chrome.storage.local.set({ notesHistory: history });

    // Reload the page
    await loadHistory();
  }
}

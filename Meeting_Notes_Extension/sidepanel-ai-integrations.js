/**
 * MeetingNotes - AI Features Integration
 * Wires up all AI services to the sidepanel UI
 */

// ======================
// GLOBAL STATE
// ======================
let isVoiceRecording = false;
let currentMeetingHash = null;
let currentMeetingInfo = null;

// ======================
// 1. VOICE-TO-TEXT NOTES
// ======================

const voiceBtn = document.getElementById('voiceBtn');
const voiceStatus = document.getElementById('voiceStatus');
const voiceStatusText = document.getElementById('voiceStatusText');
const voiceInterim = document.getElementById('voiceInterim');
const notesEditor = document.getElementById('notesEditor');

// Check if voice notes supported
if (!VoiceNotesService.isSupported()) {
  voiceBtn.disabled = true;
  voiceBtn.title = 'Voice recognition not supported in this browser';
}

// Voice button click handler
voiceBtn?.addEventListener('click', async () => {
  // Check premium status
  const isPremium = await checkPremiumStatus();
  if (!isPremium) {
    showPremiumPrompt('Voice-to-Text Notes');
    return;
  }

  if (!isVoiceRecording) {
    // Start recording
    try {
      voiceNotesService.start();
      isVoiceRecording = true;
      voiceBtn.classList.add('recording');
      voiceBtn.textContent = '⏹️';
      voiceBtn.title = 'Stop Recording';
      voiceStatus.style.display = 'block';
    } catch (error) {
      console.error('Failed to start voice recording:', error);
      showNotification('❌ Failed to start voice recording: ' + error.message, 'error');
    }
  } else {
    // Stop recording
    voiceNotesService.stop();
    isVoiceRecording = false;
    voiceBtn.classList.remove('recording');
    voiceBtn.textContent = '🎤';
    voiceBtn.title = 'Voice Notes 🎤 (Premium)';
    voiceStatus.style.display = 'none';
  }
});

// Handle voice transcripts
voiceNotesService.onTranscript(async (text, type) => {
  if (type === 'final') {
    // Final transcript - add to notes
    const isPremium = await checkPremiumStatus();

    let textToInsert = text;

    // Format with AI if premium and text is substantial
    if (isPremium && text.length > 20) {
      try {
        textToInsert = await voiceNotesService.formatWithAI(text);
      } catch (error) {
        console.error('AI formatting failed, using raw transcript:', error);
      }
    }

    // Insert into editor
    const currentContent = notesEditor.innerHTML;
    notesEditor.innerHTML = currentContent + textToInsert + '<br>';

    // Clear interim display
    voiceInterim.textContent = '';

    // Trigger auto-save
    if (typeof handleAutoSave === 'function') {
      handleAutoSave();
    }
  } else if (type === 'interim') {
    // Show interim results
    voiceInterim.textContent = `"${text}..."`;
  }
});

// Handle voice status changes
voiceNotesService.onStatusChange((status, error) => {
  if (status === 'listening') {
    voiceStatusText.textContent = 'Listening...';
  } else if (status === 'stopped') {
    voiceStatus.style.display = 'none';
  } else if (status === 'paused') {
    voiceStatusText.textContent = 'Paused';
  } else if (status === 'error') {
    showNotification(`❌ Voice error: ${error}`, 'error');
    isVoiceRecording = false;
    voiceBtn.classList.remove('recording');
    voiceBtn.textContent = '🎤';
    voiceStatus.style.display = 'none';
  }
});

// ======================
// 2. SEARCH FUNCTIONALITY
// ======================

const searchBtn = document.getElementById('searchBtn');
const searchModal = document.getElementById('searchModal');
const closeSearchModal = document.getElementById('closeSearchModal');
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');

searchBtn?.addEventListener('click', () => {
  searchModal.style.display = 'flex';
  searchInput.focus();
});

closeSearchModal?.addEventListener('click', () => {
  searchModal.style.display = 'none';
});

// Search input handler
let searchTimeout;
searchInput?.addEventListener('input', () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(async () => {
    const query = searchInput.value.trim();

    if (!query) {
      searchResults.innerHTML = '';
      return;
    }

    try {
      const results = await searchAnalyticsService.searchNotes(query, {
        caseSensitive: false,
        searchIn: ['title', 'notes', 'tags'],
        limit: 20
      });

      displaySearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
      searchResults.innerHTML = '<div class="empty-state"><p>Search failed. Please try again.</p></div>';
    }
  }, 300); // Debounce 300ms
});

function displaySearchResults(results) {
  if (results.length === 0) {
    searchResults.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔍</div>
        <div class="empty-state-message">No results found</div>
        <div class="empty-state-hint">Try different keywords or tags</div>
      </div>
    `;
    return;
  }

  searchResults.innerHTML = results.map(note => `
    <div class="search-result" data-note-id="${note.id || ''}">
      <div class="result-title">${escapeHtml(note.title || 'Untitled Meeting')}</div>
      <div class="result-snippet">${escapeHtml(note.notes.substring(0, 150))}...</div>
      <div class="result-meta">
        <span>${note.platform || 'Unknown'}</span>
        <span>•</span>
        <span>${formatDate(note.timestamp)}</span>
        ${note.tags ? `<span>•</span><span>${note.tags.join(', ')}</span>` : ''}
      </div>
    </div>
  `).join('');

  // Add click handlers to load notes
  searchResults.querySelectorAll('.search-result').forEach(result => {
    result.addEventListener('click', () => {
      const noteId = result.getAttribute('data-note-id');
      loadNoteFromHistory(noteId);
      searchModal.style.display = 'none';
    });
  });
}

// Search filters
document.querySelectorAll('.search-filters .filter-btn').forEach(btn => {
  btn.addEventListener('click', async () => {
    document.querySelectorAll('.search-filters .filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const filter = btn.getAttribute('data-filter');

    // TODO: Implement filter-specific search logic
    console.log('Filter selected:', filter);
  });
});

// ======================
// 3. ANALYTICS DASHBOARD
// ======================

const analyticsBtn = document.getElementById('analyticsBtn');
const analyticsModal = document.getElementById('analyticsModal');
const closeAnalyticsModal = document.getElementById('closeAnalyticsModal');
const analyticsContent = document.getElementById('analyticsContent');

analyticsBtn?.addEventListener('click', async () => {
  analyticsModal.style.display = 'flex';
  await loadAnalytics('week');
});

closeAnalyticsModal?.addEventListener('click', () => {
  analyticsModal.style.display = 'none';
});

// Time range selector
document.querySelectorAll('.time-range-selector .time-btn').forEach(btn => {
  btn.addEventListener('click', async () => {
    document.querySelectorAll('.time-range-selector .time-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const range = btn.getAttribute('data-range');
    await loadAnalytics(range);
  });
});

async function loadAnalytics(timeRange) {
  analyticsContent.innerHTML = `
    <div class="loading-overlay">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <div class="loading-text">Loading analytics...</div>
      </div>
    </div>
  `;

  try {
    const analytics = await searchAnalyticsService.getMeetingAnalytics(timeRange);
    const insights = await searchAnalyticsService.getProductivityInsights(timeRange);

    displayAnalytics(analytics, insights, timeRange);
  } catch (error) {
    console.error('Failed to load analytics:', error);
    analyticsContent.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📊</div>
        <div class="empty-state-message">Failed to load analytics</div>
        <div class="empty-state-hint">Please try again later</div>
      </div>
    `;
  }
}

function displayAnalytics(analytics, insights, timeRange) {
  const timeRangeLabel = {
    'week': 'This Week',
    'month': 'This Month',
    'quarter': 'This Quarter',
    'year': 'This Year'
  }[timeRange] || 'This Week';

  analyticsContent.innerHTML = `
    <div class="analytics-grid">
      <div class="stat-card">
        <div class="stat-value">${analytics.totalMeetings || 0}</div>
        <div class="stat-label">Total Meetings</div>
      </div>

      <div class="stat-card">
        <div class="stat-value">${analytics.avgMeetingsPerWeek || 0}</div>
        <div class="stat-label">Avg/Week</div>
      </div>

      <div class="stat-card">
        <div class="stat-value">${analytics.busiestDay?.day || 'N/A'}</div>
        <div class="stat-label">Busiest Day</div>
      </div>

      <div class="stat-card">
        <div class="stat-value">${analytics.totalActionItems || 0}</div>
        <div class="stat-label">Action Items</div>
      </div>
    </div>

    ${insights && insights.length > 0 ? `
      <div class="insights-section">
        <h4>💡 Insights</h4>
        ${insights.map(insight => `
          <div class="insight-card ${insight.type || 'info'}">
            ${insight.message || ''}
          </div>
        `).join('')}
      </div>
    ` : ''}

    ${analytics.topPlatforms && analytics.topPlatforms.length > 0 ? `
      <div class="insights-section">
        <h4>📍 Top Platforms</h4>
        ${analytics.topPlatforms.map(p => `
          <div class="insight-card info">
            ${p.platform}: ${p.count} meeting${p.count !== 1 ? 's' : ''}
          </div>
        `).join('')}
      </div>
    ` : ''}
  `;
}

// ======================
// 4. CALENDAR INTEGRATION
// ======================

const calendarBtn = document.getElementById('calendarBtn');
const calendarModal = document.getElementById('calendarModal');
const closeCalendarModal = document.getElementById('closeCalendarModal');
const connectCalendarBtn = document.getElementById('connectCalendarBtn');
const disconnectCalendarBtn = document.getElementById('disconnectCalendarBtn');
const calendarNotConnected = document.getElementById('calendarNotConnected');
const calendarConnected = document.getElementById('calendarConnected');

calendarBtn?.addEventListener('click', async () => {
  calendarModal.style.display = 'flex';
  await checkCalendarStatus();
});

closeCalendarModal?.addEventListener('click', () => {
  calendarModal.style.display = 'none';
});

async function checkCalendarStatus() {
  const isConnected = await calendarIntegrationService.isConnected();

  if (isConnected) {
    calendarNotConnected.style.display = 'none';
    calendarConnected.style.display = 'block';
  } else {
    calendarNotConnected.style.display = 'block';
    calendarConnected.style.display = 'none';
  }
}

connectCalendarBtn?.addEventListener('click', async () => {
  try {
    showNotification('🔄 Connecting to Google Calendar...', 'info');
    await calendarIntegrationService.authenticate();
    showNotification('✅ Calendar connected successfully!', 'success');
    await checkCalendarStatus();
  } catch (error) {
    console.error('Calendar authentication failed:', error);
    showNotification('❌ Failed to connect calendar: ' + error.message, 'error');
  }
});

disconnectCalendarBtn?.addEventListener('click', async () => {
  try {
    await calendarIntegrationService.signOut();
    showNotification('Calendar disconnected', 'info');
    await checkCalendarStatus();
  } catch (error) {
    console.error('Calendar disconnect failed:', error);
  }
});

// ======================
// 5. ACTION ITEMS TRACKING
// ======================

const actionItemsModal = document.getElementById('actionItemsModal');
const closeActionItemsModal = document.getElementById('closeActionItemsModal');
const actionItemsList = document.getElementById('actionItemsList');

closeActionItemsModal?.addEventListener('click', () => {
  actionItemsModal.style.display = 'none';
});

async function showActionItems(statusFilter = 'all') {
  actionItemsModal.style.display = 'flex';

  actionItemsList.innerHTML = `
    <div class="loading-overlay">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <div class="loading-text">Loading action items...</div>
      </div>
    </div>
  `;

  try {
    let items = await actionItemsService.getAllActionItems();

    // Filter items
    if (statusFilter !== 'all') {
      items = items.filter(item => {
        if (statusFilter === 'completed') return item.completed;
        if (statusFilter === 'pending') return !item.completed && !item.isOverdue;
        if (statusFilter === 'overdue') return item.isOverdue;
        return true;
      });
    }

    if (items.length === 0) {
      actionItemsList.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📋</div>
          <div class="empty-state-message">No action items found</div>
          <div class="empty-state-hint">Action items will appear here after meetings</div>
        </div>
      `;
      return;
    }

    actionItemsList.innerHTML = items.map(item => `
      <div class="action-item ${item.completed ? 'completed' : ''} ${item.isOverdue ? 'overdue' : ''}">
        <input type="checkbox" ${item.completed ? 'checked' : ''} data-id="${item.id}" />
        <div class="action-item-content">
          <div class="action-item-task">${escapeHtml(item.task)}</div>
          <div class="action-item-meta">
            <span class="owner">${escapeHtml(item.owner)}</span>
            ${item.dueDate ? `
              <span class="due-date">Due: ${formatDate(item.dueDate)}</span>
            ` : ''}
            ${item.isOverdue ? '<span class="overdue-badge">OVERDUE</span>' : ''}
          </div>
        </div>
      </div>
    `).join('');

    // Add checkbox event listeners
    actionItemsList.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
      checkbox.addEventListener('change', async () => {
        const itemId = checkbox.getAttribute('data-id');
        if (checkbox.checked) {
          await actionItemsService.markCompleted(itemId);
          checkbox.closest('.action-item').classList.add('completed');
          showNotification('✅ Action item marked as completed', 'success');
        }
      });
    });
  } catch (error) {
    console.error('Failed to load action items:', error);
    actionItemsList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">❌</div>
        <div class="empty-state-message">Failed to load action items</div>
        <div class="empty-state-hint">Please try again</div>
      </div>
    `;
  }
}

// Action item filters
document.querySelectorAll('.action-items-filters .filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.action-items-filters .filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const status = btn.getAttribute('data-status');
    showActionItems(status);
  });
});

// ======================
// 6. MEETING DETECTION & RECURRING INTELLIGENCE
// ======================

// Called when a meeting is detected (from background.js or content script)
async function onMeetingDetected(meetingInfo) {
  currentMeetingInfo = meetingInfo;
  currentMeetingHash = meetingDetectionService.getMeetingHash(meetingInfo.url);

  // Try to get meeting from calendar
  try {
    if (await calendarIntegrationService.isConnected()) {
      const calendarMeeting = await calendarIntegrationService.getCurrentMeeting();

      if (calendarMeeting) {
        // Auto-populate meeting details
        document.getElementById('meetingTitle').textContent = calendarMeeting.title;
        currentMeetingInfo = { ...currentMeetingInfo, ...calendarMeeting };

        showNotificationBanner({
          icon: '📅',
          message: 'Meeting details loaded from calendar',
          type: 'success'
        });
      }
    }
  } catch (error) {
    console.error('Failed to get calendar meeting:', error);
  }

  // Detect meeting type
  const detection = meetingDetectionService.detectMeetingType({
    title: meetingInfo.title || '',
    attendeeCount: meetingInfo.attendeeCount || 0,
    startTime: new Date(),
    duration: 60
  });

  // Suggest template if confidence is high
  if (detection.confidence >= 70) {
    showNotificationBanner({
      icon: '💡',
      message: `This looks like a ${formatMeetingType(detection.type)}. Load ${detection.template} template?`,
      actions: [
        {
          text: 'Yes',
          primary: true,
          action: () => {
            loadTemplate(detection.template);
            dismissBanner();
          }
        },
        {
          text: 'No',
          action: () => dismissBanner()
        }
      ]
    });
  }

  // Check for recurring meeting
  const isRecurring = await recurringMeetingService.isRecurringMeeting(currentMeetingHash);

  if (isRecurring) {
    const history = await recurringMeetingService.getMeetingHistory(currentMeetingHash);

    if (history.lastMeeting) {
      const daysSince = Math.floor(
        (new Date() - new Date(history.lastMeeting.timestamp)) / (1000 * 60 * 60 * 24)
      );

      showNotificationBanner({
        icon: '🔄',
        message: `Recurring meeting detected! Last meeting was ${daysSince} day${daysSince !== 1 ? 's' : ''} ago.`,
        actions: [
          {
            text: 'Compare',
            primary: true,
            action: async () => {
              await showMeetingComparison(currentMeetingHash);
              dismissBanner();
            }
          },
          {
            text: 'Dismiss',
            action: () => dismissBanner()
          }
        ]
      });
    }
  }
}

// Show meeting comparison modal
const comparisonModal = document.getElementById('comparisonModal');
const closeComparisonModal = document.getElementById('closeComparisonModal');
const comparisonContent = document.getElementById('comparisonContent');

closeComparisonModal?.addEventListener('click', () => {
  comparisonModal.style.display = 'none';
});

async function showMeetingComparison(meetingHash) {
  comparisonModal.style.display = 'flex';

  comparisonContent.innerHTML = `
    <div class="loading-overlay">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <div class="loading-text">Comparing meetings...</div>
      </div>
    </div>
  `;

  try {
    const currentNotes = notesEditor.innerText;
    const comparison = await recurringMeetingService.compareWithPrevious(meetingHash, currentNotes);

    if (comparison.isFirstMeeting) {
      comparisonContent.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🎉</div>
          <div class="empty-state-message">First meeting!</div>
          <div class="empty-state-hint">Future meetings will be compared to this one</div>
        </div>
      `;
      return;
    }

    // Display comparison (HTML or parsed markdown)
    comparisonContent.innerHTML = `
      <div class="comparison-section">
        <h4>📊 Changes Since Last Meeting</h4>
        <div>${formatComparisonResults(comparison.comparison)}</div>
      </div>

      ${comparison.actionItemsFromLast && comparison.actionItemsFromLast.length > 0 ? `
        <div class="comparison-section">
          <h4>📋 Action Items from Last Meeting</h4>
          ${comparison.actionItemsFromLast.map(item => `
            <div class="action-item ${item.completed ? 'completed' : ''} ${item.isOverdue ? 'overdue' : ''}">
              <div class="action-item-task">${escapeHtml(item.task)}</div>
              <div class="action-item-meta">
                <span class="owner">${escapeHtml(item.owner)}</span>
              </div>
            </div>
          `).join('')}
        </div>
      ` : ''}
    `;
  } catch (error) {
    console.error('Failed to compare meetings:', error);
    comparisonContent.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">❌</div>
        <div class="empty-state-message">Failed to compare meetings</div>
        <div class="empty-state-hint">Please try again</div>
      </div>
    `;
  }
}

function formatComparisonResults(comparisonText) {
  // Convert markdown-style comparison to HTML
  return comparisonText
    .replace(/### NEW This Week:(.*?)(?=###|$)/gs, '<div class="comparison-item new"><strong>NEW:</strong>$1</div>')
    .replace(/### UNCHANGED:(.*?)(?=###|$)/gs, '<div class="comparison-item unchanged"><strong>UNCHANGED:</strong>$1</div>')
    .replace(/### PROGRESS:(.*?)(?=###|$)/gs, '<div class="comparison-item progress"><strong>PROGRESS:</strong>$1</div>')
    .replace(/\n/g, '<br>');
}

// ======================
// 7. ENHANCED SAVE FUNCTION
// ======================

// Hook into existing save button
const originalSaveBtn = document.getElementById('saveBtn');
if (originalSaveBtn) {
  originalSaveBtn.addEventListener('click', async () => {
    await handleEnhancedSave();
  });
}

async function handleEnhancedSave() {
  const notes = notesEditor.innerText;

  if (!notes.trim()) return;

  const isPremium = await checkPremiumStatus();

  // Extract action items if premium
  if (isPremium) {
    try {
      const actionItems = await actionItemsService.extractAndSave(notes, currentMeetingInfo || {});

      if (actionItems.length > 0) {
        showNotificationBanner({
          icon: '✅',
          message: `Found ${actionItems.length} action item${actionItems.length !== 1 ? 's' : ''}`,
          actions: [
            {
              text: 'View',
              primary: true,
              action: () => {
                showActionItems('all');
                dismissBanner();
              }
            },
            {
              text: 'Dismiss',
              action: () => dismissBanner()
            }
          ]
        });
      }
    } catch (error) {
      console.error('Action item extraction failed:', error);
    }
  }

  // Save to recurring meeting history
  if (currentMeetingHash && currentMeetingInfo) {
    try {
      await recurringMeetingService.saveMeetingNotes(
        currentMeetingHash,
        notes,
        currentMeetingInfo
      );
    } catch (error) {
      console.error('Failed to save recurring meeting:', error);
    }
  }
}

// ======================
// UTILITY FUNCTIONS
// ======================

function formatMeetingType(type) {
  const names = {
    'standup': 'Daily Standup',
    '1on1': '1-on-1 Meeting',
    'sprint-planning': 'Sprint Planning',
    'retrospective': 'Retrospective',
    'client-call': 'Client Call',
    'all-hands': 'All Hands',
    'interview': 'Interview',
    'general': 'General Meeting'
  };
  return names[type] || type;
}

function formatDate(dateString) {
  if (!dateString) return 'Unknown';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

let currentBanner = null;

function showNotificationBanner({ icon, message, actions, type = 'info' }) {
  // Remove existing banner if any
  dismissBanner();

  const banner = document.createElement('div');
  banner.className = 'notification-banner';
  banner.id = 'aiNotificationBanner';

  banner.innerHTML = `
    <div class="notification-banner-icon">${icon}</div>
    <div class="notification-banner-content">${message}</div>
    ${actions ? `
      <div class="notification-banner-actions">
        ${actions.map(action => `
          <button class="banner-btn ${action.primary ? 'banner-btn-primary' : 'banner-btn-secondary'}">
            ${action.text}
          </button>
        `).join('')}
      </div>
    ` : ''}
  `;

  // Insert at top of container
  const container = document.querySelector('.container');
  container.insertBefore(banner, container.firstChild);

  // Wire up action handlers
  if (actions) {
    const buttons = banner.querySelectorAll('.banner-btn');
    buttons.forEach((btn, index) => {
      btn.addEventListener('click', () => {
        if (actions[index].action) {
          actions[index].action();
        }
      });
    });
  }

  currentBanner = banner;
}

function dismissBanner() {
  if (currentBanner) {
    currentBanner.remove();
    currentBanner = null;
  }
}

function showNotification(message, type = 'info') {
  // Use existing notification system if available
  if (typeof window.showNotification === 'function') {
    window.showNotification(message, type);
  } else {
    console.log(`[${type.toUpperCase()}] ${message}`);
  }
}

function showPremiumPrompt(featureName) {
  // Open premium modal
  const premiumModal = document.getElementById('premiumModal');
  if (premiumModal) {
    premiumModal.style.display = 'flex';
  } else {
    showNotification(`⭐ ${featureName} is a Premium feature. Please upgrade!`, 'info');
  }
}

async function checkPremiumStatus() {
  // Check if user has premium (from storage)
  try {
    const result = await chrome.storage.local.get('premium_active');
    return result.premium_active === true;
  } catch (error) {
    return false;
  }
}

async function loadTemplate(templateName) {
  // Call existing template loading function
  if (typeof window.loadTemplate === 'function') {
    window.loadTemplate(templateName);
  }
}

async function loadNoteFromHistory(noteId) {
  // Call existing history loading function
  if (typeof window.loadNoteFromHistory === 'function') {
    window.loadNoteFromHistory(noteId);
  }
}

// ======================
// INITIALIZATION
// ======================

// Listen for messages from background script
chrome.runtime?.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'MEETING_DETECTED') {
    onMeetingDetected(message.meetingInfo);
  }

  if (message.type === 'MEETING_ENDED') {
    currentMeetingHash = null;
    currentMeetingInfo = null;
  }
});

console.log('✅ AI Features Integration Loaded');

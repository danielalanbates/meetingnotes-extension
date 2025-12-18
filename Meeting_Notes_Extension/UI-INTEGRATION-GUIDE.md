# UI Integration Guide for AI Features

This guide shows how to integrate the new AI services into the popup and sidepanel UI.

---

## Step 1: Load Service Scripts

Add to `popup.html` and `sidepanel.html` **before** `popup.js`/`sidepanel.js`:

```html
<!-- AI Services -->
<script src="ai-service.js"></script>
<script src="voice-notes.js"></script>
<script src="meeting-detection.js"></script>
<script src="recurring-meeting.js"></script>
<script src="recipient-detection.js"></script>
<script src="action-items.js"></script>
<script src="search-analytics.js"></script>
<script src="calendar-integration.js"></script>

<!-- Your UI logic -->
<script src="popup.js"></script>
```

---

## Step 2: Voice Notes Integration

### Add Microphone Button to Toolbar

In `popup.html`, add after the existing toolbar buttons:

```html
<button id="voiceBtn" class="toolbar-btn" title="Voice Notes (Ctrl+V)">
  🎤
</button>
```

### In `popup.js`, add voice notes handler:

```javascript
// Initialize voice notes
const voiceBtn = document.getElementById('voiceBtn');
let isRecording = false;

voiceBtn.addEventListener('click', async () => {
  if (!VoiceNotesService.isSupported()) {
    alert('Voice recognition not supported in your browser');
    return;
  }

  if (!isRecording) {
    // Start recording
    voiceNotesService.start();
    isRecording = true;
    voiceBtn.textContent = '⏹️'; // Stop icon
    voiceBtn.classList.add('recording');
    voiceBtn.title = 'Stop Recording';
  } else {
    // Stop recording
    voiceNotesService.stop();
    isRecording = false;
    voiceBtn.textContent = '🎤';
    voiceBtn.classList.remove('recording');
    voiceBtn.title = 'Voice Notes';
  }
});

// Handle voice transcripts
voiceNotesService.onTranscript(async (text, type) => {
  const editor = document.getElementById('notesEditor');

  if (type === 'final') {
    // Check if premium and format with AI
    const isPremium = await checkPremiumStatus();

    if (isPremium && text.length > 20) {
      try {
        const formatted = await voiceNotesService.formatWithAI(text);
        editor.value += formatted + '\n';
      } catch (error) {
        // Fallback to raw transcript
        editor.value += text + '\n';
      }
    } else {
      editor.value += text + '\n';
    }

    // Trigger auto-save
    handleAutoSave();
  } else if (type === 'interim') {
    // Show interim results in a status bar
    showStatus(`Listening: "${text}..."`);
  }
});

// Handle voice status changes
voiceNotesService.onStatusChange((status, error) => {
  if (status === 'listening') {
    showStatus('🎤 Listening...');
  } else if (status === 'stopped') {
    showStatus('Voice notes stopped');
  } else if (status === 'error') {
    showStatus(`Error: ${error}`, 'error');
    isRecording = false;
    voiceBtn.textContent = '🎤';
    voiceBtn.classList.remove('recording');
  }
});

// CSS for recording animation
const style = document.createElement('style');
style.textContent = `
  .toolbar-btn.recording {
    background: #EF4444 !important;
    animation: pulse 1.5s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }
`;
document.head.appendChild(style);
```

---

## Step 3: Smart Meeting Detection

### On Meeting Start

In `popup.js`, when a meeting is detected:

```javascript
async function onMeetingDetected(meetingInfo) {
  // Try calendar integration first
  const calendarMeeting = await calendarIntegrationService.autoDetectMeeting(
    window.location.href
  );

  if (calendarMeeting) {
    // Auto-populate from calendar
    document.getElementById('meetingTitle').value = calendarMeeting.title;
    meetingInfo = { ...meetingInfo, ...calendarMeeting };
  }

  // Detect meeting type
  const detection = meetingDetectionService.detectMeetingType({
    title: meetingInfo.title,
    attendeeCount: meetingInfo.attendeeCount || 0,
    startTime: new Date(),
    duration: 60 // Default
  });

  // Suggest template if confidence is high
  if (detection.confidence >= 70) {
    showBanner({
      icon: '💡',
      message: `This looks like a ${formatMeetingType(detection.type)}. Load ${detection.template} template?`,
      actions: [
        {
          text: 'Yes',
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
  } else if (detection.confidence >= 40) {
    // Low confidence - use AI if premium
    const isPremium = await checkPremiumStatus();

    if (isPremium) {
      try {
        const aiDetection = await meetingDetectionService.detectWithAI(meetingInfo);
        loadTemplate(aiDetection.template);
        showNotification(`AI detected: ${formatMeetingType(aiDetection.type)}`);
      } catch (error) {
        console.error('AI detection failed:', error);
      }
    }
  }

  // Check for recurring meeting
  const meetingHash = meetingDetectionService.getMeetingHash(window.location.href);
  const isRecurring = await recurringMeetingService.isRecurringMeeting(meetingHash);

  if (isRecurring) {
    const actionItemStatus = await recurringMeetingService.checkActionItemsStatus(meetingHash);

    if (actionItemStatus.hasActionItems) {
      showBanner({
        icon: '📋',
        message: `You have ${actionItemStatus.totalCount} action item(s) from last meeting (${actionItemStatus.daysSinceLastMeeting} days ago)`,
        actions: [
          {
            text: 'View',
            action: () => showActionItemsModal(actionItemStatus.items)
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

function formatMeetingType(type) {
  const names = {
    'standup': 'Daily Standup',
    '1on1': '1-on-1',
    'sprint-planning': 'Sprint Planning',
    'retrospective': 'Retrospective',
    'client-call': 'Client Call',
    'all-hands': 'All Hands',
    'general': 'General Meeting'
  };
  return names[type] || type;
}
```

---

## Step 4: Smart Recipients (Email Integration)

### Update Email Dialog

Replace the current email modal with smart recipient detection:

```javascript
async function openEmailDialog() {
  const isPremium = await checkPremiumStatus();

  if (!isPremium) {
    // Show upgrade modal
    showPremiumModal('Smart Recipient Detection');
    return;
  }

  // Get meeting info
  const meetingInfo = await getCurrentMeetingInfo(); // Your existing function

  // Try calendar first
  let calendarData = null;
  if (await calendarIntegrationService.isConnected()) {
    try {
      calendarData = await calendarIntegrationService.getCurrentMeeting();
    } catch (error) {
      console.error('Calendar fetch failed:', error);
    }
  }

  // Detect recipients
  const suggestions = await recipientDetectionService.suggestRecipients({
    url: window.location.href,
    platform: meetingInfo.platform,
    calendarData
  });

  // Build modal HTML
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content">
      <h3>📧 Email These Notes</h3>

      ${suggestions.detected.length > 0 ? `
        <div class="suggested-recipients">
          <label>Detected Attendees:</label>
          ${suggestions.detected.map(r => `
            <div class="recipient-chip" data-email="${r.email}">
              <input type="checkbox" checked />
              ${r.email}
              <span class="confidence-badge">${getConfidenceLabel(r.confidence)}</span>
            </div>
          `).join('')}
        </div>
      ` : ''}

      ${suggestions.lists.length > 0 ? `
        <div class="contact-lists">
          <label>Quick Lists:</label>
          ${suggestions.lists.map(list => `
            <button class="list-btn" data-list="${list.name}">
              ${list.name} (${list.count})
            </button>
          `).join('')}
        </div>
      ` : ''}

      <div class="manual-entry">
        <label>Add manually:</label>
        <input type="email" id="manualEmail" placeholder="email@example.com" />
        <button id="addManualBtn">Add</button>
      </div>

      <div class="selected-recipients">
        <label>Sending to:</label>
        <div id="selectedList"></div>
      </div>

      <div class="modal-actions">
        <button id="sendEmailBtn" class="primary-btn">Send Email</button>
        <button id="cancelEmailBtn" class="secondary-btn">Cancel</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Handle checkbox changes
  modal.querySelectorAll('.recipient-chip input').forEach(checkbox => {
    checkbox.addEventListener('change', updateSelectedList);
  });

  // Handle list buttons
  modal.querySelectorAll('.list-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const listName = btn.getAttribute('data-list');
      const list = suggestions.lists.find(l => l.name === listName);
      if (list) {
        // Add all emails from this list
        list.emails.forEach(email => addRecipient(email));
      }
    });
  });

  // Manual add
  document.getElementById('addManualBtn').addEventListener('click', () => {
    const email = document.getElementById('manualEmail').value.trim();
    if (recipientDetectionService.isValidEmail(email)) {
      addRecipient(email);
      document.getElementById('manualEmail').value = '';
    } else {
      alert('Invalid email address');
    }
  });

  // Send email
  document.getElementById('sendEmailBtn').addEventListener('click', async () => {
    const selectedEmails = getSelectedEmails();
    if (selectedEmails.length === 0) {
      alert('Please select at least one recipient');
      return;
    }

    // Track for frequency
    await recipientDetectionService.trackRecipients(selectedEmails);

    // Get notes
    const notes = document.getElementById('notesEditor').value;

    // Generate email (existing function)
    await sendNotesEmail(selectedEmails, notes);

    modal.remove();
  });

  // Cancel
  document.getElementById('cancelEmailBtn').addEventListener('click', () => {
    modal.remove();
  });
}

function getConfidenceLabel(confidence) {
  return recipientDetectionService.getConfidenceLabel(confidence);
}

function getSelectedEmails() {
  const checkboxes = document.querySelectorAll('.recipient-chip input:checked');
  return Array.from(checkboxes).map(cb => cb.closest('.recipient-chip').getAttribute('data-email'));
}
```

---

## Step 5: Action Items Integration

### After Saving Notes

In your save notes function:

```javascript
async function saveNotes() {
  const notes = document.getElementById('notesEditor').value;
  const meetingInfo = await getCurrentMeetingInfo();

  // Extract and save action items (if premium)
  const isPremium = await checkPremiumStatus();

  if (isPremium && notes.trim()) {
    try {
      const actionItems = await actionItemsService.extractAndSave(notes, meetingInfo);

      if (actionItems.length > 0) {
        showNotification(`Extracted ${actionItems.length} action item(s)`);

        // Show quick summary
        showBanner({
          icon: '✅',
          message: `Found ${actionItems.length} action items. View details?`,
          actions: [
            {
              text: 'View',
              action: () => showActionItemsModal(actionItems)
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
  const meetingHash = meetingDetectionService.getMeetingHash(window.location.href);
  await recurringMeetingService.saveMeetingNotes(meetingHash, notes, meetingInfo);

  // Existing save logic...
}
```

### Show Action Items Modal

```javascript
function showActionItemsModal(actionItems) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content">
      <h3>📋 Action Items</h3>

      <div class="action-items-list">
        ${actionItems.map(item => `
          <div class="action-item ${item.completed ? 'completed' : ''} ${item.isOverdue ? 'overdue' : ''}">
            <input type="checkbox" ${item.completed ? 'checked' : ''} data-id="${item.id}" />
            <div class="action-item-content">
              <div class="action-item-task">${item.task}</div>
              <div class="action-item-meta">
                <span class="owner">${item.owner}</span>
                ${item.dueDate ? `<span class="due-date">Due: ${formatDate(item.dueDate)}</span>` : ''}
                ${item.isOverdue ? '<span class="overdue-badge">OVERDUE</span>' : ''}
              </div>
            </div>
          </div>
        `).join('')}
      </div>

      <div class="modal-actions">
        <button id="closeActionItemsBtn" class="primary-btn">Close</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Handle checkbox changes
  modal.querySelectorAll('.action-item input').forEach(checkbox => {
    checkbox.addEventListener('change', async () => {
      const itemId = checkbox.getAttribute('data-id');
      if (checkbox.checked) {
        await actionItemsService.markCompleted(itemId);
        checkbox.closest('.action-item').classList.add('completed');
      }
    });
  });

  // Close modal
  document.getElementById('closeActionItemsBtn').addEventListener('click', () => {
    modal.remove();
  });
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}
```

---

## Step 6: Calendar Integration

### Add Calendar Connect Button

In settings or premium modal:

```html
<div class="calendar-section">
  <h4>📅 Calendar Integration</h4>
  <button id="connectCalendarBtn">Connect Google Calendar</button>
  <div id="calendarStatus" class="hidden">
    ✅ Connected
    <button id="disconnectCalendarBtn">Disconnect</button>
  </div>
</div>
```

### In `popup.js`:

```javascript
// Check calendar connection on load
async function initCalendar() {
  const isConnected = await calendarIntegrationService.isConnected();

  if (isConnected) {
    document.getElementById('connectCalendarBtn').classList.add('hidden');
    document.getElementById('calendarStatus').classList.remove('hidden');
  }
}

// Connect calendar
document.getElementById('connectCalendarBtn').addEventListener('click', async () => {
  try {
    showStatus('Authenticating with Google Calendar...');
    await calendarIntegrationService.authenticate();
    showNotification('Calendar connected successfully!');

    document.getElementById('connectCalendarBtn').classList.add('hidden');
    document.getElementById('calendarStatus').classList.remove('hidden');
  } catch (error) {
    showStatus('Calendar authentication failed: ' + error.message, 'error');
  }
});

// Disconnect calendar
document.getElementById('disconnectCalendarBtn').addEventListener('click', async () => {
  await calendarIntegrationService.signOut();
  showNotification('Calendar disconnected');

  document.getElementById('connectCalendarBtn').classList.remove('hidden');
  document.getElementById('calendarStatus').classList.add('hidden');
});

// Initialize on page load
initCalendar();
```

---

## Step 7: Search & Analytics

### Add Search Tab/Modal

```html
<div class="search-section">
  <input type="text" id="searchInput" placeholder="Search notes..." />
  <button id="searchBtn">🔍 Search</button>

  <div id="searchResults"></div>
</div>

<button id="analyticsBtn">📊 Analytics</button>
```

### In `popup.js`:

```javascript
document.getElementById('searchBtn').addEventListener('click', async () => {
  const query = document.getElementById('searchInput').value.trim();

  if (!query) return;

  const results = await searchAnalyticsService.searchNotes(query, {
    caseSensitive: false,
    searchIn: ['title', 'notes', 'tags'],
    limit: 20
  });

  displaySearchResults(results);
});

function displaySearchResults(results) {
  const container = document.getElementById('searchResults');

  if (results.length === 0) {
    container.innerHTML = '<p>No results found</p>';
    return;
  }

  container.innerHTML = results.map(note => `
    <div class="search-result">
      <div class="result-title">${note.title || 'Untitled'}</div>
      <div class="result-snippet">${note.notes.substring(0, 150)}...</div>
      <div class="result-meta">
        ${note.platform} • ${formatDate(note.timestamp)}
      </div>
    </div>
  `).join('');
}

// Analytics modal
document.getElementById('analyticsBtn').addEventListener('click', async () => {
  const analytics = await searchAnalyticsService.getMeetingAnalytics('week');
  const insights = await searchAnalyticsService.getProductivityInsights('week');

  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content wide">
      <h3>📊 Meeting Analytics (This Week)</h3>

      <div class="analytics-grid">
        <div class="stat-card">
          <div class="stat-value">${analytics.totalMeetings}</div>
          <div class="stat-label">Total Meetings</div>
        </div>

        <div class="stat-card">
          <div class="stat-value">${analytics.avgMeetingsPerWeek}</div>
          <div class="stat-label">Avg/Week</div>
        </div>

        <div class="stat-card">
          <div class="stat-value">${analytics.busiestDay.day}</div>
          <div class="stat-label">Busiest Day</div>
        </div>
      </div>

      <div class="insights-section">
        <h4>Insights</h4>
        ${insights.map(insight => `
          <div class="insight-card ${insight.type}">
            ${insight.message}
          </div>
        `).join('')}
      </div>

      <button id="closeAnalyticsBtn" class="primary-btn">Close</button>
    </div>
  `;

  document.body.appendChild(modal);

  document.getElementById('closeAnalyticsBtn').addEventListener('click', () => {
    modal.remove();
  });
});
```

---

## Step 8: Background Script Updates

### Add Alarm Handler for Action Item Reminders

In `background.js`, add:

```javascript
// Listen for alarms (action item reminders)
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name.startsWith('action_item_reminder_')) {
    actionItemsService.handleReminder(alarm.name);
  }
});

// Handle notification button clicks
chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  if (notificationId.startsWith('action_item_')) {
    if (buttonIndex === 0) {
      // "Mark Complete" button
      const itemId = notificationId.replace('action_item_', '');
      actionItemsService.markCompleted(itemId);
      chrome.notifications.clear(notificationId);
    } else if (buttonIndex === 1) {
      // "View Details" button
      chrome.action.openPopup();
    }
  }
});
```

---

## Complete Example: Enhanced Popup.js

See the full integration in `popup-enhanced-EXAMPLE.js` (to be created).

---

## CSS Additions

Add to `styles.css`:

```css
/* Voice Recording */
.toolbar-btn.recording {
  background: #EF4444 !important;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

/* Recipient Chips */
.recipient-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: #F3F4F6;
  border-radius: 16px;
  margin: 4px;
}

.confidence-badge {
  font-size: 10px;
  padding: 2px 6px;
  background: #3B82F6;
  color: white;
  border-radius: 8px;
}

/* Action Items */
.action-item {
  padding: 12px;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  margin: 8px 0;
  display: flex;
  align-items: start;
  gap: 12px;
}

.action-item.completed {
  opacity: 0.6;
  text-decoration: line-through;
}

.action-item.overdue {
  border-color: #EF4444;
  background: #FEF2F2;
}

.overdue-badge {
  background: #EF4444;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: bold;
}

/* Analytics */
.analytics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin: 20px 0;
}

.stat-card {
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px;
  text-align: center;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
}

.stat-label {
  font-size: 14px;
  opacity: 0.9;
  margin-top: 4px;
}

/* Insights */
.insight-card {
  padding: 12px;
  border-radius: 8px;
  margin: 8px 0;
  border-left: 4px solid;
}

.insight-card.warning {
  background: #FEF3C7;
  border-color: #F59E0B;
}

.insight-card.error {
  background: #FEE2E2;
  border-color: #EF4444;
}

.insight-card.success {
  background: #D1FAE5;
  border-color: #10B981;
}

.insight-card.info {
  background: #DBEAFE;
  border-color: #3B82F6;
}
```

---

## Testing Integration

1. **Load extension** in Chrome (`chrome://extensions/`)
2. **Join a meeting** on Zoom/Google Meet
3. **Test voice notes** - click microphone button
4. **Test smart detection** - verify template suggestion
5. **Test action items** - save notes and check extraction
6. **Test calendar** - connect and verify auto-populate
7. **Test recipients** - click email and check suggestions
8. **Test analytics** - view dashboard

---

## Troubleshooting

### Services not loading
- Check script load order in HTML
- Open DevTools console for errors
- Verify all service files exist

### Voice not working
- Check browser support: `VoiceNotesService.isSupported()`
- Ensure HTTPS (required for Web Speech API)
- Check microphone permissions

### Calendar not connecting
- Verify OAuth client ID is set
- Check `chrome.identity` permission in manifest
- Ensure using Chrome/Edge (not Firefox)

### AI features failing
- Verify API key is saved: `chrome.storage.local.get('openai_api_key')`
- Check network tab for API errors
- Verify premium status check logic

---

## Next Steps

1. Implement the UI integration following this guide
2. Test each feature individually
3. Test complete workflows end-to-end
4. Add error handling and user feedback
5. Polish UI/UX with loading states
6. Prepare for production release

---

**Ready to integrate!** 🚀

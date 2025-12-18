# Quick Start Guide - New AI Features

**Version**: 2.0.0
**Status**: Features implemented, pending UI integration

---

## 🎯 What's New

Your Meeting Notes extension now has **15 AI-powered features** ready to use! This guide shows you how to test them.

---

## 🚀 Quick Setup

### 1. Reload the Extension

```bash
1. Open chrome://extensions/
2. Find "MeetingNotes"
3. Click the reload icon 🔄
```

### 2. Verify New Files

The extension folder should now have these new files:
- ✅ ai-service.js
- ✅ voice-notes.js
- ✅ meeting-detection.js
- ✅ recurring-meeting.js
- ✅ recipient-detection.js
- ✅ action-items.js
- ✅ search-analytics.js
- ✅ calendar-integration.js

---

## 🧪 Test Each Feature (Browser Console)

Since the UI integration is pending, you can test features directly in the browser console.

### Test 1: Voice Notes

```javascript
// Open a meeting page (any platform)
// Open DevTools (F12) → Console tab
// Type:

// Check if voice is supported
VoiceNotesService.isSupported()
// Should return: true

// Start listening
voiceNotesService.start()

// Speak into microphone: "action item for john deploy by friday"

// Get transcript
voiceNotesService.getTranscript()
// Should show your speech

// Stop listening
voiceNotesService.stop()
```

---

### Test 2: Meeting Detection

```javascript
// In console:
const detection = meetingDetectionService.detectMeetingType({
  title: "Daily Standup",
  attendeeCount: 8,
  startTime: new Date(),
  duration: 15
});

console.log(detection);
// Should show: { type: 'standup', template: 'standup', confidence: 85 }
```

---

### Test 3: AI Summarize (Requires API Key)

```javascript
// Set API key first
await aiService.saveApiKey('your-openai-api-key-here');

// Test summarize
const summary = await aiService.summarizeNotes(`
We discussed Q4 budget planning. Sarah presented the revised numbers.
John raised concerns about engineering costs. We decided to reallocate
$50k from marketing to engineering. Action items: Sarah to finalize
budget by Friday, John to review engineering needs.
`);

console.log(summary);
// Should return 3-5 bullet points
```

---

### Test 4: AI Extract Action Items

```javascript
const actionItems = await aiService.extractActionItems(`
Meeting notes from sprint planning:
- Sarah: Review PR by tomorrow
- John: Deploy feature by Friday
- Mike: Update documentation
`);

console.log(actionItems);
// Should return formatted checklist:
// ☐ Sarah: Review PR by tomorrow
// ☐ John: Deploy feature by Friday
// ☐ Mike: Update documentation
```

---

### Test 5: Calendar Integration

```javascript
// Initialize
await calendarIntegrationService.initialize();

// Authenticate (opens OAuth flow)
await calendarIntegrationService.authenticate();

// Get current meeting
const meeting = await calendarIntegrationService.getCurrentMeeting();
console.log(meeting);
// Should show meeting title, attendees, description
```

---

### Test 6: Smart Recipients

```javascript
// Detect recipients from current meeting
const recipients = await recipientDetectionService.detectRecipients({
  url: window.location.href,
  platform: 'google-meet' // or 'zoom', 'teams', 'webex'
});

console.log(recipients);
// Should show array of detected emails with confidence scores
```

---

### Test 7: Action Item Tracking

```javascript
// Extract and save action items
const items = await actionItemsService.extractAndSave(`
Action items from today's meeting:
- John: Deploy by Friday
- Sarah: Review PR by tomorrow
`, {
  title: "Sprint Planning",
  timestamp: new Date().toISOString(),
  platform: 'zoom'
});

console.log(items);
// Should show extracted items with IDs, owners, due dates

// Get pending items
const pending = await actionItemsService.getPendingActionItems();
console.log(pending);
```

---

### Test 8: Recurring Meetings

```javascript
// Save meeting notes
const meetingHash = 'test_meeting_123';

await recurringMeetingService.saveMeetingNotes(
  meetingHash,
  'Meeting notes from this week...',
  {
    title: "Weekly Standup",
    timestamp: new Date().toISOString(),
    platform: 'zoom'
  }
);

// Check if recurring
const isRecurring = await recurringMeetingService.isRecurringMeeting(meetingHash);
console.log(isRecurring); // Should be true after first save

// Compare with previous (save again to test)
setTimeout(async () => {
  const comparison = await recurringMeetingService.compareWithPrevious(
    meetingHash,
    'Meeting notes from this week with new updates...'
  );
  console.log(comparison);
  // Should show NEW/UNCHANGED/PROGRESS summary
}, 2000);
```

---

### Test 9: Search & Analytics

```javascript
// Note: You need some saved notes first for this to work

// Search notes
const results = await searchAnalyticsService.searchNotes('budget', {
  caseSensitive: false,
  limit: 10
});
console.log(results);

// Get analytics
const analytics = await searchAnalyticsService.getMeetingAnalytics('week');
console.log(analytics);
// Should show: totalMeetings, avgMeetingsPerWeek, platforms, topTags, etc.

// Get productivity insights
const insights = await searchAnalyticsService.getProductivityInsights('week');
console.log(insights);
// Should show warnings/recommendations
```

---

### Test 10: Attendee Extraction (Content Script)

```javascript
// This tests the content script enhancement
// Must be run on a meeting page (Zoom, Google Meet, etc.)

// Send message to content script
chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
  const response = await chrome.tabs.sendMessage(tabs[0].id, {
    type: 'EXTRACT_ATTENDEES',
    platform: 'google-meet' // Change based on platform
  });

  console.log(response);
  // Should show: { attendees: ['email1@domain.com', ...], count: 3 }
});
```

---

## 🎨 Visual Testing (After UI Integration)

Once you integrate the UI following `UI-INTEGRATION-GUIDE.md`, test these flows:

### 1. Voice Notes Flow
```
1. Join a meeting
2. Open extension popup
3. Click microphone button 🎤
4. Speak: "action item for john deploy by friday"
5. Verify it appears in notes as "☐ John: Deploy by Friday"
6. Click microphone again to stop
```

### 2. Smart Meeting Detection Flow
```
1. Join meeting with title "Daily Standup"
2. Open extension
3. Verify banner suggests "standup" template
4. Click "Yes" to load template
5. Verify template loaded in editor
```

### 3. Calendar Integration Flow
```
1. Open extension settings
2. Click "Connect Google Calendar"
3. Complete OAuth flow
4. Join scheduled meeting
5. Open extension
6. Verify title and attendees auto-populated
```

### 4. Smart Recipients Flow
```
1. Take meeting notes
2. Click "Email Notes" button
3. Verify modal shows detected attendees
4. Verify confidence badges (in meeting, detected, frequent)
5. Select recipients and send
```

### 5. Action Items Flow
```
1. Take notes with tasks (e.g., "john: deploy by friday")
2. Click "Save Notes"
3. Verify notification: "Extracted 1 action item(s)"
4. Click "View" to see action items
5. Verify reminder scheduled (check chrome.alarms)
```

---

## 🐛 Troubleshooting

### Voice Notes Not Working
```javascript
// Check if supported
VoiceNotesService.isSupported()

// If false, try different browser or enable HTTPS
// Voice API requires secure context
```

### AI Features Failing
```javascript
// Check API key
chrome.storage.local.get('openai_api_key', (result) => {
  console.log('API Key:', result.openai_api_key ? 'Set' : 'Not set');
});

// Set API key
await aiService.saveApiKey('sk-...');
```

### Calendar Not Connecting
```javascript
// Check if Chrome Identity API is available
console.log('Identity API:', chrome.identity ? 'Available' : 'Not available');

// Check stored token
chrome.storage.local.get('calendar_access_token', (result) => {
  console.log('Token:', result.calendar_access_token ? 'Set' : 'Not set');
});

// Re-authenticate
await calendarIntegrationService.authenticate();
```

### Attendee Extraction Not Working
```javascript
// Check if content script is loaded
chrome.tabs.query({ active: true }, (tabs) => {
  chrome.tabs.sendMessage(tabs[0].id, { action: 'ping' }, (response) => {
    console.log('Content script:', response ? 'Loaded' : 'Not loaded');
  });
});

// Reload page to inject content script
location.reload();
```

---

## 📊 Performance Monitoring

Check performance in console:

```javascript
// Monitor API calls
console.time('AI Summarize');
await aiService.summarizeNotes('test notes...');
console.timeEnd('AI Summarize');
// Should be ~1-2 seconds

// Monitor storage usage
chrome.storage.local.getBytesInUse(null, (bytes) => {
  console.log('Storage used:', (bytes / 1024).toFixed(2), 'KB');
  console.log('Limit: 10 MB (10240 KB)');
});

// Monitor action item alarms
chrome.alarms.getAll((alarms) => {
  console.log('Scheduled alarms:', alarms.length);
  alarms.forEach(alarm => {
    console.log('-', alarm.name, 'at', new Date(alarm.scheduledTime));
  });
});
```

---

## 💰 Cost Monitoring

Track OpenAI API usage:

```javascript
// Estimate cost for a meeting
const noteLength = 500; // characters
const estimatedTokens = noteLength / 3.5; // rough estimate
const costPer1kTokens = 0.00015; // gpt-4o-mini
const estimatedCost = (estimatedTokens / 1000) * costPer1kTokens;

console.log('Estimated cost:', `$${estimatedCost.toFixed(4)}`);
// Typical meeting: ~$0.002
```

---

## 🎯 Feature Checklist

Use this to verify all features work:

### Core AI Features (10)
- [ ] AI Summarize Notes
- [ ] AI Extract Action Items
- [ ] AI Format Notes
- [ ] AI Generate Follow-up Email
- [ ] AI Format Voice Transcript
- [ ] AI Detect Meeting Type
- [ ] AI Extract Tags
- [ ] AI Compare Recurring Meetings
- [ ] AI Translate Notes
- [ ] AI Generate Insights

### Service Features (5)
- [ ] Voice-to-Text (Web Speech API)
- [ ] Meeting Pattern Detection
- [ ] Recipient Detection
- [ ] Action Item Tracking & Reminders
- [ ] Calendar Integration (OAuth)

### Utility Features (3)
- [ ] Search Notes
- [ ] Meeting Analytics
- [ ] Attendee Email Extraction

---

## 🚀 Next Actions

1. **Test core features** using console commands above
2. **Integrate UI** following `UI-INTEGRATION-GUIDE.md`
3. **Visual testing** using the flows above
4. **Performance testing** with real meetings
5. **User testing** with beta users

---

## 📞 Need Help?

- **Documentation**: See `AI-FEATURES-COMPLETE.md`
- **Integration**: See `UI-INTEGRATION-GUIDE.md`
- **Implementation**: See `IMPLEMENTATION-SUMMARY.md`

---

**Happy Testing!** 🎉

All features are built and ready. Just need UI integration to make them user-accessible!

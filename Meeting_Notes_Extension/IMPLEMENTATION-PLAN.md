# Implementation Plan - Priority AI Features

## What We're Building

Based on your priorities:

1. ✅ **Voice-to-text notes** - Dictate instead of type
2. ✅ **Smart recipient detection** - Auto-detect attendees
3. ✅ **Calendar integration** - Auto-populate meeting details (PRIORITY)
4. ✅ **Smart meeting detection** - Auto-detect meeting type
5. ⚠️ **Action item tracking** - Simpler version for now

---

## Week 1: Calendar Integration (You Want This Right Away)

### What It Does

**Before:**
```
User opens extension
  ↓
Has to manually type:
• Meeting title
• Attendees
• Meeting purpose
```

**After:**
```
User joins Google Meet
  ↓
Extension auto-fetches from Calendar:
  ↓
Title: "Q1 Planning - Product Team"
Attendees: john@company.com, sarah@company.com, mike@company.com
Agenda: "Discuss budget, timeline, resources"
  ↓
Everything pre-filled! ✨
```

### Implementation Steps

**Day 1-2: OAuth Setup**
```javascript
// Add to manifest.json
{
  "permissions": [
    "identity",
    "https://www.googleapis.com/auth/calendar.readonly"
  ],
  "oauth2": {
    "client_id": "YOUR_CLIENT_ID.apps.googleusercontent.com",
    "scopes": [
      "https://www.googleapis.com/auth/calendar.readonly"
    ]
  }
}
```

**Day 3-4: Calendar API Integration**
```javascript
// Fetch current meeting from calendar
async function fetchCurrentMeeting() {
  const token = await chrome.identity.getAuthToken({ interactive: true });

  const now = new Date();
  const timeMin = new Date(now.getTime() - 5 * 60000).toISOString(); // 5 min ago
  const timeMax = new Date(now.getTime() + 5 * 60000).toISOString(); // 5 min future

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
    `timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true`,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );

  const data = await response.json();
  const meeting = data.items[0]; // Current meeting

  return {
    title: meeting.summary,
    attendees: meeting.attendees?.map(a => a.email) || [],
    description: meeting.description || '',
    startTime: meeting.start.dateTime,
    endTime: meeting.end.dateTime
  };
}
```

**Day 5: Auto-populate UI**
```javascript
// When side panel opens during meeting
async function onMeetingStart() {
  const meeting = await fetchCurrentMeeting();

  // Auto-fill meeting details
  document.getElementById('meetingTitle').value = meeting.title;

  // Auto-fill attendees for smart recipient detection
  chrome.storage.local.set({
    currentMeetingAttendees: meeting.attendees
  });

  // Show notification
  showNotification(`📅 Loaded: ${meeting.title}`);
}
```

### User Experience

**Premium users see:**
```
┌─────────────────────────────────┐
│ BatesAI Meeting Notes           │
├─────────────────────────────────┤
│ 📅 Q1 Planning - Product Team   │ ← Auto-filled!
│                                  │
│ 👥 Attendees (3):                │ ← Auto-detected!
│ • john@company.com               │
│ • sarah@company.com              │
│ • mike@company.com               │
│                                  │
│ Notes:                           │
│ [Start typing...]                │
└─────────────────────────────────┘
```

**Free users see:**
```
┌─────────────────────────────────┐
│ BatesAI Meeting Notes           │
├─────────────────────────────────┤
│ 💎 Upgrade to Premium            │
│ to auto-load meeting details     │
│                                  │
│ Meeting Title:                   │
│ [Type here...]                   │
│                                  │
│ Notes:                           │
│ [Start typing...]                │
└─────────────────────────────────┘
```

---

## Week 2: Smart Meeting Detection

### What It Does

**Detects meeting type and suggests template:**

```javascript
async function detectMeetingType(title, attendees, time) {
  // Check patterns
  if (title.toLowerCase().includes('standup') || title.toLowerCase().includes('daily')) {
    return 'standup';
  }

  if (attendees.length === 2 && title.toLowerCase().includes('1:1')) {
    return '1on1';
  }

  if (title.toLowerCase().includes('sprint') || title.toLowerCase().includes('planning')) {
    return 'sprint-planning';
  }

  if (title.toLowerCase().includes('retro')) {
    return 'retrospective';
  }

  // Time-based detection
  const hour = new Date(time).getHours();
  if (hour >= 9 && hour <= 10 && attendees.length < 10) {
    return 'standup'; // Morning meeting with small team
  }

  return 'general';
}
```

### User Experience

```
Join meeting "Daily Standup"
  ↓
Extension detects: "This looks like a standup"
  ↓
Auto-loads standup template:
  ↓
"Yesterday:
[What did you do yesterday?]

Today:
[What will you do today?]

Blockers:
[Any blockers?]"
  ↓
User just fills in answers ✨
```

### Implementation

**Day 1-2: Detection Logic**
```javascript
const MEETING_PATTERNS = {
  standup: {
    keywords: ['standup', 'daily', 'scrum'],
    attendeeRange: [2, 15],
    durationRange: [15, 30], // minutes
    timeOfDay: [8, 11], // 8am-11am
    template: 'standup'
  },
  '1on1': {
    keywords: ['1:1', '1-1', 'one on one', 'check-in'],
    attendeeRange: [2, 2], // exactly 2 people
    durationRange: [20, 60],
    template: '1on1'
  },
  'client-call': {
    externalDomain: true, // attendees from different domain
    keywords: ['client', 'demo', 'pitch'],
    template: 'client'
  },
  'sprint-planning': {
    keywords: ['sprint', 'planning', 'iteration'],
    durationRange: [60, 240],
    template: 'sprint-planning'
  }
};
```

**Day 3-4: Template Suggestions**
```javascript
async function suggestTemplate(meetingInfo) {
  const type = await detectMeetingType(
    meetingInfo.title,
    meetingInfo.attendees,
    meetingInfo.startTime
  );

  // Show suggestion
  showBanner({
    icon: '💡',
    message: `This looks like a ${type.replace('-', ' ')}. Use ${type} template?`,
    actions: [
      { text: 'Yes', action: () => loadTemplate(type) },
      { text: 'No', action: () => dismissBanner() }
    ]
  });
}
```

**Day 5: Smart Defaults**
```javascript
// Auto-load template without asking (if confidence is high)
if (confidence > 0.8) {
  loadTemplate(type);
  showNotification(`Loaded ${type} template`);
} else {
  // Ask user
  suggestTemplate(meetingInfo);
}
```

---

## Week 3: Voice-to-Text Notes

### What It Does

**User clicks microphone, speaks, AI transcribes and formats.**

### Implementation

**Day 1-2: Web Speech API**
```javascript
// Add microphone button to toolbar
<button id="voiceBtn" class="toolbar-btn" title="Voice Notes">
  🎤
</button>

// Voice recognition
const recognition = new webkitSpeechRecognition();
recognition.continuous = true;
recognition.interimResults = true;
recognition.lang = 'en-US';

let isListening = false;

document.getElementById('voiceBtn').addEventListener('click', () => {
  if (!isListening) {
    recognition.start();
    isListening = true;
    document.getElementById('voiceBtn').classList.add('recording');
    showNotification('🎤 Listening...');
  } else {
    recognition.stop();
    isListening = false;
    document.getElementById('voiceBtn').classList.remove('recording');
  }
});

recognition.onresult = (event) => {
  const transcript = Array.from(event.results)
    .map(result => result[0].transcript)
    .join('');

  // Insert into editor
  const editor = document.getElementById('notesEditor');
  editor.value += transcript + '\n';

  // Auto-format if premium
  if (isPremium) {
    formatVoiceNote(transcript);
  }
};
```

**Day 3-4: AI Formatting**
```javascript
async function formatVoiceNote(transcript) {
  // Detect intent
  if (transcript.toLowerCase().includes('action item')) {
    // Format as action item
    const formatted = await ai.formatActionItem(transcript);
    // "action item for john deploy by friday"
    // → "☐ John: Deploy by Friday"
    insertFormattedNote(formatted);
  } else if (transcript.toLowerCase().includes('note') || transcript.toLowerCase().includes('remember')) {
    // Format as note
    const formatted = await ai.formatNote(transcript);
    insertFormattedNote(formatted);
  } else {
    // Just capitalize and punctuate
    const formatted = await ai.cleanupTranscript(transcript);
    insertFormattedNote(formatted);
  }
}
```

**Day 5: Polish UI**
```css
.toolbar-btn.recording {
  background: #EF4444 !important;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

### User Experience

```
User clicks 🎤 button
  ↓
Button turns red, pulsing
  ↓
User speaks: "Action item for John, deploy the new feature by Friday"
  ↓
AI transcribes and formats:
  ↓
"☐ John: Deploy the new feature by Friday"
  ↓
Automatically inserted into notes ✨
```

---

## Week 4: Smart Recipient Detection

### What It Does

**Auto-detect who should receive the notes.**

### Implementation

**Day 1-2: Parse Meeting URLs**
```javascript
// Google Meet
function parseGoogleMeetAttendees(url, calendarData) {
  // Primary source: Calendar API
  if (calendarData?.attendees) {
    return calendarData.attendees;
  }

  // Fallback: Try to extract from DOM
  const participants = document.querySelectorAll('[data-participant-id]');
  return Array.from(participants).map(p => {
    return p.getAttribute('data-participant-email');
  }).filter(Boolean);
}

// Zoom
function parseZoomAttendees(url) {
  // Zoom sometimes includes attendees in URL
  const params = new URLSearchParams(url.split('?')[1]);
  const attendees = params.get('attendees');
  if (attendees) {
    return attendees.split(',');
  }
  return [];
}

// Teams
function parseTeamsAttendees(url, calendarData) {
  // Teams: Use calendar data
  return calendarData?.attendees || [];
}
```

**Day 3-4: Smart Suggestions**
```javascript
async function suggestRecipients() {
  // Get attendees from multiple sources
  const calendarAttendees = await getCalendarAttendees();
  const urlAttendees = parseUrlAttendees(window.location.href);
  const historyAttendees = await getFrequentRecipients();

  // Combine and dedupe
  const allAttendees = [
    ...calendarAttendees,
    ...urlAttendees,
    ...historyAttendees
  ];
  const unique = [...new Set(allAttendees)];

  // Smart ranking
  const ranked = unique.map(email => {
    let score = 0;
    if (calendarAttendees.includes(email)) score += 10;
    if (urlAttendees.includes(email)) score += 5;
    if (historyAttendees.includes(email)) score += 3;
    return { email, score };
  }).sort((a, b) => b.score - a.score);

  return ranked.slice(0, 10); // Top 10
}
```

**Day 5: UI for Selection**
```javascript
// Show smart suggestions
async function showEmailDialog() {
  const suggestions = await suggestRecipients();

  const dialog = `
    <div class="email-dialog">
      <h3>Email these notes</h3>

      <div class="suggested-recipients">
        <label>Suggested:</label>
        ${suggestions.map(s => `
          <div class="recipient-chip" data-email="${s.email}">
            ${s.email}
            <span class="confidence">${getConfidenceLabel(s.score)}</span>
          </div>
        `).join('')}
      </div>

      <div class="contact-lists">
        <label>Quick Lists:</label>
        <button class="list-btn" data-list="just-me">Just Me</button>
        <button class="list-btn" data-list="work-team">Work Team (3)</button>
      </div>

      <div class="manual-entry">
        <label>Or add manually:</label>
        <input type="email" placeholder="email@example.com">
      </div>

      <div class="selected-recipients">
        <label>Sending to:</label>
        <div id="selectedList"></div>
      </div>

      <button class="send-btn">Send Email</button>
    </div>
  `;

  showModal(dialog);
}

function getConfidenceLabel(score) {
  if (score >= 10) return 'in meeting';
  if (score >= 5) return 'detected';
  if (score >= 3) return 'frequent';
  return '';
}
```

### User Experience

```
User clicks "Email Notes"
  ↓
Modal shows:
  ↓
"Suggested Recipients:
✓ john@company.com (in meeting)
✓ sarah@company.com (in meeting)
  mike@company.com (frequent)

Quick Lists:
○ Just Me
○ Work Team (3)

Sending to: john@company.com, sarah@company.com"
  ↓
User clicks "Send Email"
  ↓
mailto: opens with everything filled in ✨
```

---

## Action Item Tracking (Simple Version)

### What It Does

**Track action items and show reminders in next meeting.**

### Implementation (Simple - No Email Reminders)

```javascript
// After meeting ends
async function saveActionItems(notes) {
  const actionItems = await ai.extractActionItems(notes);

  // Store with meeting info
  const meetingHash = hashUrl(window.location.href);
  await chrome.storage.local.set({
    [`actionItems_${meetingHash}`]: {
      items: actionItems,
      date: new Date().toISOString(),
      meetingTitle: currentMeeting.title
    }
  });
}

// When meeting starts
async function checkPendingActionItems() {
  const meetingHash = hashUrl(window.location.href);
  const stored = await chrome.storage.local.get(`actionItems_${meetingHash}`);

  if (stored && stored.items.length > 0) {
    showBanner({
      icon: '⚠️',
      message: `You have ${stored.items.length} pending action items from last meeting`,
      actions: [
        { text: 'Show', action: () => showActionItemsDialog(stored.items) },
        { text: 'Dismiss', action: () => dismissBanner() }
      ]
    });
  }
}
```

**Later:** Add calendar event creation for reminders (when we have Calendar API already integrated)

---

## Timeline

**Week 1: Calendar Integration**
- Mon-Tue: OAuth setup
- Wed-Thu: Calendar API integration
- Fri: Auto-populate UI

**Week 2: Smart Meeting Detection**
- Mon-Tue: Detection logic
- Wed-Thu: Template suggestions
- Fri: Smart defaults

**Week 3: Voice-to-Text**
- Mon-Tue: Web Speech API
- Wed-Thu: AI formatting
- Fri: Polish UI

**Week 4: Smart Recipients**
- Mon-Tue: Parse attendees
- Wed-Thu: Smart suggestions
- Fri: Selection UI

**Week 5: Polish & Ship**
- Mon-Wed: Bug fixes, testing
- Thu-Fri: Update Chrome Web Store listing

---

## Premium Feature Set After This

**Free:**
- Take notes
- Auto-email to yourself
- Basic templates
- Export

**Premium ($2.99/month):**
- ✅ **📅 Calendar integration** - Auto-populate meeting details
- ✅ **🎯 Smart meeting detection** - Auto-load right template
- ✅ **🎤 Voice-to-text** - Dictate your notes
- ✅ **📧 Smart recipients** - One-click sharing
- ✅ **📋 Contact lists** - Save your teams
- ✅ **✨ AI features** - Summarize, action items, format, email
- ✅ **📌 Action tracking** - Never forget tasks

**Value: Saves 3+ hours per week**
**Price: $2.99/month**
**ROI: Insane**

---

## Next Steps

1. **This Week:** Implement calendar integration (you want this ASAP)
2. **Next Week:** Smart meeting detection
3. **Week 3:** Voice-to-text
4. **Week 4:** Smart recipients
5. **Week 5:** Polish and ship

**Want me to start with calendar integration?** I can have the OAuth setup ready today.

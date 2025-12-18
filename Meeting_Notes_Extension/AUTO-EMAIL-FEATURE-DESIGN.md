# Auto-Email Notes Feature - Design Document

## The Big Idea

**Instead of storing notes on your servers, automatically email them to the user when the meeting ends.**

This is **genius** because:
✅ No server storage needed (stateless extension)
✅ Notes automatically backed up in user's email
✅ Easily searchable (in Gmail/Outlook)
✅ Easy to share (just forward)
✅ Zero hosting costs for you
✅ AI can enhance the email

---

## Core Feature: Auto-Email on Meeting End

### User Flow

```
1. User takes notes during meeting
2. Meeting ends (or user clicks "Done")
3. Extension detects meeting end
4. AI formats notes into professional email
5. Opens email draft in default email client
6. User reviews, adds recipients, sends
```

### Why This Works

**No Backend Required:**
- Uses `mailto:` protocol
- Opens user's default email client
- Works with Gmail, Outlook, Apple Mail, etc.
- Zero server costs

**User Benefits:**
- Notes backed up forever
- Searchable in email
- Can forward to team
- No need to remember to save

**Your Benefits:**
- No database to manage
- No storage costs
- No GDPR/privacy concerns
- Scales infinitely

---

## Premium Feature: Contact Lists + AI Email

### Feature Set

**1. Contact List Management**
- Create lists: "Work Team", "Clients", "Just Me", "Friends"
- Add contacts to lists
- Quick-select recipients when emailing notes

**2. AI-Enhanced Email Composition**
- AI summarizes notes
- AI extracts action items
- AI writes professional email body
- AI suggests subject line

**3. Email Templates**
- "Meeting Recap" template
- "Action Items Follow-up" template
- "Client Update" template
- Custom templates

**4. Auto-Send Options**
- Send to "Just Me" automatically (backup)
- Send to specific list on meeting end
- Smart recipient detection (from meeting URL)

---

## Technical Implementation

### Option 1: mailto: Links (RECOMMENDED for MVP)

**Pros:**
✅ No backend needed
✅ Works immediately
✅ No OAuth complexity
✅ Works with any email client
✅ Zero costs

**Cons:**
❌ Opens email client (not in-browser)
❌ Can't auto-send (requires user click)
❌ Limited formatting
❌ Subject/body length limits

**Implementation:**
```javascript
function emailNotes(recipients, subject, body) {
  const mailto = `mailto:${recipients}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = mailto;
}
```

**Perfect for:**
- MVP launch
- Free tier
- Most users

---

### Option 2: Gmail API (Better UX, More Complex)

**Pros:**
✅ Send directly from browser
✅ No email client needed
✅ Full formatting (HTML emails)
✅ Can auto-send
✅ Professional

**Cons:**
❌ Requires OAuth flow
❌ Only works with Gmail users
❌ Complex implementation
❌ Need to handle tokens

**Implementation:**
```javascript
// OAuth flow
chrome.identity.getAuthToken({ interactive: true }, (token) => {
  // Use Gmail API to send email
  gapi.client.gmail.users.messages.send({
    userId: 'me',
    resource: {
      raw: base64EncodedEmail
    }
  });
});
```

**Perfect for:**
- Premium tier
- Power users
- V2 feature

---

### Option 3: Email Service + Backend (Most Professional)

**Services:**
- SendGrid (99% deliverability)
- Mailgun (developer-friendly)
- AWS SES (cheapest)

**Pros:**
✅ Works with any email provider
✅ Can auto-send
✅ Professional formatting
✅ Tracking (open rates, clicks)
✅ Custom domain (from@batesai.com)

**Cons:**
❌ Requires backend server
❌ Monthly costs ($10-50/month)
❌ More complex
❌ Need to manage API keys

**Costs:**
- SendGrid: Free for 100 emails/day, then $15/month
- Mailgun: Free for 1,000 emails/month, then $35/month
- AWS SES: $0.10 per 1,000 emails

**Perfect for:**
- If you scale to 1,000+ users
- Corporate/team tier
- V3 feature

---

## Recommended Architecture

### Phase 1: MVP (Launch)

**Free Tier:**
- Manual "Email Notes" button
- Opens mailto: link
- Basic email body (plain text notes)

**Premium Tier ($1/month):**
- Contact list management (up to 3 lists, 20 contacts each)
- AI-enhanced email composition
- Email templates (3 templates)
- Auto-open email draft on meeting end

**Implementation:**
- Use mailto: links (no backend)
- Store contacts in chrome.storage.local
- AI formats notes into email body
- Simple, works immediately

**Cost to you:** $0

---

### Phase 2: Growth (1,000+ users)

**Free Tier:**
- Same as Phase 1

**Premium Tier ($2.99/month):**
- Everything from Phase 1
- Gmail API integration (optional)
- Unlimited contact lists
- Advanced AI email features
- Email tracking (if sent via Gmail API)

**Implementation:**
- Add Gmail API option
- Keep mailto: as fallback
- OAuth flow for Gmail users

**Cost to you:** $0 (still no backend)

---

### Phase 3: Scale (10,000+ users)

**Free Tier:**
- Same as Phase 1

**Premium Tier ($4.99/month):**
- Everything from Phase 2
- Send from custom domain (notes@batesai.com)
- Email open/click tracking
- Scheduled send
- CRM integration

**Team Tier ($19.99/month for 5 users):**
- Shared contact lists
- Team templates
- Analytics dashboard
- Priority support

**Implementation:**
- Add SendGrid/Mailgun backend
- Custom domain emails
- Advanced tracking

**Cost to you:** ~$35/month (Mailgun) for 10,000 users

---

## Feature Breakdown

### Contact List Management

**Storage Structure:**
```javascript
{
  contactLists: {
    'work-team': {
      id: 'work-team',
      name: 'Work Team',
      contacts: [
        { name: 'John Doe', email: 'john@company.com' },
        { name: 'Jane Smith', email: 'jane@company.com' }
      ],
      color: '#4A90E2'
    },
    'just-me': {
      id: 'just-me',
      name: 'Just Me',
      contacts: [
        { name: 'Daniel', email: 'daniel@email.com' }
      ],
      color: '#10B981'
    }
  }
}
```

**UI Mockup:**
```
┌─────────────────────────────────┐
│ Email Meeting Notes             │
├─────────────────────────────────┤
│ To: [Select contacts...]     ▼  │
│                                  │
│ Quick Lists:                     │
│ ○ Just Me                        │
│ ○ Work Team (3 people)           │
│ ○ Clients (5 people)             │
│                                  │
│ [+ Create New List]              │
│                                  │
│ Subject:                         │
│ Meeting Notes - Jan 18, 2025    │
│                                  │
│ [✨ AI Enhance Email]            │
│                                  │
│ [Send Email]                     │
└─────────────────────────────────┘
```

---

### AI Email Enhancement

**What AI Does:**

**1. Generates Subject Line**
```
Input: Meeting notes from standup
AI: "Daily Standup Notes - Jan 18, 2025 - Key Updates & Action Items"
```

**2. Formats Email Body**
```
Input: Raw notes
AI:
"Hi team,

Here are the key takeaways from today's meeting:

SUMMARY
• Completed user authentication feature
• Discussed Q1 roadmap priorities
• Reviewed bug reports from customers

ACTION ITEMS
☐ John: Deploy auth feature by Friday
☐ Sarah: Update roadmap document
☐ Mike: Triage customer bugs

NEXT MEETING
Tuesday, Jan 23 at 2pm

Best,
[Your name]"
```

**3. Suggests Recipients**
```
Input: Meeting URL contains "zoom.us/j/12345?attendees=john@company.com,jane@company.com"
AI: Suggests adding John and Jane to recipients
```

---

## User Experience Flows

### Flow 1: First Time User (Free Tier)

```
1. User finishes meeting, clicks "Email Notes"
2. Extension opens mailto: link
3. Default email client opens with:
   - To: [empty - user fills in]
   - Subject: "Meeting Notes - Jan 18, 2025"
   - Body: [Raw notes from editor]
4. User adds recipients, clicks send
5. Notes emailed ✓
```

**Friction points:**
- Have to manually add recipients each time
- No AI formatting
- Raw notes (not polished)

---

### Flow 2: Premium User (Contact Lists)

```
1. User finishes meeting, clicks "Email Notes"
2. Modal appears: "Email these notes"
3. Quick select: ○ Just Me  ○ Work Team
4. User selects "Work Team"
5. Preview shows: "To: john@company.com, jane@company.com"
6. User clicks "✨ AI Enhance"
7. AI formats notes into professional email
8. User clicks "Send Email"
9. mailto: opens with everything pre-filled
10. User just clicks Send in email client
11. Done! ✓
```

**Benefits:**
- One-click recipient selection
- AI polished formatting
- Faster workflow

---

### Flow 3: Power User (Gmail API) - Future

```
1. User finishes meeting, auto-prompt: "Email notes?"
2. User clicks "Yes"
3. Default list auto-selected (e.g., "Just Me")
4. AI auto-enhances email
5. Email sent directly from browser
6. Notification: "✓ Notes emailed to yourself"
7. User doesn't even leave the meeting tab!
```

**Benefits:**
- Fully automated
- Zero friction
- Professional

---

## Premium Feature Pricing

### What's Worth Paying For?

**Free Tier:**
- ✓ Email notes (mailto: link)
- ✓ Basic subject/body
- ✗ Contact lists
- ✗ AI enhancement
- ✗ Templates

**Premium Tier ($1-2.99/month):**
- ✓ Email notes (mailto: link)
- ✓ Contact list management (3 lists, 20 contacts each)
- ✓ AI email enhancement (subject + body + action items)
- ✓ Email templates (3 templates)
- ✓ Smart recipient suggestions
- ✓ Auto-prompt to email on meeting end

**Value Proposition:**
"Save 5 minutes per meeting with AI-enhanced emails and contact lists"

---

## Implementation Plan

### Week 1: MVP Email Feature

**Tasks:**
1. Add "Email Notes" button to editor
2. Implement mailto: link generator
3. Basic email template
4. Test with Gmail, Outlook, Apple Mail

**Deliverable:**
Users can click button, email opens with notes

---

### Week 2: Contact Lists (Premium)

**Tasks:**
1. Create contact list management UI
2. Store lists in chrome.storage.local
3. Quick-select UI in email modal
4. Export/import contacts (JSON)

**Deliverable:**
Premium users can save contacts and quick-select

---

### Week 3: AI Email Enhancement (Premium)

**Tasks:**
1. Add "✨ AI Enhance" button
2. Implement AI email formatting (use existing OpenAI integration)
3. Subject line generation
4. Action items extraction
5. Professional email template

**Deliverable:**
AI formats notes into polished email

---

### Week 4: Auto-Email Prompt

**Tasks:**
1. Detect meeting end
2. Show prompt: "Email these notes?"
3. Remember user preference
4. Settings toggle for auto-prompt

**Deliverable:**
Automatic prompt when meeting ends

---

## Storage Requirements

**Per User (in chrome.storage.local):**
```javascript
{
  // Contact lists (~5KB per user)
  contactLists: { ... },

  // Settings (~1KB)
  emailSettings: {
    autoPrompt: true,
    defaultList: 'just-me',
    aiEnhance: true,
    includeActionItems: true
  },

  // Email templates (~3KB)
  emailTemplates: { ... }
}

// Total: ~10KB per user
// 10,000 users = 100MB (easily fits in chrome.storage.local per-user)
```

**Your storage costs: $0** (stored locally on user's device)

---

## Competitive Analysis

**Otter.ai:**
- Stores notes on their servers
- Can email summary
- No contact lists
- **You're better:** Contact lists + AI enhancement

**Fireflies.ai:**
- Stores notes on their servers
- Emails summary to participants
- Auto-detects participants
- **You're similar:** But simpler, no storage costs

**Tactiq:**
- Manual copy/paste to email
- No auto-email
- No AI enhancement
- **You're better:** Automated + AI

**Your advantage:**
- Stateless (no server storage)
- Contact list management
- AI enhancement
- Lower costs = lower price

---

## Marketing Angle

### Headlines

**"Your meeting notes, delivered to your inbox automatically"**

**"Never lose meeting notes again - automatically emailed when you're done"**

**"AI-powered meeting emails in one click"**

### Value Props

1. **No login required** - Uses your email, your storage
2. **Privacy-first** - Notes never stored on our servers
3. **Automatic backup** - Every meeting emailed to you
4. **Share instantly** - One-click email to your team
5. **AI-enhanced** - Professional emails, not raw notes

---

## Risk Mitigation

### Risk 1: Email Clients Don't Support Long mailto: Bodies

**Problem:** Some email clients limit mailto: body to 2,000 characters

**Solution:**
- Detect body length
- If >2,000 chars, show warning: "Notes too long, will be truncated. Upgrade to Premium for full emails."
- Premium: Use Gmail API (no limits)

---

### Risk 2: Users Want Auto-Send Without Clicking

**Problem:** mailto: requires user to click Send in email client

**Solution:**
- Free tier: mailto: (requires click)
- Premium: Option to use Gmail API (auto-send)
- Marketing: "Upgrade to Premium for one-click email"

---

### Risk 3: Spam Filters

**Problem:** Automated emails might get flagged as spam

**Solution:**
- mailto: = sent from user's email (no spam issues)
- Gmail API = sent from user's Gmail (no spam issues)
- SendGrid (future) = proper DKIM/SPF setup

---

## Success Metrics

**Measure these:**
- % of meetings that get emailed
- Time from meeting end to email sent
- Contact list usage rate
- AI enhancement usage rate
- Free → Premium conversion (if emailing is premium)

**Target:**
- 70% of meetings get emailed
- <30 seconds from end to email
- 50% of premium users use contact lists
- 80% of premium users use AI enhancement

---

## Monetization Strategy

### Option A: Email is Free, AI Enhancement is Premium

**Free:**
- Email notes via mailto:
- Manual recipients

**Premium ($1/month):**
- Contact lists
- AI enhancement
- Templates
- Auto-prompt

**Conversion lever:** "Save time with contact lists and AI"

---

### Option B: Basic Email Free, Advanced Email Premium

**Free:**
- Email to yourself only
- Basic template
- Manual send

**Premium ($1/month):**
- Email to multiple recipients
- Contact lists
- AI enhancement
- Templates
- Auto-prompt

**Conversion lever:** "Share notes with your team"

---

### Option C: Everything Free, Gmail Integration Premium

**Free:**
- Email via mailto:
- Contact lists (limited)
- AI enhancement (limited to 3 per day)

**Premium ($2.99/month):**
- Gmail API integration (one-click send)
- Unlimited contact lists
- Unlimited AI enhancements
- Custom templates
- Email tracking

**Conversion lever:** "Send emails without leaving your browser"

---

## My Recommendation

### For Launch (MVP):

**Implement:**
✅ Email notes button (free for all)
✅ mailto: link generation
✅ Contact lists (premium feature)
✅ AI email enhancement (premium feature)
✅ Auto-prompt on meeting end (premium feature)

**Don't Implement (Yet):**
❌ Gmail API integration (too complex for MVP)
❌ Email service backend (not needed yet)
❌ Email tracking (nice-to-have)

**Pricing:**
- Free: Email notes via mailto: (manual recipients)
- Premium ($1/month): Contact lists + AI enhancement + auto-prompt

**Why This Works:**
1. ✅ Zero server costs (stateless)
2. ✅ Clear premium value (contact lists + AI)
3. ✅ Easy to implement (1-2 weeks)
4. ✅ Solves your storage problem
5. ✅ Competitive advantage (no one else has this)

---

## Implementation Priority

**Must Have (Week 1):**
- [x] Email notes button
- [x] mailto: link generator
- [x] Basic email template

**Should Have (Week 2):**
- [ ] Contact list management UI
- [ ] Quick-select contacts
- [ ] Store lists in chrome.storage

**Nice to Have (Week 3):**
- [ ] AI email enhancement
- [ ] Subject line generation
- [ ] Auto-prompt on meeting end

**Future (V2):**
- [ ] Gmail API integration
- [ ] Email templates editor
- [ ] Smart recipient detection
- [ ] Email service backend

---

## Questions to Answer

1. **Should email be free or premium?**
   - Recommendation: Free basic, premium advanced

2. **Should we implement Gmail API now?**
   - Recommendation: No, start with mailto: (simpler)

3. **How many contact lists should free users get?**
   - Recommendation: 0 (premium feature)

4. **Should AI enhancement be pay-per-use or unlimited with premium?**
   - Recommendation: Unlimited with premium (simpler)

---

**Want me to start implementing this?** I can build the email feature in about 2-3 hours. Let me know which parts you want first!

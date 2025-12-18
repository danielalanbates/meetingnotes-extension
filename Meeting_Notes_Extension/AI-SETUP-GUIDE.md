# AI Features Setup Guide

**Quick Start**: 5 minutes to activate premium AI features

---

## 🚀 Quick Setup (Test Mode)

### Step 1: Get OpenAI API Key (2 minutes)

1. Go to https://platform.openai.com/api-keys
2. Sign in (or create free account)
3. Click **"Create new secret key"**
4. Name it: "BatesAI Extension"
5. **Copy the key** (starts with `sk-...`)
   - ⚠️ Save it somewhere safe - you won't see it again!

### Step 2: Reload Extension (30 seconds)

1. Open Chrome: `chrome://extensions/`
2. Find "BatesAI Meeting Notes"
3. Click the **reload icon** (🔄)
4. Verify no errors

### Step 3: Activate Premium (1 minute)

1. Click the BatesAI extension icon
2. Click any **AI button** (Summarize, Action Items, Format, or Email Draft)
3. Premium modal appears
4. Click **"Upgrade Now - $1/month"**
5. Dialog appears: Click **"OK"** (Demo Mode)
6. Paste your OpenAI API key
7. Click OK
8. ✅ Success! Premium activated

### Step 4: Test AI Features (2 minutes)

1. Type some sample meeting notes in the editor:
   ```
   Team discussed Q4 goals. John will lead the marketing campaign.
   Sarah needs to finalize budget by Friday.
   Launch date set for December 15th.
   Next meeting scheduled for next Tuesday.
   ```

2. Click **"Summarize"** button
   - Wait 3-5 seconds
   - Summary appears below your notes!

3. Click **"Action Items"** button
   - Action items extracted as checklist
   - Tasks with owners and deadlines

4. Click **"Format"** button
   - Notes reformatted professionally
   - Clear headings and structure

5. Click **"Email Draft"** button
   - Professional follow-up email generated
   - Ready to copy and send

**Done!** 🎉 You now have full access to all AI features.

---

## 💡 How AI Features Work

### 1. AI Summarize 🧠

**Use case**: Long meeting → Quick summary

**Example**:
```
Before (200 words of rambling notes)
↓
After (5 bullet points capturing key decisions)
```

**Best for**:
- Meetings over 30 minutes
- Stakeholder updates
- Executive summaries
- Quick reference

**Cost**: ~$0.001 per summary

---

### 2. AI Extract Action Items ✅

**Use case**: Find all tasks buried in notes

**Example**:
```
Before:
"...john mentioned he'll work on login...sarah reviewing docs..."

After:
☐ John: Implement login feature
☐ Sarah: Review documentation
```

**Best for**:
- Sprint planning
- Project meetings
- 1-on-1s
- Team standups

**Cost**: ~$0.001 per extraction

---

### 3. AI Format Notes 📝

**Use case**: Messy notes → Professional document

**Example**:
```
Before:
discussed budget approved 100k need designer launch march

After:
PROJECT OVERVIEW
━━━━━━━━━━━━━━━━━━━━
BUDGET
   • Approved: $100,000
RESOURCES
   • Hiring: 1 Designer
TIMELINE
   • Launch: March
```

**Best for**:
- Voice-to-text transcripts
- Quick scribbles
- Unstructured notes
- Client-facing docs

**Cost**: ~$0.001 per format

---

### 4. AI Generate Email 📧

**Use case**: Notes → Professional follow-up email

**Example**:
```
Before:
"client wants discount we agreed 10% delivery 6 weeks"

After:
Subject: Follow-up: Contract Discussion

Hi [Client],

Thank you for meeting today. We're pleased to confirm:
• 10% discount on standard pricing
• 6-week delivery timeline
...

Best regards,
[Your Name]
```

**Best for**:
- Client meetings
- Stakeholder updates
- Team recaps
- Professional communications

**Cost**: ~$0.002 per email

---

## 💰 Cost Breakdown

### OpenAI API Costs (GPT-4o-mini)

| Feature | Average Cost | Per Month (20 meetings) |
|---------|--------------|-------------------------|
| Summarize | $0.001 | $0.02 |
| Action Items | $0.001 | $0.02 |
| Format | $0.001 | $0.02 |
| Email Draft | $0.002 | $0.04 |
| **Total** | **~$0.005/meeting** | **~$0.10/month** |

**Plus BatesAI Premium**: $1/month

**Grand Total**: ~$1.10/month for heavy users

**Note**: OpenAI gives $5 free credits to new accounts!

---

## 🔐 Security & Privacy

### Your API Key is Safe ✅

- **Stored locally** in Chrome (not on our servers)
- **Never synced** to cloud
- **Only used** for OpenAI API calls
- **You control it** - delete anytime

### What We Don't Do ❌

- ❌ Store your notes on servers
- ❌ Send data to third parties
- ❌ Track your meetings
- ❌ Share your API key
- ❌ See your API usage

### What OpenAI Sees ✅

- Your meeting notes (to process AI requests)
- API requests (anonymized)
- No personal identifying information

**OpenAI Privacy**: https://openai.com/privacy

---

## 🐛 Troubleshooting

### Problem: "Invalid API Key" Error

**Solutions**:
1. Check key starts with `sk-`
2. Copy entire key (no spaces)
3. Verify key is active: https://platform.openai.com/api-keys
4. Generate new key if needed

---

### Problem: "API Error" or "Insufficient Credits"

**Solutions**:
1. Go to https://platform.openai.com/account/billing
2. Add payment method
3. Add $5-10 credits (lasts months)
4. Try AI feature again

**Note**: New accounts get $5 free credits!

---

### Problem: AI Feature Does Nothing

**Solutions**:
1. Check browser console (F12 → Console tab)
2. Look for error messages
3. Reload extension: chrome://extensions/
4. Clear and re-enter API key:
   ```javascript
   // In popup console:
   chrome.storage.local.remove('openai_api_key');
   location.reload();
   ```

---

### Problem: Premium Modal Won't Close

**Solutions**:
1. Click outside the modal (on gray area)
2. Press Escape key
3. Click X button in top-right
4. Reload extension if stuck

---

### Problem: Features Work But Results Are Bad

**Solutions**:
1. **More context**: Add more details to notes
2. **Clearer notes**: Structure your input better
3. **Specific requests**: Tell AI what you want
4. **Examples**: Show format you prefer

**Tips for Better AI Results**:
- ✅ Write complete sentences
- ✅ Use consistent formatting
- ✅ Include names, dates, numbers
- ✅ Separate topics clearly
- ❌ Don't use excessive abbreviations
- ❌ Avoid stream-of-consciousness style

---

## 🎯 Best Practices

### When to Use Each Feature

**Use Summarize when**:
- Meeting is over 30 minutes
- You have 100+ words of notes
- You need quick reference
- Sharing with executives

**Use Action Items when**:
- Multiple tasks discussed
- Need to assign ownership
- Creating sprint backlog
- Following up after meeting

**Use Format when**:
- Notes are messy/unstructured
- Creating documentation
- Sharing with clients
- Voice-to-text transcripts

**Use Email Draft when**:
- Client/stakeholder meetings
- Need formal communication
- Documenting decisions
- Following up within 24 hours

### Combining Features

**Pro Tip**: Use multiple AI features together!

1. Take raw notes during meeting
2. **Format** → Structure your notes
3. **Summarize** → Get executive summary
4. **Action Items** → Extract tasks
5. **Email Draft** → Send to attendees

**Result**: Professional meeting documentation in 30 seconds

---

## 📊 Usage Tips

### Optimize API Costs

1. **Use Format sparingly**: Most expensive feature
2. **Batch action items**: Combine multiple meetings
3. **Summary for long meetings only**: Skip short calls
4. **Manual when possible**: Reserve AI for complex tasks

### Maximize Value

1. **Use templates first**: Fill in structured notes
2. **AI for cleanup**: Let AI polish your work
3. **Iterate**: Try feature multiple times to learn
4. **Feedback loop**: See what works, adjust input

### Power User Workflow

```
1. During meeting:
   - Use template
   - Take structured notes
   - Hit key points only

2. After meeting:
   - Format notes (if messy)
   - Extract action items
   - Generate email draft

3. Within 1 hour:
   - Send email to attendees
   - Create tasks in project management tool
   - Archive notes in knowledge base

Total time: 5 minutes
Value: Professional documentation + accountability
```

---

## 🔄 Managing Your Subscription

### Check Premium Status

**In popup console** (F12 while popup open):
```javascript
chrome.storage.local.get(['isPremium', 'premiumActivatedAt'], (result) => {
  console.log('Premium:', result.isPremium);
  console.log('Activated:', result.premiumActivatedAt);
});
```

### Change API Key

**In popup console**:
```javascript
// Remove old key
chrome.storage.local.remove('openai_api_key');

// Next AI action will prompt for new key
```

### Deactivate Premium (Test Mode)

**In popup console**:
```javascript
chrome.storage.local.set({
  isPremium: false,
  openai_api_key: null
});
location.reload();
```

---

## 🎓 Advanced Usage

### Custom AI Prompts (Coming Soon)

Future feature: Customize AI behavior

```javascript
// Example: Custom summary style
{
  summarizeStyle: 'executive', // or 'detailed', 'bullet-points'
  actionItemFormat: 'JIRA',    // or 'Asana', 'Trello'
  emailTone: 'formal'          // or 'casual', 'friendly'
}
```

### API Usage Monitoring

**Check OpenAI usage**:
1. Go to https://platform.openai.com/account/usage
2. See daily/monthly costs
3. Set budget alerts

**Average BatesAI user**: $0.10-0.50/month in API costs

### Bulk Processing

**Process multiple meetings**:
1. Copy all meeting notes
2. Paste into editor
3. Use AI Format to structure
4. Export as markdown
5. Import to knowledge base

---

## 📞 Support

### Need Help?

**Documentation**:
- [Premium Features Guide](PREMIUM-FEATURES.md)
- [Full Documentation](README.md)
- [Testing Guide](TEST-NEW-FEATURES.md)

**Common Questions**:
1. **How much does it cost?** - $1/month + ~$0.10/month OpenAI API
2. **Do I need coding skills?** - No, completely no-code
3. **Can I cancel anytime?** - Yes, cancel in extension settings
4. **Is my data private?** - Yes, stored locally only

### Report Issues

**Found a bug?**:
1. Open browser console (F12)
2. Copy error message
3. Note steps to reproduce
4. Email: support@batesai.com (example)

---

## ✅ Quick Reference

### Activation Checklist

- [ ] Get OpenAI API key
- [ ] Reload extension
- [ ] Click AI button
- [ ] Enter API key when prompted
- [ ] Test all 4 features
- [ ] Verify results append to notes

### Daily Usage

1. Join meeting → Extension auto-opens
2. Take notes during meeting
3. After meeting → Click AI buttons
4. Review AI output
5. Export or email notes
6. Done! ✅

### Keyboard Shortcuts

- **Open extension**: Click icon or Ctrl/Cmd+Shift+N
- **Bold text**: Ctrl/Cmd+B
- **Save notes**: Ctrl/Cmd+S (auto-save enabled)

---

**You're all set!** 🎉

Start using AI to supercharge your meeting notes.


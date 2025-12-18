# Premium Features Testing Guide

**Quick test instructions to verify the premium system works correctly**

---

## 🚀 Quick Start

### Step 1: Load the Extension

1. Open Chrome browser
2. Go to `chrome://extensions/`
3. Enable "Developer mode" (top right)
4. Click "Load unpacked"
5. Select the `meeting-notes-extension` folder
6. Extension should load with no errors

**✅ Verify**: Extension icon appears in Chrome toolbar

---

### Step 2: Test Premium Button

1. Click the BatesAI extension icon
2. Look for the yellow/gold star (⭐) button in header
3. Click the premium button

**✅ Verify**: New tab opens with premium.html page

---

### Step 3: Inspect Premium Page

The premium page should show:

1. **Header Section**
   - BatesAI logo
   - "BatesAI Premium" title
   - "AI-Powered Meeting Intelligence" tagline
   - Orange "Transform Your Meetings" badge

2. **Pricing Card**
   - "$1/month" large price display
   - 8 feature checkmarks
   - "Subscribe with Google Pay" button
   - "30-day money-back guarantee" text

3. **Features Grid (6 cards)**
   - AI Meeting Summaries
   - Action Items Extraction
   - Smart Note Formatting
   - Follow-up Email Generator
   - Real-Time Transcription
   - Custom Template Generation

4. **Demo Section (3 examples)**
   - AI Summarize demo
   - Action Items demo
   - Smart Formatting demo

5. **Trial Section**
   - "Want to Try First?" heading
   - "Start Free Trial" button

**✅ Verify**: All sections visible and styled correctly

---

### Step 4: Test Trial Activation

1. Scroll to bottom of premium page
2. Click **"Start Free Trial"** button
3. Confirm the dialog (click OK)
4. You'll be prompted for an OpenAI API key

**Two Options**:

#### Option A: Test with Real API Key
1. Get a key from [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Paste key (starts with `sk-`)
3. Wait for validation
4. Success message should appear

**✅ Verify**:
- "Trial Activated!" message appears
- Trial button changes to "✓ Trial Active"
- Button becomes disabled
- Page redirects after 3 seconds

#### Option B: Test without API Key
1. Click Cancel on the prompt
2. Nothing should happen (graceful cancellation)

**✅ Verify**: No errors, can try again

---

### Step 5: Verify Premium Status Storage

After activating trial, check Chrome storage:

1. Right-click extension icon → **Inspect popup**
2. Go to **Application** tab
3. Expand **Local Storage** → `chrome-extension://...`
4. Look for these keys:
   - `isPremium`: true
   - `openai_api_key`: sk-xxxxx (your key)
   - `premiumActivatedAt`: timestamp
   - `premiumMethod`: "trial"
   - `premiumFeatures`: object with all features

**✅ Verify**: All data saved correctly

---

### Step 6: Test AI Features (If Trial Activated)

1. Go back to extension popup
2. Click "Start taking notes..." textarea
3. Type some sample notes:

```
Team meeting about Q4 planning. Sarah proposed $50K marketing budget.
John suggested reallocating from operations. Everyone agreed.
Finance needs to approve by Friday.
```

4. Now test the AI features from the premium page:

#### Test Summary Feature

Open Developer Console on premium page:

```javascript
// Test AI Summary
const notes = "Team meeting about Q4 planning. Sarah proposed $50K marketing budget. John suggested reallocating from operations. Everyone agreed. Finance needs to approve by Friday.";

window.PremiumFeatures.generateMeetingSummary(notes)
  .then(summary => console.log('Summary:', summary))
  .catch(error => console.error('Error:', error));
```

**✅ Verify**:
- API call succeeds
- Summary returned in console
- ~3-5 bullet points generated

#### Test Action Items

```javascript
const notes = "John needs to finish the login feature by Wednesday. Sarah will review API docs. Schedule follow-up for Tuesday at 2pm.";

window.PremiumFeatures.extractActionItems(notes)
  .then(items => console.log('Action Items:', items))
  .catch(error => console.error('Error:', error));
```

**✅ Verify**:
- Checklist format returned
- Tasks extracted correctly
- Owners and deadlines identified

#### Test Note Formatting

```javascript
const notes = "discussed budget, approved 50k, launch march 15, need 2 devs";

window.PremiumFeatures.formatNotes(notes)
  .then(formatted => console.log('Formatted:', formatted))
  .catch(error => console.error('Error:', error));
```

**✅ Verify**:
- Professional formatting applied
- Headings and sections added
- Bullet points organized

#### Test Email Generation

```javascript
const notes = "Client meeting with Acme. Agreed to 10% discount. Delivery in 6 weeks. Next meeting March 1st.";

window.PremiumFeatures.generateFollowUpEmail(notes)
  .then(email => console.log('Email:', email))
  .catch(error => console.error('Error:', error));
```

**✅ Verify**:
- Email format generated
- Subject line included
- Professional tone
- Action items listed

---

### Step 7: Test Payment Flow (Optional)

**⚠️ Only test in test mode to avoid real charges**

1. Update [premium.js](premium.js) line 95:
```javascript
environment: 'TEST' // Make sure this is set
```

2. Click **"Subscribe with Google Pay"**
3. If Google Pay not available, should fallback to Stripe
4. Use Stripe test card: `4242 4242 4242 4242`

**✅ Verify**:
- Payment modal appears
- Test payment processes
- Success message shown
- Premium status activated

---

### Step 8: Test Error Handling

#### Invalid API Key

1. Clear storage: `chrome.storage.local.clear()`
2. Reload extension
3. Click "Start Free Trial"
4. Enter invalid key: `sk-invalid123`

**✅ Verify**:
- Validation fails
- Error message shown
- Can retry with correct key

#### No Notes Entered

1. With trial active, try AI features
2. Don't type any notes
3. Call AI function with empty string

**✅ Verify**:
- Error caught gracefully
- User-friendly message shown
- No API call wasted

#### Network Error

1. Disconnect internet
2. Try to use AI feature

**✅ Verify**:
- Timeout error caught
- Error message displayed
- Extension doesn't crash

---

### Step 9: Test Already Premium User

1. With trial already activated
2. Reload premium page
3. Should see "Premium Active" status

**✅ Verify**:
- Status box appears at top
- Shows activation date
- Payment buttons disabled
- Can still see feature demos

---

### Step 10: Clean Up (Reset Test)

To reset and test again:

1. Open DevTools on extension popup
2. Run:
```javascript
chrome.storage.local.clear(() => {
  console.log('Storage cleared');
  location.reload();
});
```

3. Or manually delete these keys:
   - `isPremium`
   - `openai_api_key`
   - `premiumActivatedAt`
   - `premiumMethod`
   - `premiumFeatures`

**✅ Verify**: Extension returns to non-premium state

---

## 🔍 Debugging Tips

### Check Console Logs

Open DevTools on premium.html:
```
Console → Look for:
- "Google Pay loaded" (when SDK loads)
- "Premium activated: trial" (when trial works)
- Any error messages
```

### Check Network Tab

```
Network → Filter: XHR
Look for:
- https://api.openai.com/v1/models (validation)
- https://api.openai.com/v1/chat/completions (AI calls)
- Status: 200 OK (success)
```

### Check Storage

```
Application → Local Storage → chrome-extension://...
Verify keys are set correctly
```

### Common Issues

**Issue**: Premium page doesn't open
- **Fix**: Check popup.js has openPremiumPage() function
- **Fix**: Verify manifest.json allows premium.html

**Issue**: Google Pay button doesn't work
- **Fix**: Check if Google Pay SDK loaded (console log)
- **Fix**: Verify merchant ID is set in premium.js

**Issue**: Trial activation fails
- **Fix**: Check OpenAI API key is valid (starts with sk-)
- **Fix**: Verify internet connection
- **Fix**: Check console for specific error

**Issue**: AI features don't work
- **Fix**: Verify isPremium is true in storage
- **Fix**: Check API key is saved
- **Fix**: Ensure ai-service.js is loaded

**Issue**: Payment fails
- **Fix**: Verify in TEST mode for testing
- **Fix**: Check Stripe keys are configured
- **Fix**: Review console for webhook errors

---

## ✅ Full Test Checklist

Copy this checklist and mark as you test:

### UI Tests
- [ ] Extension loads without errors
- [ ] Premium button visible and clickable
- [ ] Premium page opens in new tab
- [ ] All sections render correctly
- [ ] Responsive design works
- [ ] Colors and styling correct
- [ ] Images/icons load

### Payment Tests
- [ ] Google Pay button appears
- [ ] Trial button works
- [ ] API key prompt shows
- [ ] API key validation works
- [ ] Premium status saved
- [ ] Status persists on reload

### Feature Tests
- [ ] AI Summary generates results
- [ ] Action Items extracts tasks
- [ ] Note Formatting works
- [ ] Email Generation works
- [ ] Features use correct model
- [ ] API calls succeed

### Error Tests
- [ ] Invalid API key handled
- [ ] Empty notes handled
- [ ] Network error handled
- [ ] Payment decline handled
- [ ] Already premium handled

### Integration Tests
- [ ] Storage read/write works
- [ ] Cross-page communication works
- [ ] Extension icon updates
- [ ] Back button returns to popup

---

## 📊 Expected Results

### First Time User
1. Opens premium page → Sees pricing
2. Clicks trial → Enters API key
3. Validates → Trial activated
4. Uses AI features → Features work
5. Closes and reopens → Still premium

### Paid User (Future)
1. Clicks Google Pay → Payment sheet
2. Confirms payment → Stripe processes
3. Webhook fires → Backend activates
4. Extension checks → Premium granted
5. Uses all features → Including transcription

### Error Scenarios
1. Invalid key → Clear error message
2. No internet → Graceful timeout
3. API limit → Usage warning
4. Payment fails → Retry option

---

## 🎯 Success Criteria

The premium system is working correctly if:

✅ Premium page loads and displays beautifully
✅ Trial activation with API key works
✅ Premium status persists across sessions
✅ All 4 core AI features generate results
✅ Errors handled gracefully with user feedback
✅ Payment UI appears (even if backend not set up)
✅ Storage management works correctly
✅ No console errors during normal use

---

## 🚀 Next Steps After Testing

Once testing is complete:

1. **Configure Production Settings**
   - Replace test API keys with live keys
   - Set up Google Pay merchant account
   - Create Stripe product
   - Deploy backend endpoints

2. **Add Analytics**
   - Track premium page views
   - Monitor trial activations
   - Track feature usage
   - Measure conversion rates

3. **User Feedback**
   - Add feedback form
   - Monitor support requests
   - Track user satisfaction
   - Iterate on UX issues

4. **Scale**
   - Optimize API costs
   - Add caching for common requests
   - Implement rate limiting
   - Monitor performance

---

**Happy Testing!** 🎉

If you encounter any issues, check the [setup guide](PREMIUM-SETUP-GUIDE.md) or [implementation summary](PREMIUM-IMPLEMENTATION-SUMMARY.md) for troubleshooting.

# How to Reset Premium Status for Testing

## Quick Reset (Takes 30 seconds)

### Method 1: DevTools Console (Easiest)

1. **Open the extension popup**
   - Click the BatesAI extension icon in Chrome toolbar

2. **Open DevTools**
   - Press `F12` (or right-click → Inspect)

3. **Go to Console tab**
   - Click "Console" at the top of DevTools

4. **Clear premium status**
   - Copy and paste this command:
   ```javascript
   chrome.storage.local.clear(function() { console.log('✅ Premium status cleared!'); });
   ```
   - Press Enter

5. **Verify it worked**
   - Run this to check:
   ```javascript
   chrome.storage.local.get(null, console.log);
   ```
   - Should show empty object: `{}`

6. **Close and reopen extension**
   - Close the popup
   - Click extension icon again
   - Premium status is now reset!

---

### Method 2: Chrome Settings (More Thorough)

1. Go to `chrome://extensions/`
2. Find "BatesAI Meeting Notes"
3. Click **"Details"**
4. Scroll down to **"Inspect views"**
5. Click the **service worker** link (opens DevTools)
6. In Console, run:
   ```javascript
   chrome.storage.local.clear();
   ```
7. Close DevTools
8. Click **Reload** button on the extension
9. Done!

---

### Method 3: Remove and Reinstall (Nuclear Option)

Only use this if you want to completely reset everything:

1. Go to `chrome://extensions/`
2. Find "BatesAI Meeting Notes"
3. Click **"Remove"**
4. Click **"Load unpacked"**
5. Select the extension folder again
6. Completely fresh start!

---

## Test Flow: Extension → Premium Page → Free Trial

Now that premium is reset, test the full user flow:

### Step 1: Open Extension
1. Click BatesAI extension icon
2. Verify you see the toolbar with AI button (⭐)
3. Premium should NOT be active yet

### Step 2: Open Premium Page
1. Click the AI button (⭐)
2. New tab opens with premium page
3. Should see:
   - Pricing card: $1/month
   - "Subscribe with Google Pay" button
   - "🎯 Test Drive" section with "Activate Free Trial" button

### Step 3: Activate Free Trial
1. Scroll to "🎯 Test Drive" section
2. Click **"Activate Free Trial"** button
3. Should see alert: "✅ Premium Trial Activated!"
4. Buttons should update:
   - "Activate Free Trial" → "✓ Trial Active" (disabled)
   - "Subscribe with Google Pay" → "✓ Premium Active" (disabled)

### Step 4: Verify Premium is Active
1. Go back to extension popup
2. Press F12 to open console
3. Run:
   ```javascript
   chrome.storage.local.get(['isPremium', 'premiumMethod'], console.log);
   ```
4. Should see:
   ```javascript
   {isPremium: true, premiumMethod: "trial"}
   ```

### Step 5: Test AI Features (Optional)
Now that premium is active, you can test the AI features:
1. Type some meeting notes in the editor
2. Click AI button (⭐)
3. Premium features should be accessible

---

## Expected Console Output

### When You Clear Storage:
```
✅ Premium status cleared!
```

### When You Check Storage (After Clear):
```
{}
```

### When Premium Page Loads (Not Premium):
```
🚀 Premium.js loading...
📋 Initializing buttons...
Found buttons: {googlePay: true, trial: true, back: true}
✅ Google Pay listener attached
✅ Trial listener attached
✅ Back listener attached
Current premium status: {}
✅ Premium.js loaded
```

### When You Click "Activate Free Trial":
```
🎯 Trial button clicked!
🎯 Activating trial...
✅ Trial activated successfully
```

### When Premium Page Loads (Already Premium):
```
🚀 Premium.js loading...
📋 Initializing buttons...
Found buttons: {googlePay: true, trial: true, back: true}
✅ Google Pay listener attached
✅ Trial listener attached
✅ Back listener attached
Current premium status: {isPremium: true, premiumMethod: "trial"}
✅ Premium.js loaded
```

---

## Troubleshooting

### Premium Status Won't Clear

**Try this more aggressive clear:**
```javascript
chrome.storage.local.clear(function() {
  chrome.storage.sync.clear(function() {
    console.log('✅ All storage cleared!');
    chrome.runtime.reload();
  });
});
```

### Buttons Still Show "✓ Premium Active"

The page cached the old status. Fix:
1. Close the premium tab
2. Reload extension at `chrome://extensions/`
3. Open premium page again

### Can't Find DevTools Console

1. Right-click anywhere on the page
2. Click "Inspect"
3. Click "Console" tab at the top
4. You should see a command prompt `>`

---

## Quick Commands Reference

### Clear Premium Status
```javascript
chrome.storage.local.clear(function() { console.log('✅ Cleared!'); });
```

### Check Current Status
```javascript
chrome.storage.local.get(null, console.log);
```

### Check Just Premium Fields
```javascript
chrome.storage.local.get(['isPremium', 'premiumMethod', 'premiumActivatedAt'], console.log);
```

### Manually Set Premium (For Testing)
```javascript
chrome.storage.local.set({
  isPremium: true,
  premiumMethod: 'trial',
  premiumActivatedAt: new Date().toISOString()
}, function() { console.log('✅ Premium activated!'); });
```

### Manually Remove Premium (For Testing)
```javascript
chrome.storage.local.remove(['isPremium', 'premiumMethod', 'premiumActivatedAt', 'premiumFeatures'], function() {
  console.log('✅ Premium removed!');
});
```

---

## Testing Checklist

Use this to verify everything works:

- [ ] Clear premium status via console
- [ ] Reload extension
- [ ] Open extension popup - AI button visible
- [ ] Click AI button - premium page opens
- [ ] Premium page shows both buttons (Subscribe + Free Trial)
- [ ] Click "Activate Free Trial"
- [ ] Alert appears: "✅ Premium Trial Activated!"
- [ ] Buttons update to "✓ Trial Active" and "✓ Premium Active"
- [ ] Go back to popup
- [ ] Verify storage shows `isPremium: true`
- [ ] Clear storage again to reset for next test

---

**Pro Tip:** Keep DevTools open while testing so you can quickly clear storage and reset between tests!

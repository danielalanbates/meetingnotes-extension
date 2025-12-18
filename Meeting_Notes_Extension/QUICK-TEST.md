# Quick Test Instructions

## Open the Test Page Directly

1. **Load the extension** in Chrome:
   - Go to `chrome://extensions/`
   - Enable "Developer mode" (top right)
   - Click "Load unpacked"
   - Select this folder
   - Extension loads

2. **Open the AI Features Test Page**:
   - Open a new tab in Chrome
   - Type this in the address bar:
   ```
   chrome-extension://EXTENSION_ID/test-ai-features.html
   ```
   
   **To find your EXTENSION_ID:**
   - Go to `chrome://extensions/`
   - Look under "BatesAI Meeting Notes"
   - Copy the ID (looks like: `abcdefghijklmnopqrstuvwxyz123456`)
   
   **OR use this shortcut:**
   - Right-click the extension icon
   - Click "Inspect popup"
   - In the console, type: `chrome.runtime.getURL('test-ai-features.html')`
   - Open that URL in a new tab

3. **Test the Features**:
   - Click "Activate Demo Mode" ✅
   - (Optional) Enter your OpenAI API key if you want real AI results
   - Click each "Generate" button to test all 4 AI features
   - Results will appear below each section

## Simple Console Test

If the test page doesn't work, open the browser console (F12) on ANY page and run:

```javascript
// Activate premium demo mode
chrome.storage.local.set({
  isPremium: true,
  premiumMethod: 'demo',
  openai_api_key: 'YOUR-API-KEY-HERE',  // Replace with your sk-... key
  premiumActivatedAt: new Date().toISOString()
}, () => {
  console.log('✅ Premium activated!');
});
```

Then test the AI features in the console:

```javascript
// Wait 2 seconds, then test
setTimeout(async () => {
  const notes = "Team meeting about Q4. Budget approved: $50K. Launch date: March 15.";
  
  // Load AI service
  const aiService = new AIService();
  await aiService.initialize();
  
  // Test summary
  const summary = await aiService.summarizeNotes(notes);
  console.log('SUMMARY:', summary);
}, 2000);
```

## Troubleshooting

**Buttons don't work on premium.html?**
- Open `test-ai-features.html` instead (see instructions above)
- Or use the console commands

**"AI Service not found" error?**
- Make sure ai-service.js exists in the extension folder
- Reload the extension

**API key errors?**
- Get a key from https://platform.openai.com/api-keys
- Make sure it starts with `sk-`
- Check you have credits in your OpenAI account


// BatesAI Premium - Simple Activation Handler
// This script runs immediately when loaded

console.log('🚀 Premium.js loading...');

// Attach button handlers as soon as DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initButtons);
} else {
  // DOM already loaded
  initButtons();
}

function initButtons() {
  console.log('📋 Initializing buttons...');

  const googlePayBtn = document.getElementById('googlePayBtn');
  const trialBtn = document.getElementById('trialBtn');
  const backBtn = document.getElementById('backBtn');

  console.log('Found buttons:', {
    googlePay: !!googlePayBtn,
    trial: !!trialBtn,
    back: !!backBtn
  });

  if (googlePayBtn) {
    googlePayBtn.addEventListener('click', function() {
      console.log('💳 Google Pay button clicked!');
      activateGooglePay();
    });
    console.log('✅ Google Pay listener attached');
  }

  // Stripe link input handlers
  const saveStripeLinkBtn = document.getElementById('saveStripeLinkBtn');
  const openStripeLinkBtn = document.getElementById('openStripeLinkBtn');
  const stripeLinkInput = document.getElementById('stripeLinkInput');

  if (saveStripeLinkBtn) {
    saveStripeLinkBtn.addEventListener('click', function() {
      const url = stripeLinkInput.value.trim();
      if (!url) { alert('Please paste a Stripe payment link to save.'); return; }
      chrome.storage.local.set({ stripe_payment_link: url }, function() {
        if (chrome.runtime.lastError) {
          alert('Failed to save link: ' + chrome.runtime.lastError.message);
          return;
        }
        alert('Stripe test link saved locally.');
      });
    });
  }

  if (openStripeLinkBtn) {
    openStripeLinkBtn.addEventListener('click', function() {
      chrome.storage.local.get(['stripe_payment_link'], function(result) {
        const url = result.stripe_payment_link || stripeLinkInput.value.trim();
        if (!url) { alert('No Stripe link configured. Paste a test link then press Save Link.'); return; }
        chrome.tabs.create({ url }, function(tab) {
          console.log('Opened Stripe link in tab', tab && tab.id);
        });
      });
    });
  }

  if (trialBtn) {
    trialBtn.addEventListener('click', function() {
      console.log('🎯 Trial button clicked!');
      activateTrial();
    });
    console.log('✅ Trial listener attached');
  }

  if (backBtn) {
    backBtn.addEventListener('click', function() {
      console.log('← Back button clicked');
      window.close();
    });
    console.log('✅ Back listener attached');
  }

  // API Key button
  const saveApiKeyBtn = document.getElementById('saveApiKeyBtn');
  if (saveApiKeyBtn) {
    saveApiKeyBtn.addEventListener('click', function() {
      console.log('🔑 Save API Key button clicked!');
      saveApiKey();
    });
    console.log('✅ Save API Key listener attached');
  }

  // Load saved Stripe link into input if present
  if (stripeLinkInput) {
    chrome.storage.local.get(['stripe_payment_link'], function(result) {
      if (result && result.stripe_payment_link) {
        stripeLinkInput.value = result.stripe_payment_link;
      }
    });
  }

  // Verify Checkout Session via the server
  const verifySessionBtn = document.getElementById('verifySessionBtn');
  const checkoutSessionInput = document.getElementById('checkoutSessionInput');
  const verifyStatus = document.getElementById('verifyStatus');

  // Server base URL (you can store this in storage or edit here)
  chrome.storage.local.get(['server_base_url'], function(res) {
    const defaultServer = res.server_base_url || '';
    // expose as global for quick dev (optional)
    window._MEETPAD_SERVER = defaultServer;
    if (defaultServer) console.log('Server base URL:', defaultServer);
  });

  if (verifySessionBtn) {
    verifySessionBtn.addEventListener('click', async function() {
      const sessionId = checkoutSessionInput.value.trim();
      if (!sessionId) { alert('Please paste a Checkout Session ID (cs_test_...)'); return; }

      // Get server base
      chrome.storage.local.get(['server_base_url'], async function(result) {
        const server = result.server_base_url || window._MEETPAD_SERVER || 'https://your-server.example.com';
        if (!server || server.includes('your-server')) {
          alert('Please set your server base URL in storage (server_base_url) or edit premium.js to point to your deployed server.');
          return;
        }

        verifyStatus.textContent = 'Verifying...';
        try {
          const resp = await fetch(server.replace(/\/$/, '') + '/verify-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId })
          });

          const data = await resp.json();
          if (!resp.ok) throw new Error(data.error || 'Verification failed');

          if (data.paid) {
            // activate premium locally
            chrome.storage.local.set({ isPremium: true, premiumMethod: 'stripe', premiumActivatedAt: new Date().toISOString() }, function() {
              verifyStatus.textContent = 'Payment verified — Premium activated';
              alert('Payment verified. Premium features activated in this browser.');
            });
          } else {
            verifyStatus.textContent = 'Session not paid';
            alert('Session found but not paid.');
          }
        } catch (err) {
          console.error('Verify error:', err);
          verifyStatus.textContent = 'Verification failed';
          alert('Verification failed: ' + err.message);
        }
      });
    });
  }

  // Check if already premium
  checkPremiumStatus();
}

// Check existing premium status
function checkPremiumStatus() {
  if (typeof chrome === 'undefined' || !chrome.storage) {
    console.error('❌ Chrome storage not available');
    return;
  }

  chrome.storage.local.get(['isPremium', 'premiumMethod'], function(result) {
    console.log('Current premium status:', result);

    if (result.isPremium) {
      const trialBtn = document.getElementById('trialBtn');

      // Only disable trial button - keep Subscribe button always active
      if (trialBtn) {
        trialBtn.textContent = '✓ Trial Active';
        trialBtn.disabled = true;
      }

      // Subscribe button stays enabled - users can upgrade from trial to paid
      console.log('ℹ️ Trial active - Subscribe button remains enabled for upgrade');
    }
  });
}

// Activate trial
function activateTrial() {
  console.log('🎯 Activating trial...');

  if (typeof chrome === 'undefined' || !chrome.storage) {
    alert('❌ Error: Chrome storage not available.\n\nPlease make sure this page is loaded as a Chrome extension.');
    return;
  }

  // Save premium status
  chrome.storage.local.set({
    isPremium: true,
    premiumActivatedAt: new Date().toISOString(),
    premiumMethod: 'trial',
    premiumFeatures: {
      aiSummarize: true,
      aiActionItems: true,
      aiFormat: true,
      aiEmail: true
    }
  }, function() {
    if (chrome.runtime.lastError) {
      console.error('Storage error:', chrome.runtime.lastError);
      alert('❌ Error saving premium status: ' + chrome.runtime.lastError.message);
      return;
    }

    console.log('✅ Trial activated successfully');
    alert('✅ Premium Trial Activated!\n\nAll AI features are now unlocked.\n\nYou can now use:\n• AI Summarize\n• Action Items\n• Format Notes\n• Email Generation\n\n💡 Want full access? Click "Subscribe" to upgrade to paid plan.');

    // Update trial button only - keep Subscribe button active
    const trialBtn = document.getElementById('trialBtn');

    if (trialBtn) {
      trialBtn.textContent = '✓ Trial Active';
      trialBtn.disabled = true;
    }

    // Subscribe button stays enabled for upgrade from trial to paid
    console.log('ℹ️ Subscribe button remains active for trial → paid upgrade');
  });
}

// Activate Google Pay subscription - Redirect to Stripe Checkout
function activateGooglePay() {
  console.log('💳 Opening payment page...');

  // CONFIGURATION - Stripe Payment Link for MeetingPad Premium
  const STRIPE_PAYMENT_LINK = 'https://buy.stripe.com/test_9AQ4jK8fQb4E1cQ8ww';

  // For testing, you can use this format:
  // https://buy.stripe.com/test_XXXXXXXXX
  //
  // To set up:
  // 1. Go to https://dashboard.stripe.com/test/payment-links
  // 2. Create a new payment link for $1/month subscription
  // 3. Copy the link and replace STRIPE_PAYMENT_LINK above

  // Check if payment link is configured
  if (STRIPE_PAYMENT_LINK.includes('XXXXXXXXX')) {
    console.warn('⚠️ Stripe payment link not configured');

    // Show setup instructions
    alert(
      '⚠️ Payment Not Configured\n\n' +
      'To enable payments:\n\n' +
      '1. Create a Stripe account at stripe.com\n' +
      '2. Create a Payment Link for $1/month\n' +
      '3. Update STRIPE_PAYMENT_LINK in premium.js\n\n' +
      'For now, use the Free Trial button to test features.'
    );
    return;
  }

  // Open Stripe Checkout in new tab
  console.log('🔗 Opening Stripe Checkout:', STRIPE_PAYMENT_LINK);

  // Open payment page
  chrome.tabs.create({ url: STRIPE_PAYMENT_LINK }, function(tab) {
    console.log('✅ Payment page opened in tab:', tab.id);

    // Show message to user
    alert(
      '💳 Payment Page Opening...\n\n' +
      'Complete payment in the new tab.\n\n' +
      'After payment, you\'ll be redirected back and premium will activate automatically.'
    );
  });
}

// Save API Key
function saveApiKey() {
  console.log('🔑 Saving API key...');

  if (typeof chrome === 'undefined' || !chrome.storage) {
    alert('❌ Error: Chrome storage not available.\n\nPlease make sure this page is loaded as a Chrome extension.');
    return;
  }

  const apiKeyInput = document.getElementById('apiKeyInput');
  const apiKey = apiKeyInput.value.trim();

  if (!apiKey) {
    alert('❌ Please enter your OpenAI API key.');
    return;
  }

  if (!apiKey.startsWith('sk-')) {
    alert('❌ Invalid API key format. OpenAI API keys start with "sk-".');
    return;
  }

  // Save API key
  chrome.storage.local.set({ openai_api_key: apiKey }, function() {
    if (chrome.runtime.lastError) {
      console.error('Storage error:', chrome.runtime.lastError);
      alert('❌ Error saving API key: ' + chrome.runtime.lastError.message);
      return;
    }

    console.log('✅ API key saved successfully');
    alert('✅ OpenAI API Key Saved!\n\nYou can now use all AI features in the extension.');

    // Clear the input for security
    apiKeyInput.value = '';
  });
}

console.log('✅ Premium.js loaded');

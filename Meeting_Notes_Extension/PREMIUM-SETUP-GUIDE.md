# BatesAI Premium - Production Setup Guide

**Version**: 2.0
**Last Updated**: October 18, 2025
**Status**: Ready for Production Deployment

---

## 🎯 Overview

This guide will help you set up BatesAI Premium with **Google Pay** payment processing and all **AI-powered features** for production use.

### What's Included

- ✅ Dedicated premium landing page ([premium.html](premium.html))
- ✅ Google Pay integration
- ✅ Stripe fallback payment processing
- ✅ 6 AI-powered features
- ✅ Trial mode with OpenAI API key
- ✅ Premium user authentication
- ✅ Feature gating and access control

---

## 📋 Prerequisites

Before you begin, you'll need:

1. **Google Pay Merchant Account**
   - Business verification
   - Payment processor setup (Stripe recommended)

2. **Stripe Account**
   - For payment processing
   - Publishable and secret keys
   - Product and price created

3. **OpenAI Account** (for AI features)
   - API key management
   - Billing enabled

4. **Web Server** (for backend)
   - Node.js, Python, or your preferred stack
   - HTTPS enabled (required for payments)
   - Database for user management

---

## 🔧 Step 1: Google Pay Setup

### 1.1 Create Google Pay Merchant Account

1. Go to [Google Pay Business Console](https://pay.google.com/business/console)
2. Sign in with your Google account
3. Complete business verification:
   - Business name
   - Website URL
   - Business address
   - Tax information

### 1.2 Configure Payment Processor

1. In Google Pay Console, go to **Payment Methods**
2. Add **Stripe** as your payment processor
3. Connect your Stripe account
4. Get your **Merchant ID**: `BCR2DN4T2YU7YK2J` (example)

### 1.3 Update Configuration

In [premium.js](premium.js#L3-L7):

```javascript
const GOOGLE_PAY_MERCHANT_ID = 'YOUR_ACTUAL_MERCHANT_ID';
const GOOGLE_PAY_GATEWAY = 'stripe';
const GOOGLE_PAY_GATEWAY_MERCHANT_ID = 'YOUR_STRIPE_MERCHANT_ID';
```

**Where to find these:**
- **GOOGLE_PAY_MERCHANT_ID**: Google Pay Business Console → Settings
- **GOOGLE_PAY_GATEWAY_MERCHANT_ID**: Stripe Dashboard → Settings → Account Details

---

## 💳 Step 2: Stripe Setup

### 2.1 Create Stripe Account

1. Go to [stripe.com](https://stripe.com)
2. Sign up for a Stripe account
3. Complete business verification
4. Enable live mode (after testing)

### 2.2 Create Product and Pricing

1. In Stripe Dashboard, go to **Products**
2. Click **+ Add Product**
3. Configure:
   - **Name**: BatesAI Premium
   - **Description**: AI-powered meeting assistant
   - **Pricing**: $1.00 USD / month
   - **Billing Period**: Monthly
   - **Type**: Recurring subscription

4. **Save** and copy the **Price ID** (starts with `price_`)

### 2.3 Get API Keys

1. Go to **Developers** → **API Keys**
2. Copy:
   - **Publishable key** (starts with `pk_`)
   - **Secret key** (starts with `sk_`) - Keep this secure!

### 2.4 Update Configuration

In [premium.js](premium.js#L9-L10):

```javascript
const STRIPE_PUBLISHABLE_KEY = 'pk_live_XXXXXXXXXXXXX';
const STRIPE_PRICE_ID = 'price_XXXXXXXXXXXXX';
```

### 2.5 Create Checkout Session Endpoint

Create a backend endpoint to handle payment sessions:

**Example (Node.js/Express):**

```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: 'price_XXXXXXXXXXXXX', // Your price ID
          quantity: 1,
        },
      ],
      success_url: 'https://yourextension.com/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'https://yourextension.com/premium',
      metadata: {
        extension_user_id: req.body.userId
      }
    });

    res.json({ id: session.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

**Update in [premium.js](premium.js#L151-L158):**

```javascript
async function handleStripeCheckout() {
  const stripe = window.Stripe(STRIPE_PUBLISHABLE_KEY);

  const response = await fetch('https://your-backend.com/api/create-checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ priceId: STRIPE_PRICE_ID })
  });

  const session = await response.json();
  await stripe.redirectToCheckout({ sessionId: session.id });
}
```

---

## 🔐 Step 3: Webhook Configuration

### 3.1 Create Stripe Webhook

1. Go to **Developers** → **Webhooks** in Stripe Dashboard
2. Click **+ Add Endpoint**
3. Enter your endpoint URL: `https://your-backend.com/api/stripe-webhook`
4. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`

5. Copy the **Webhook Signing Secret** (starts with `whsec_`)

### 3.2 Implement Webhook Handler

**Example (Node.js/Express):**

```javascript
app.post('/api/stripe-webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;

      // Activate premium for user
      await activateUserPremium({
        userId: session.metadata.extension_user_id,
        customerId: session.customer,
        subscriptionId: session.subscription
      });
      break;

    case 'customer.subscription.deleted':
      // Deactivate premium
      await deactivateUserPremium(event.data.object.customer);
      break;

    case 'invoice.payment_failed':
      // Handle failed payment
      await handlePaymentFailure(event.data.object.customer);
      break;
  }

  res.json({received: true});
});
```

---

## 🤖 Step 4: OpenAI API Setup

### 4.1 Create OpenAI Account

1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign up and verify your account
3. Add payment method
4. Set up usage limits

### 4.2 Configure API Usage

The extension uses these models:
- **GPT-4o-mini**: For all AI features (~$0.002/meeting)
- **Whisper**: For transcription (paid subscribers only)

**Estimated Costs:**
- Free trial users: $0 (they use their own API keys)
- Paid users: ~$0.05-0.10 per user per month

### 4.3 Security Best Practices

For **trial users** (BYOK - Bring Your Own Key):
- ✅ Keys stored in `chrome.storage.local` (not synced)
- ✅ Never sent to your backend
- ✅ Direct OpenAI API calls from extension

For **paid users**:
- Option 1: Users still provide their own key (current setup)
- Option 2: Backend proxy for API calls (more secure, but higher costs)

---

## 🗄️ Step 5: Backend Database Setup

### 5.1 User Schema

```sql
CREATE TABLE users (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  stripe_customer_id VARCHAR(255),
  subscription_id VARCHAR(255),
  subscription_status VARCHAR(50),
  premium_activated_at TIMESTAMP,
  premium_expires_at TIMESTAMP,
  trial_mode BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE subscription_events (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) REFERENCES users(id),
  event_type VARCHAR(100),
  stripe_event_id VARCHAR(255),
  data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 5.2 API Endpoints Needed

Create these endpoints:

```
POST   /api/auth/register          - Register new user
POST   /api/auth/login             - User login
GET    /api/user/premium-status    - Check if user has premium
POST   /api/payments/checkout      - Create Stripe checkout session
POST   /api/payments/webhook       - Handle Stripe webhooks
GET    /api/user/subscription      - Get subscription details
DELETE /api/user/subscription      - Cancel subscription
```

---

## 🚀 Step 6: Chrome Extension Configuration

### 6.1 Update Manifest for External Connections

In [manifest.json](manifest.json), add:

```json
{
  "externally_connectable": {
    "matches": ["https://your-backend.com/*"]
  },
  "host_permissions": [
    "https://api.openai.com/*",
    "https://your-backend.com/*"
  ]
}
```

### 6.2 Environment Configuration

Create `config.js`:

```javascript
const CONFIG = {
  BACKEND_URL: 'https://your-backend.com',
  STRIPE_PUBLISHABLE_KEY: 'pk_live_XXXXX',
  GOOGLE_PAY_MERCHANT_ID: 'BCR2DN4T2YU7YK2J',
  ENVIRONMENT: 'production' // or 'development'
};
```

### 6.3 Update Premium Page URLs

In [premium.js](premium.js):

Replace all placeholder URLs with your actual backend URLs.

---

## 🧪 Step 7: Testing

### 7.1 Test Mode Setup

**Stripe Test Mode:**
1. Use test API keys (starts with `pk_test_` and `sk_test_`)
2. Test card numbers:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - Requires 3D Secure: `4000 0027 6000 3184`

**Google Pay Test:**
1. Use `environment: 'TEST'` in Google Pay client
2. No real charges will be made

### 7.2 Testing Checklist

- [ ] **Payment Flow**
  - [ ] Click premium button → Opens premium page
  - [ ] Click Google Pay → Payment sheet appears
  - [ ] Complete payment → Success message
  - [ ] Webhook fires → User activated in database

- [ ] **Trial Activation**
  - [ ] Click trial button → API key prompt
  - [ ] Enter valid key → Features unlock
  - [ ] Invalid key → Error message

- [ ] **AI Features**
  - [ ] Summarize notes works
  - [ ] Action items extraction works
  - [ ] Note formatting works
  - [ ] Email generation works

- [ ] **Error Handling**
  - [ ] Payment decline → Error message
  - [ ] Invalid API key → Clear error
  - [ ] Network error → Retry or fallback

---

## 📊 Step 8: Analytics & Monitoring

### 8.1 Track Key Metrics

Set up tracking for:
- Premium page views
- Payment attempts
- Payment successes
- Trial activations
- Feature usage
- Churn rate

### 8.2 Recommended Tools

- **Stripe Dashboard**: Payment analytics
- **Google Analytics**: User behavior
- **Sentry**: Error monitoring
- **Mixpanel**: Feature usage tracking

---

## 💰 Step 9: Pricing & Economics

### Current Pricing

| Plan | Price | Features |
|------|-------|----------|
| **Free** | $0 | Basic note-taking, templates, export |
| **Trial** | $0 | All AI features (user provides API key) |
| **Premium** | $1/month | All AI + transcription + custom templates |

### Cost Breakdown (Per Premium User)

| Item | Cost | Notes |
|------|------|-------|
| Stripe fees | ~$0.33 | 2.9% + $0.30 per transaction |
| OpenAI API | ~$0.10 | If you provide API access |
| Hosting | ~$0.05 | Database, backend servers |
| **Total** | **~$0.48** | |
| **Profit** | **~$0.52** | 52% margin |

### Growth Projections

| Month | Users | MRR | Costs | Profit |
|-------|-------|-----|-------|--------|
| 1 | 100 | $100 | $48 | $52 |
| 3 | 500 | $500 | $240 | $260 |
| 6 | 1,000 | $1,000 | $480 | $520 |
| 12 | 2,500 | $2,500 | $1,200 | $1,300 |

---

## 🔒 Step 10: Security Checklist

- [ ] **API Keys**
  - [ ] Never commit keys to Git
  - [ ] Use environment variables
  - [ ] Rotate keys regularly

- [ ] **User Data**
  - [ ] Encrypt sensitive data at rest
  - [ ] Use HTTPS everywhere
  - [ ] Implement rate limiting

- [ ] **Payment Security**
  - [ ] PCI compliance (Stripe handles this)
  - [ ] Validate webhook signatures
  - [ ] Log all payment events

- [ ] **Extension Security**
  - [ ] Content Security Policy in manifest
  - [ ] Validate all user inputs
  - [ ] Sanitize API responses

---

## 📝 Step 11: Legal & Compliance

### Required Documents

1. **Terms of Service**
   - Subscription terms
   - Cancellation policy
   - Refund policy (30-day money-back)

2. **Privacy Policy**
   - Data collection practices
   - OpenAI API usage disclosure
   - Payment data handling

3. **Google Pay Requirements**
   - Merchant terms compliance
   - Clear pricing display
   - Cancellation instructions

### GDPR Compliance (if applicable)

- User data export
- Right to deletion
- Cookie consent
- Data processing agreement

---

## 🚀 Step 12: Launch Checklist

### Pre-Launch

- [ ] All API keys configured
- [ ] Backend deployed and tested
- [ ] Database migrations run
- [ ] Webhooks verified
- [ ] Error monitoring setup
- [ ] Analytics configured

### Launch Day

- [ ] Switch Stripe to live mode
- [ ] Update extension with production config
- [ ] Submit to Chrome Web Store (if new version)
- [ ] Test live payment end-to-end
- [ ] Monitor webhooks and errors

### Post-Launch

- [ ] Monitor payment success rate
- [ ] Check webhook delivery
- [ ] Review error logs
- [ ] Collect user feedback
- [ ] Track conversion metrics

---

## 📞 Support & Resources

### Documentation

- [Stripe Subscription Docs](https://stripe.com/docs/billing/subscriptions/overview)
- [Google Pay Integration](https://developers.google.com/pay/api/web/guides/tutorial)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- [Chrome Extension Publishing](https://developer.chrome.com/docs/webstore/publish/)

### Support Channels

- **Stripe Support**: support.stripe.com
- **Google Pay Support**: pay.google.com/business/support
- **OpenAI Support**: help.openai.com

---

## 🎉 Summary

You've successfully set up:

✅ Google Pay payment processing
✅ Stripe subscription billing
✅ Premium feature gating
✅ AI-powered features
✅ Trial mode with BYOK
✅ User authentication
✅ Webhook processing
✅ Analytics and monitoring

**Your extension is now ready to monetize!**

---

## 🔄 Quick Reference

### Configuration Files to Update

1. **premium.js** - Lines 3-10: API keys and merchant IDs
2. **manifest.json** - Add backend URL to permissions
3. **Backend** - Deploy payment endpoints
4. **Stripe** - Create product and webhooks
5. **Google Pay** - Configure merchant account

### Test Credentials

```javascript
// Stripe Test Mode
STRIPE_PUBLISHABLE_KEY: 'pk_test_...'
Test Card: 4242 4242 4242 4242

// Google Pay Test
environment: 'TEST'

// OpenAI Trial
Any valid sk-... key
```

---

**Version**: 2.0
**Last Updated**: October 18, 2025
**Questions?** Check the [main documentation](README.md) or create an issue.

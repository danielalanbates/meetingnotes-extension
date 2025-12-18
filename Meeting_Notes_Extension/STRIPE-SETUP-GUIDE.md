# Stripe Payment Setup Guide

## Quick Setup (5 minutes)

### Step 1: Create Stripe Account
1. Go to [https://stripe.com](https://stripe.com)
2. Click "Sign up"
3. Enter your email and create account
4. You'll start in **Test Mode** (perfect for testing)

### Step 2: Create Payment Link
1. Log into Stripe Dashboard
2. Make sure you're in **Test Mode** (toggle in top right)
3. Go to: **Payment Links** (left sidebar)
   - Or visit: [https://dashboard.stripe.com/test/payment-links](https://dashboard.stripe.com/test/payment-links)
4. Click **"+ New"** button

### Step 3: Configure Payment Link
1. **Product name**: "BatesAI Premium"
2. **Description**: "AI-powered meeting notes features"
3. **Pricing**:
   - Amount: $1.00
   - Billing period: Monthly
   - Type: Recurring subscription
4. **Payment methods**:
   - ✅ Card
   - ✅ Google Pay (automatically available)
   - ✅ Apple Pay (automatically available)
5. Click **"Create link"**

### Step 4: Copy Payment Link
1. Stripe shows your new payment link
2. It looks like: `https://buy.stripe.com/test_xxxxxxxxxxxxxx`
3. Click **"Copy link"**

### Step 5: Add to Extension
1. Open `premium.js` in your code editor
2. Find line 125: `const STRIPE_PAYMENT_LINK = 'https://buy.stripe.com/test_XXXXXXXXX';`
3. Replace with your actual link:
   ```javascript
   const STRIPE_PAYMENT_LINK = 'https://buy.stripe.com/test_xxxxxxxxxxxxxx';
   ```
4. Save the file
5. Reload extension at `chrome://extensions/`

### Step 6: Test It!
1. Click AI button in extension
2. Click "Subscribe with Google Pay"
3. New tab opens with Stripe checkout page
4. Test with Stripe test card:
   - Card number: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., 12/34)
   - CVC: Any 3 digits (e.g., 123)
   - ZIP: Any 5 digits (e.g., 12345)
5. Complete payment
6. Success! 🎉

---

## Going Live (Production)

When ready to accept real payments:

### Step 1: Activate Stripe Account
1. In Stripe Dashboard, click **"Activate account"**
2. Provide business information:
   - Business type (Individual or Company)
   - Tax ID (if applicable)
   - Bank account for payouts
   - Identity verification

### Step 2: Create Production Payment Link
1. Toggle from **Test Mode** to **Live Mode** (top right)
2. Go to Payment Links
3. Create new link (same settings as test):
   - Product: BatesAI Premium
   - Price: $1/month recurring
4. Copy the LIVE payment link
   - Looks like: `https://buy.stripe.com/xxxxxxxxxxxxxx` (no "test" in URL)

### Step 3: Update Extension
1. In `premium.js`, replace test link with live link:
   ```javascript
   const STRIPE_PAYMENT_LINK = 'https://buy.stripe.com/xxxxxxxxxxxxxx';
   ```
2. Remove any test-only code
3. Publish to Chrome Web Store

### Step 4: Set Up Webhooks (Optional but Recommended)
To automatically activate premium after payment:

1. In Stripe Dashboard → **Developers** → **Webhooks**
2. Add endpoint: `https://yourdomain.com/api/stripe-webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.deleted`
4. Create backend to handle webhooks and update user status

---

## Payment Flow

### Current Flow (Simple - No Backend Required):
```
User clicks "Subscribe"
  ↓
Opens Stripe Checkout in new tab
  ↓
User pays with card/Google Pay/Apple Pay
  ↓
Stripe processes payment
  ↓
User completes payment
  ↓
[Manual step: User clicks "Activate Free Trial" to unlock features]
```

### Ideal Flow (With Backend):
```
User clicks "Subscribe"
  ↓
Opens Stripe Checkout with user ID parameter
  ↓
User completes payment
  ↓
Stripe sends webhook to your backend
  ↓
Backend activates premium for user
  ↓
User is automatically premium ✨
```

---

## Pricing Details

### Stripe Fees
- **2.9% + $0.30** per transaction (US cards)
- **3.9% + $0.30** for international cards
- No monthly fee, no setup fee

### Your Revenue Per User
```
$1.00/month subscription
- $0.03 (2.9% Stripe fee)
- $0.30 (Stripe transaction fee)
= $0.67 net revenue per month

Annual: $8.04 per user
```

### Minimum Viable Pricing
At $1/month, you need minimal users to cover costs:
- 100 users = $67/month = $804/year
- 500 users = $335/month = $4,020/year
- 1,000 users = $670/month = $8,040/year

---

## Test Cards

Use these for testing in Test Mode:

**Success:**
- `4242 4242 4242 4242` - Visa (succeeds)
- `5555 5555 5555 4444` - Mastercard (succeeds)
- `3782 822463 10005` - American Express (succeeds)

**Failures:**
- `4000 0000 0000 0002` - Card declined
- `4000 0000 0000 9995` - Insufficient funds

**All test cards:**
- Expiry: Any future date
- CVC: Any 3 digits
- ZIP: Any 5 digits

Full list: [https://stripe.com/docs/testing](https://stripe.com/docs/testing)

---

## Alternative: Stripe Checkout Session (Advanced)

If you want more control, use Checkout Sessions instead of Payment Links:

**Benefits:**
- Customize success/cancel URLs
- Pass metadata (user ID, email)
- Track conversions better
- More professional

**Requires:**
- Backend server (Node.js, Python, PHP, etc.)
- API endpoint to create checkout session
- Webhook handler

**Implementation:**
```javascript
// premium.js
async function activateGooglePay() {
  // Call your backend to create checkout session
  const response = await fetch('https://yourdomain.com/api/create-checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ priceId: 'price_xxxxxxxxxxxxx' })
  });

  const { url } = await response.json();

  // Redirect to Stripe Checkout
  chrome.tabs.create({ url });
}
```

See: [Stripe Checkout Documentation](https://stripe.com/docs/payments/checkout)

---

## FAQ

**Q: Do I need a business to use Stripe?**
A: No! You can sign up as an individual.

**Q: Can I use Stripe without a website?**
A: Yes! Payment Links work without any website.

**Q: How do I get paid?**
A: Stripe deposits to your bank account every 2 days (after initial 7-day hold).

**Q: What about taxes?**
A: Stripe can handle sales tax automatically (Stripe Tax add-on).

**Q: Can users cancel subscriptions?**
A: Yes, they can manage subscriptions in the Stripe customer portal.

**Q: How do I issue refunds?**
A: In Stripe Dashboard → Payments → Click payment → "Refund"

**Q: What if I want to change the price later?**
A: Create a new payment link with new price. Existing subscribers keep old price.

---

## Current Setup

Right now your extension is configured with:

1. **Free Trial Button**:
   - Activates premium instantly
   - For testing/demo
   - No payment required

2. **Subscribe with Google Pay Button**:
   - Opens Stripe Checkout in new tab
   - Accepts card, Google Pay, Apple Pay
   - Currently shows "not configured" message
   - Will work after you add your Stripe Payment Link

---

## Next Steps

1. ✅ Test free trial button (should work now)
2. 📝 Create Stripe account
3. 🔗 Create payment link
4. ✏️ Add link to premium.js
5. 🧪 Test with Stripe test card
6. 🚀 Go live when ready!

---

**Need Help?**
- Stripe Docs: [https://stripe.com/docs](https://stripe.com/docs)
- Stripe Support: [https://support.stripe.com](https://support.stripe.com)
- Test your setup: Use test mode first!

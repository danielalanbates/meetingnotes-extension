// Minimal Express server for Stripe webhook and session verification
// Deploy to Vercel/Railway/Heroku. Configure environment variables:
// STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET (for webhook signature verification)

const express = require('express');
const bodyParser = require('body-parser');
const Stripe = require('stripe');

const app = express();
app.use(bodyParser.json({ verify: (req, res, buf) => { req.rawBody = buf; } }));

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

if (!STRIPE_SECRET_KEY) {
  console.warn('Warning: STRIPE_SECRET_KEY not set. Some endpoints may not work.');
}

const stripe = Stripe(STRIPE_SECRET_KEY || '');

// Endpoint to verify a Checkout Session ID and return session/payment status
app.post('/verify-session', async (req, res) => {
  const { sessionId } = req.body;
  if (!sessionId) return res.status(400).json({ error: 'sessionId required' });

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    // return minimal data
    return res.json({ id: session.id, paid: !!session.payment_status && session.payment_status === 'paid', session });
  } catch (err) {
    console.error('Error fetching session:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// Webhook endpoint for Stripe events
app.post('/webhook', (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    if (STRIPE_WEBHOOK_SECRET) {
      event = stripe.webhooks.constructEvent(req.rawBody, sig, STRIPE_WEBHOOK_SECRET);
    } else {
      // If webhook secret not set, accept raw body (not secure) - only for dev
      event = req.body;
    }
  } catch (err) {
    console.error('Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      console.log('Checkout session completed:', session.id);
      // Here you would mark the user as premium in your DB using session metadata
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));

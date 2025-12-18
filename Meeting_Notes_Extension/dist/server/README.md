MeetPad server (Stripe webhook & session verification)

This is a tiny Express server intended to be deployed to a lightweight host (Vercel, Railway, Heroku).

Environment variables
- STRIPE_SECRET_KEY: Your Stripe secret key (test or live)
- STRIPE_WEBHOOK_SECRET: The webhook signing secret (optional for local testing, but required for production verification)

Endpoints
- POST /verify-session
  Body: { sessionId: string }
  Response: JSON with session data and paid boolean

- POST /webhook
  Stripe webhook receiver. Verifies signature if STRIPE_WEBHOOK_SECRET is set.

Deploy
- Vercel: create a new project and point to this folder. Set environment variables in the Vercel dashboard.
- Railway: create a new project, use the Express template, set environment variables.

Notes
- For security, always set STRIPE_WEBHOOK_SECRET in production and verify events with stripe.webhooks.constructEvent.
- To activate premium for a user, include an identifier (e.g., chrome extension user id) in the Checkout Session metadata and update your DB upon receiving checkout.session.completed.

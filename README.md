# Elite Store — UPI checkout backend starter

This update adds a Node.js backend, Razorpay Checkout integration and a Supabase order table.

## What works after correct configuration
- Server creates Razorpay orders using server-side package prices.
- Checkout opens with UPI enabled.
- Server-side signature/payment verification endpoint.
- Razorpay webhook verifies HMAC using the exact raw request body and updates paid status.
- Supabase stores order records.
- No customer WhatsApp contact is required.
- Displays the owner-provided UPI QR image and UPI ID `yuvirajput2829@naviaxis` with a copy button.

## What is intentionally NOT live yet
Direct UPI QR payments are **not automatically verified** by the site; the QR section is a manual-payment option only. Verify the recipient in the UPI app before paying and manually reconcile the UTR/reference number. Do not mark an order paid based only on a screenshot.

Automatic Free Fire diamond fulfillment is **not enabled**. No supplier API credentials, regional authorization or product item codes were supplied. The webhook records a verified payment but does not call a supplier. Do not take real customer payments until an authorized supplier is confirmed and the fulfillment adapter is implemented, tested for duplicate requests and refund/error handling.

## Files
- `index.html`, `styles.css`, `app.js`: storefront, checkout UI and UPI QR section
- `assets/upi-qr.jpg`: QR image supplied by the store owner
- `server/index.js`: Express API, Razorpay order creation, signature verification and webhook
- `server/sql/schema.sql`: Supabase orders table
- `.env.example`: environment variables template

## Setup locally
1. Install Node.js 20 or later.
2. Create a Supabase project. Open SQL Editor and run `server/sql/schema.sql`.
3. Create a Razorpay account and use Test Mode keys first. Enable UPI in your account/checkout configuration.
4. Copy `.env.example` to `.env`, then set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY`.
5. Keep `FULFILLMENT_ENABLED=false`. Never expose the Supabase service-role key or Razorpay secret in browser code or Git.
6. In this folder run:
   ```bash
   npm install
   npm start
   ```
7. Open `http://localhost:3000`. Test using Razorpay Test Mode. Do not use real customer funds in test mode.
8. In Razorpay Dashboard, configure a webhook pointing to `https://YOUR_PUBLIC_DOMAIN/api/razorpay-webhook` and subscribe to `payment.captured` and `order.paid`. Use the webhook secret you set in `.env`.
9. Deploy the Node server on a host that supports persistent Node web services and HTTPS, e.g. Render or Railway. Set environment variables in the host dashboard; don't upload `.env`. Set `PUBLIC_BASE_URL` to the final HTTPS origin.
10. Test order creation, cancelled payment, captured payment, duplicate webhook delivery, incorrect amount, and database outage before launch.

## Important payment notes
- Use the server-side order amount. Never accept amount from the browser.
- Payment success UI alone is not proof of payment. Verify the signature and payment status on the server, and use signed webhooks for asynchronous updates.
- UPI app availability/collect features vary by provider and current rules; confirm supported flows in the live Razorpay account.
- Use idempotent supplier requests and a unique supplier order ID before implementing fulfillment.
- Don't make a public endpoint that triggers top-ups based only on a client-provided `payment_success` boolean.

## Automatic supplier adapter
Before implementing this, obtain a supplier's official API docs, API credentials, allowed regions (must include India if selling to Indian players), product/item IDs, player validation process, idempotency support, order-status endpoint and refund rules. Implement the adapter server-side only. The current `FULFILLMENT_ENABLED` flag is intentionally not wired to any provider and must remain false until the adapter is completed and tested.

## Legal / operations
Confirm authorization to resell top-ups and comply with provider, game publisher, payment provider, tax and consumer-protection terms. Add terms, privacy policy, support and refund/cancellation policy before launch. Do not collect game passwords or OTPs.

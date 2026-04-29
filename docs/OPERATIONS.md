# Operations runbook

Everything you (the agency owner) actually do from this dashboard, end-to-end.

## A. Onboard a new contractor (target: under 30 minutes)

1. **Create the customer** — `Admin → Customers → New customer`. Fill business name, contact, **industry/niche**, contact phone, **forwarding phone** (the contractor's real phone), monthly retainer, appointment fee, monthly ad budget. Save.
2. **Spawn the onboarding checklist** — open the customer, **Onboarding** tab, click **Spawn default checklist**. This creates pre-filled prompts for: landing page rebuild, full website rebuild, SEO setup, Google Ads campaigns, Google Business Profile, call tracking, conversion goals, brand assets, domain/DNS access. Each prompt is auto-filled with the customer's businessName, industry, forwardingPhone, monthlyAdBudget.
3. **Provision a tracking number** — same customer page, **Tracking + SMS** tab. Enter area code + forwarding phone, click **Provision number**. With `TWILIO_*` env set, this purchases a Twilio number and points its voice + SMS webhooks at our app. Without Twilio creds, a placeholder number is recorded (simulated mode) — replace later.
4. **Generate the contract** — header has **Generate MSA** → opens a printable, branded master service agreement with the customer's name, fees, and date already filled in. Print → Save as PDF → email to contractor.
5. **Invite the contractor user** — same customer page, **Users** tab. Invite with an initial password. (Optional: send portal invite email via Resend.)
6. **Start the Stripe subscription** — Overview tab → **Start Stripe subscription**. Creates a Product + Price + Subscription on Stripe based on monthly retainer. (Requires `STRIPE_SECRET_KEY`.)
7. **Set Google Ads + Twilio MS settings** — back to Edit. Paste the contractor's Google Ads Customer ID. If using a per-customer Twilio Messaging Service (recommended for A2P 10DLC isolation), paste the MS SID.
8. **Done.** Build their landing page using the **Prompt library** at `/admin/prompts` (copy with one click). Push to Vercel.

## B. New lead arrives

- A POST to `/api/leads` from the landing page form (or a Twilio inbound SMS, or a tracking phone call) creates a `Lead`.
- Automation rules fire (LEAD_CREATED) — e.g. send a welcome SMS template.
- A notification is created in the contractor's portal.
- An email is sent to the contractor (Resend, if configured) with a deep link to the lead.
- An SMS summary is sent to the contractor's forwarding phone if `Notify contractor` is invoked or a rule is configured for it.
- Contractor sees the lead in `/contractor/leads` (mobile bottom-nav). They tap **Call** or **Text** for one-touch contact.

## C. Confirm an appointment + handle billing

- Admin (or contractor via SMS YES) marks the appointment **ACCEPTED** → `isBillable = true`, `disputeWindowEndsAt = now + customer.disputeWindowHours`.
- Contractor has 48 hours to dispute via portal (canned reasons + optional note) or via SMS BAD.
- Admin reviews disputes in `/admin/disputes`. Approve → lead becomes NOT_BILLABLE, appointment fee voided. Reject → lead remains BILLABLE.
- Admin clicks **Approve appointment fee** on the lead. A `BillingRecord` is created with status APPROVED.
- If Stripe is configured: pushes the BillingRecord to a Stripe InvoiceItem. The next invoice will include it. Stripe webhook flips status to PAID.

## D. Monthly close

- 1st of the month: open `/admin/reports` → click each customer → print the **Monthly performance report** to PDF → email it.
- Optional: enable **Smart Retries** in your Stripe Dashboard so failed retainer payments retry automatically.

## E. AI ad recommendations

- Open a customer → **AI ad recos**. Paste the landing page URL + last month's spend / impressions / clicks / conversions → click **Generate recommendations**.
- Claude Haiku reads the landing page, takes the customer's services + service areas + min project size into account, and returns prioritised recommendations grouped by Keywords / Negative keywords / Ad copy / Landing page / Bidding / Targeting.
- Use as a starting point for the next campaign optimisation pass.

## F. The contractor experience

- Mobile-first. Bottom tab bar: **Leads / Appts / Billing / More**.
- Lead cards have **Call** (native dialer) and **Text** (native SMS) buttons.
- Appointment cards have one-tap **Accept** / **Decline**.
- Billing tab shows their retainer + appointment fee history.
- Disputes tab shows their open dispute window (countdown) and lets them file a dispute with canned reasons.

## G. Scaling considerations (for 100+ contractor customers)

- **Neon**: free tier has 191 compute hours and 0.5 GB. Plan to upgrade to Launch ($19/mo) at 10+ active contractors or first 500k leads.
- **Connection pooling**: in Vercel, set `DATABASE_URL` to the **pooled** Neon URL for runtime. Keep the unpooled URL for migrations only (`prisma migrate deploy` from local or a separate `DIRECT_URL`).
- **Webhook idempotency**: every webhook (Twilio CallSid, Twilio MessageSid, Stripe event id, Stripe InvoiceItem id) is uniquely indexed in our DB. Replays are safe.
- **Automation evaluator**: fires after the lead-creation transaction. Failures in one rule don't break the rest.
- **Audit log**: every mutation writes a row in the same transaction. After 1M+ rows, plan to archive older than 12 months to cold storage.
- **Rate limits**: Twilio's per-number throughput is the bottleneck for outbound SMS — provision per-customer Messaging Services so each contractor's brand has its own A2P 10DLC throughput cap.
- **Indexes**: all tenant-scoped models have `(customerId, createdAt)` and the relevant `(customerId, status)` compound indexes. 81 indexes total across 23 tables.

## H. Troubleshooting

- "Twilio not configured" — set `TWILIO_ACCOUNT_SID` + `TWILIO_AUTH_TOKEN` in `.env`. Provision actions still succeed in simulated mode.
- "Stripe not configured" — set `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET`. Until set, billing operates DB-only (no real invoicing).
- "ANTHROPIC_API_KEY not set" — AI ad recos page shows a banner. Set the key to enable.
- Webhook 403 — signature verification failed. Make sure `TWILIO_WEBHOOK_AUTH_TOKEN` (or fallback to `TWILIO_AUTH_TOKEN`) and `STRIPE_WEBHOOK_SECRET` match the values configured in those providers.
- Prisma "model not found" after schema changes — `pnpm prisma generate && pnpm dev` (Next dev caches the client in memory).

# Operations Runbook

Everything the agency owner does from this dashboard, end to end.

## A. Onboard A New Contractor

Target: under 30 minutes once provider accounts are ready.

1. Create the customer at `Admin > Customers > New customer`. Fill business name, contact, industry/niche, contact phone, forwarding phone, fees, monthly ad budget, services, and service areas.
2. Open the onboarding wizard at `/admin/onboarding/[customerId]`. It is created automatically after saving a new customer.
3. Spawn the default checklist. This creates prompts/tasks for landing page, website, SEO, Google Ads, Google Business Profile, call tracking, conversion goals, brand assets, and domain/DNS access.
4. Provision a Twilio tracking number. Enter area code and forwarding phone. With Twilio env vars set, this buys/configures a number; without them it records a simulated placeholder.
5. Generate the Master Service Agreement. Print to PDF and email it to the contractor.
6. Invite the contractor user from the customer Users tab. Send the portal invite email when email is configured.
7. Start the Stripe subscription from the customer Overview tab. This creates the recurring retainer subscription.
8. Paste Google Ads Customer ID and optional per-customer Twilio Messaging Service SID into customer settings.
9. Build/publish the landing page using the prompt library at `/admin/prompts`.

See `docs/CLIENT_ONBOARDING_ACCESS.md` for the account, Google Ads Manager, Google Business Profile, Search Console, domain/DNS, and review-request access playbook.
See `docs/LEAD_VISIBILITY_BILLING_POLICY.md` for the contractor lead visibility and contact-reveal rules.

## B. New Lead Arrives

- A POST to `/api/leads` from the landing page form, a Twilio inbound SMS, or a tracking phone call creates a `Lead`.
- Automation rules fire on `LEAD_CREATED`, and a portal notification/email is sent to the contractor.
- For non-manual leads with a phone number, the portal automatically texts the lead asking for 1-2 availability options.
- When the lead replies, the portal stores the reply as `preferredTime`, creates or updates the `Appointment`, and sends the contractor a proposed-time SMS.
- Contractor replies by SMS: `YES` accepts and starts the billable internal review window; `BUSY` asks the lead for alternatives and notifies admin; `NO` declines; `BAD` flags admin review.
- If a tracking-number call is missed, busy, failed, or canceled, the portal sends an instant missed-call text-back and creates/attaches a phone-call lead.
- Contractor still sees the lead in `/contractor/leads` with one-touch Call and Text actions.
- Full details live in `docs/SMS_APPOINTMENT_WORKFLOW.md`.

## C. Confirm Appointment And Handle Billing

- Admin or contractor via SMS `YES` marks the appointment `ACCEPTED`.
- Accepted appointments become booked appointments and start the internal review window: `now + customer.disputeWindowHours`.
- Contractor can request a review by contacting TLM or replying `BAD` by SMS. This flags the lead for admin review; it does not automatically void billing.
- Admin reviews internal reviews in `/admin/internal reviews`.
- Approved internal review means any appointment fee is voided.
- Rejected internal review means the booked appointment fee remains.
- Admin approves appointment fees from the lead/billing flow.
- If Stripe is configured, approved appointment fees are pushed to Stripe invoice items.

## D. Monthly Close

- On the first business day of each month, open `/admin/reports` and review each customer.
- Send the monthly performance report by email.
- Review pending appointment fees and internal reviews before invoicing.
- Keep Stripe Smart Retries enabled for failed retainer payments.

## E. AI Ad Recommendations

- Open a customer and use the AI ad recommendations screen.
- Paste landing page URL plus spend, impressions, clicks, and conversions.
- Claude returns recommendations grouped by keywords, negative keywords, ad copy, landing page, bidding, and targeting.
- Treat these as a strategist's draft, not an automatic campaign change.

## F. Contractor Experience

- Mobile-first bottom navigation: Leads, Appts, Billing, More.
- Lead cards include Call and Text actions.
- Appointment cards include Accept and Decline actions.
- Billing tab shows retainer and appointment fee history.
- Internal reviews tab shows internal review window countdown and lets the contractor file canned-reason internal reviews.

## G. Scaling Considerations

- Neon: use the pooled URL for Vercel runtime. Use unpooled/direct URL only for migrations if needed.
- Vercel: `vercel.json` runs migrations before build and configures cron routes.
- Webhook idempotency: Twilio CallSid, Twilio MessageSid, Stripe event IDs, and Stripe invoice item IDs must remain unique or replay-safe.
- Automation evaluator: runs after lead creation so one failed automation does not break lead intake.
- Audit log: business mutations should write audit rows in the same transaction when practical.
- SMS throughput: use per-customer Messaging Services and complete A2P 10DLC registration before production volume.
- Indexes: tenant-scoped models should keep `customerId` plus status/date indexes for admin and contractor dashboards.

## H. Vercel Cron Jobs

| Path | Schedule | Purpose | Tier |
| --- | --- | --- | --- |
| `/api/cron/weekly-digest` | `0 13 * * 1` | Weekly performance digest email | Vercel Pro recommended |
| `/api/cron/no-reply-check` | `0 14 * * *` | Contractor no-reply escalation after 24h | Hobby-compatible |
| `/api/cron/monthly-ad-budget` | `0 15 1 * *` | Monthly Google Ads budget confirmation SMS | Requires Twilio for live sends |

Both routes require `Authorization: Bearer ${CRON_SECRET}` in production. Missing `CRON_SECRET` must fail closed in production.

Local dev examples:

```powershell
curl http://localhost:3000/api/cron/weekly-digest
curl http://localhost:3000/api/cron/no-reply-check
curl http://localhost:3000/api/cron/monthly-ad-budget
```

## I. Troubleshooting

- Twilio not configured: set `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN`. Provisioning and SMS can run in simulated mode until then.
- Stripe not configured: set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`. Billing remains DB-only until then.
- Email not configured: set either Resend env vars or SMTP env vars.
- Outlook/GoDaddy email: use Microsoft 365 SMTP or Resend with DNS records on GoDaddy.
- Anthropic not configured: set `ANTHROPIC_API_KEY` for AI recommendations.
- Webhook 403: provider signature verification failed. Check the configured webhook URL and secret/token.
- Prisma client stale after schema edits: run `pnpm prisma generate` and restart dev server.

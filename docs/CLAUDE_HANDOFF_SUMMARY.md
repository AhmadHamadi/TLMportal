# Claude Handoff Summary

Use this as the quick project state before continuing TLM Portal work.

## Current status

- Repo: `C:\Users\ahmad\OneDrive\Desktop\WEBSITES\TLM\TLMportal`
- Branch: `main`
- Latest pushed commit before this handoff: `da77c8f Improve admin portal readiness`
- Stack: Next.js 16 App Router, React 19, TypeScript, Tailwind 4, Prisma 7, Neon Postgres, Auth.js v5, Twilio, Stripe, Resend/SMTP, Anthropic.
- The app builds successfully and the test suite passes.

## Product direction

This is not a generic CRM. It is an agency operations portal for a contractor lead-engine service.

Admin portal is the agency command center:
- customers and packages
- onboarding checklist
- Google Ads customer ID and ad spend
- service areas and services offered
- contractor users
- tracking numbers
- leads, calls, SMS, booked appointments
- internal lead reviews
- billing records
- reports
- contracts
- automation rules
- prompt library
- integration health

Contractor portal should stay very simple:
- overview
- confirmed appointment calendar
- call log
- SMS summary
- settings/password
- Google Ads budget request

Do not re-add contractor billing or dispute navigation unless the user explicitly asks.

## Key business rules

- Show contractors enough lead activity to build trust.
- Keep full contact details gated until a booked/accepted/confirmed opportunity.
- Contractors should not self-void billing through a one-click dispute form.
- Contractor `BAD` SMS replies flag admin review only; they do not automatically remove charges.
- SEO/GBP should use a flat `$750/month` model, not pay-per-appointment.
- Google Ads budget minimum is `700` in CAD or USD.
- Google Ads ad spend is paid directly by the client to Google; TLM tracks/manages it.

## Important workflows

Lead/SMS flow:
1. Lead submits form or calls/texts tracking number.
2. Portal creates/attaches a lead.
3. Portal texts lead asking for 1-2 availability options.
4. Lead reply updates preferred time and sends contractor a constrained SMS.
5. Contractor replies `YES`, `BUSY`, `NO`, or `BAD`.
6. `YES` creates/accepts a booked appointment and unlocks full contact details.
7. Missed calls trigger instant text-back.

Monthly ad budget flow:
- Contractor can request keep/increase/decrease/change from the portal.
- Request creates an admin notification.
- `/api/cron/monthly-ad-budget` texts active Google Ads clients on the first of each month.
- Admin still updates Google Ads manually until API integration is added.

Admin onboarding flow:
1. Create customer.
2. Select service packages.
3. Add pricing, ad budget, services, service areas.
4. Spawn onboarding checklist.
5. Provision Twilio tracking number.
6. Invite contractor user.
7. Generate/send MSA.
8. Start Stripe subscription.
9. Add Google Ads CID and GBP/domain/DNS notes.

## Production readiness notes

Vercel is appropriate for hosting the app.

Required env:
- `DATABASE_URL`
- `AUTH_SECRET`
- `APP_URL`
- `CRON_SECRET`

Provider env:
- Twilio: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, optional `TWILIO_MESSAGING_SERVICE_SID`, optional `TWILIO_WEBHOOK_AUTH_TOKEN`
- Stripe: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- Email: either Resend or SMTP/Microsoft 365
- AI: `ANTHROPIC_API_KEY`

For Outlook/GoDaddy email:
- Use Microsoft 365 SMTP if sending from the Outlook mailbox.
- Or use Resend and add DNS records in GoDaddy.

## What is intentionally manual for now

These should stay manual until the workflows are proven:
- Google Ads API budget changes and reporting sync
- Google Business Profile API connection
- call recording/transcription
- fully automated Stripe appointment-fee invoicing
- uploaded contract file storage
- advanced AI parsing of open-ended SMS replies

## Validation commands

Run before handing work back:

```powershell
pnpm prisma validate
pnpm lint
pnpm test -- --run
pnpm build
git diff --check
```

## Last verified

Fresh verification passed:
- Prisma schema valid
- lint passed
- 15 test files passed
- 53 tests passed
- production build passed
- working tree was clean before this handoff update

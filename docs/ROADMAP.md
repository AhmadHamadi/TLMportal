# Roadmap

This document tracks what has shipped and what should happen next. The original instruction was to build database -> admin dashboard -> customers -> leads -> contractor dashboard -> Twilio -> Stripe. That sequence has now been completed.

## Shipped
- Phase 0: Next.js bootstrap, Tailwind, shadcn/ui, env validation.
- Phase 1: Prisma schema, migrations, seed data.
- Phase 2: Auth.js v5, role proxy, admin and contractor shells.
- Phase 3: Customer CRUD, service areas, services, contractor user invite.
- Phase 4: Lead CRUD, filters, detail page, activity timeline, manual SMS.
- Phase 5: Contractor mobile dashboard, leads, appointments, billing, disputes.
- Phase 6: Twilio voice/SMS webhooks, call forwarding, outbound SMS, contractor YES/NO/BUSY/BAD handling.
- Phase 7: Stripe customers, subscriptions, invoice items, payment webhook sync.
- Phase 8: Automation rules with allowlisted SMS templates and no-reply trigger.
- Phase 9: Manual Google Ads spend and monthly reports.
- Additional: onboarding checklist, prompt library, contract templates, AI ad recommendations, Resend emails, Vercel cron, production docs.

## Current Hardening Checkpoints
- Tenant isolation tests must pass, including customer filter override checks.
- Cron routes must fail closed in production when `CRON_SECRET` is missing.
- Email templates must escape user-controlled values.
- Vercel build must run migrations before `next build`.
- `.env.example` must reflect production-required variables.

## Next Recommended Work
1. Add password reset and invite-token flow before onboarding real clients.
2. Add Playwright smoke tests for admin login, contractor login, lead detail, appointment accept, and dispute filing.
3. Add Google Ads API integration after manual spend workflow is stable.
4. Add Vercel Blob or S3 storage for signed contract PDFs.
5. Add call recording/transcription only after legal disclosure and consent language is ready.
6. Add admin-facing integration health checks for Twilio, Stripe, Resend, Anthropic, and Neon.

## Do Not Regress
- Do not let contractor filters override `customerId` scope.
- Do not run Twilio/Stripe/AI code from client components.
- Do not insert unescaped lead/customer text into HTML emails.
- Do not make cron routes public in production.
- Do not store money as Float.

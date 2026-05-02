# TLM Portal

Agency operations dashboard for Trade Leads.

Roles:
- Admin: agency owner/operator with full visibility across all contractor customers.
- Contractor: customer user who can access only assigned customer data.

## Stack
Next.js 16 App Router, React 19, TypeScript, Tailwind 4, shadcn/ui, Prisma 7 + PostgreSQL (Neon), Auth.js v5, Zod, Twilio, Stripe, Resend, and optional Anthropic AI.

## Prerequisites
- Node 22+
- pnpm 10+
- A Postgres database; Neon is recommended.

## Setup
1. Copy `.env.example` to `.env` and fill in `DATABASE_URL` and `AUTH_SECRET`.
2. Run `pnpm install`.
3. Run `pnpm db:migrate` to create the schema.
4. Run `pnpm db:seed` to load sample admin, contractors, customers, leads, appointments, billing, and ad spend.
5. Run `pnpm dev` and open `http://localhost:3000`.

## Scripts
- `pnpm dev`: Next.js dev server.
- `pnpm build`: production build.
- `pnpm start`: production server.
- `pnpm lint`: ESLint.
- `pnpm test`: Vitest.
- `pnpm db:generate`: generate Prisma client.
- `pnpm db:migrate`: run Prisma migrate dev.
- `pnpm db:push`: push schema without a migration.
- `pnpm db:studio`: open Prisma Studio.
- `pnpm db:seed`: seed local/sample data.

## Seed Credentials
- Admin: `admin@tlm.local` / `admin-dev-password`
- Atlas Concrete: `anthony@atlasconcrete.example` / `contractor-dev-password`
- Northside Interlock: `marcus@northsideinterlock.example` / `contractor-dev-password`

## Project Docs
- `AGENTS.md`: agent handoff rules for Claude, Codex, and future agents.
- `CLAUDE.md`: durable project brief.
- `docs/ARCHITECTURE.md`: current architecture.
- `docs/DATA_MODEL.md`: Prisma data model notes.
- `docs/ROADMAP.md`: shipped phases and future work.
- `docs/CONVENTIONS.md`: coding, validation, auth, and testing rules.
- `docs/OPERATIONS.md`: agency runbook.
- `docs/EMAIL_SETUP.md`: GoDaddy, Outlook/Microsoft 365, Resend, SPF, DKIM, DMARC setup.
- `docs/COMPETITIVE_REVIEW.md`: comparison against GHL, ServiceTitan, Jobber, and Housecall Pro.
- `docs/TLM_EXPERT_BRAIN_PROMPTS.md`: prompt/source map for NotebookLM, ChatGPT Projects, and Claude Projects.

## Shipped Scope
- Auth, role routing, admin dashboard, contractor dashboard.
- Customer CRUD, lead CRUD, appointments, disputes, billing, ad spend.
- Twilio voice/SMS webhooks and outbound SMS.
- Stripe customer/subscription/invoice item workflow.
- Automation rules, no-reply cron, weekly digest cron.
- Contractor mobile UI with bottom nav and one-tap call/text.
- Onboarding checklist, contracts, prompt library, monthly reports.
- Resend email notifications and optional Anthropic AI ad recommendations.

## Deploy On Vercel
1. Push this repo to GitHub and import it into Vercel.
2. Set the Vercel framework preset to Next.js.
3. `vercel.json` runs migrations and build with `pnpm prisma migrate deploy && pnpm prisma generate && pnpm next build`.
4. Set environment variables in Vercel:
   - `DATABASE_URL`: Neon pooled URL with `sslmode=verify-full`.
   - `AUTH_SECRET`: generate with `openssl rand -base64 32`.
   - `APP_URL`: canonical deployed URL.
   - `CRON_SECRET`: generate with `openssl rand -hex 32`; required in production.
   - `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, optional `TWILIO_MESSAGING_SERVICE_SID`, optional `TWILIO_WEBHOOK_AUTH_TOKEN`.
   - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
   - Email via Resend: `EMAIL_PROVIDER=resend`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`.
   - Email via Outlook SMTP: `EMAIL_PROVIDER=smtp`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM_EMAIL`.
   - `ANTHROPIC_API_KEY` if AI ad recommendations should run.
5. Configure Twilio tracking number webhooks:
   - Voice URL: `https://<your-domain>/api/webhooks/twilio/voice`
   - SMS URL: `https://<your-domain>/api/webhooks/twilio/sms`
6. Configure Stripe webhook endpoint:
   - URL: `https://<your-domain>/api/webhooks/stripe`
   - Events: `customer.subscription.*`, `invoice.paid`, `invoice.payment_succeeded`, `invoice.payment_failed`.

## Validation
Run before pushing meaningful changes:

```powershell
pnpm test -- --run
pnpm lint
pnpm prisma validate
pnpm build
```

Current validation status: tests, lint, Prisma validate, and production build pass.

## Production Notes
- Vercel can host this app well. Neon is a good fit for the database; use the pooled runtime URL.
- Vercel Hobby supports daily cron frequency. The no-reply check is daily by default; increase it to hourly only if the project is on Vercel Pro.
- Twilio, Stripe, Resend, and Anthropic can stay unset in local/dev where the app supports simulated behavior, but real production workflows require provider keys.
- Before onboarding real clients, add a password reset/invite-token flow and run a browser smoke test through admin and contractor workflows.

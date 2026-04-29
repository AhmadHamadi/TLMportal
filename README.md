# TLM Portal

Agency operations dashboard for Trade Leads Marketing. Two roles:
- **Admin** (agency) — full visibility across all contractor customers.
- **Contractor** — sees only their own leads, calls, SMS, appointments, billing.

## Stack
Next.js 16 App Router · TypeScript · Tailwind · shadcn/ui · Prisma 7 + PostgreSQL (Neon) · Auth.js v5 · Zod. Stripe and Twilio land in later phases.

## Prerequisites
- Node 22+
- pnpm 10+
- A Postgres database — Neon recommended (free tier works)

## Setup
1. `cp .env.example .env` and fill in `DATABASE_URL` and `AUTH_SECRET` (`openssl rand -base64 32`).
2. `pnpm install`
3. `pnpm db:migrate` — creates the schema (will create `prisma/migrations/` on first run).
4. `pnpm db:seed` — loads sample admin + 2 contractor companies + 20 leads.
5. `pnpm dev` — http://localhost:3000

## Scripts
- `pnpm dev` — Next.js dev server
- `pnpm build` / `pnpm start` — production build/run
- `pnpm lint` — ESLint
- `pnpm test` — Vitest
- `pnpm db:generate` / `db:migrate` / `db:push` / `db:studio` / `db:seed`

## Seed credentials
- Admin: `admin@tlm.local` / `admin-dev-password`
- Atlas Concrete: `anthony@atlasconcrete.example` / `contractor-dev-password`
- Northside Interlock: `marcus@northsideinterlock.example` / `contractor-dev-password`

## Project docs
- [`CLAUDE.md`](./CLAUDE.md) — durable project brief and architecture rules
- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — folder layout
- [`docs/DATA_MODEL.md`](./docs/DATA_MODEL.md) — Prisma schema spec
- [`docs/ROADMAP.md`](./docs/ROADMAP.md) — phased build with checkpoints
- [`docs/CONVENTIONS.md`](./docs/CONVENTIONS.md) — code/auth/validation rules

## Phase status
- [x] Phase 0 — bootstrap, deps, shadcn
- [x] Phase 1 — Prisma schema + seed
- [x] Phase 2 — Auth.js v5 + admin shell
- [x] Phase 3 — Customers CRUD (industry, MSSID, Google Ads CID)
- [x] Phase 4 — Leads CRUD with timeline
- [x] Phase 5 — Contractor dashboard (mobile-first, bottom nav, card cells)
- [x] Phase 6 — Twilio (voice + SMS webhooks, contractor YES/NO/BUSY/BAD)
- [x] Phase 7 — Stripe (subscriptions, invoice items)
- [x] Phase 8 — Automation rules (allowlisted templates)
- [x] Phase 9 — Google Ads spend manual entry
- [x] Onboarding checklist + prompts (landing rebuild, full site, SEO, ads, GBP)
- [x] Contracts per client (URL-based; Vercel Blob upload is a future swap)

## Deploy on Vercel

1. Push to GitHub (already pointed at https://github.com/AhmadHamadi/TLMportal).
2. Import the repo into Vercel — `vercel.json` pins `framework: nextjs`,
   region `iad1`, and a build command that runs `prisma generate` first.
3. Set environment variables in the Vercel project settings:
   - `DATABASE_URL` (Neon pooled URL is fine for runtime, but set
     `DIRECT_URL` later if you switch migrations to use the unpooled URL)
   - `AUTH_SECRET` — `openssl rand -base64 32`
   - `APP_URL` — `https://your-domain.com`
   - `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`,
     `TWILIO_MESSAGING_SERVICE_SID` (optional, can override per-customer),
     `TWILIO_WEBHOOK_AUTH_TOKEN` (optional, falls back to AUTH_TOKEN)
   - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
     `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
4. Configure provider webhooks to point at your deployed URL:
   - **Twilio**: on each tracking number, set Voice URL and SMS URL to
     `https://<your-domain>/api/webhooks/twilio/voice` and `/sms`
   - **Stripe**: add a webhook endpoint at `https://<your-domain>/api/webhooks/stripe`
     for events `customer.subscription.*`, `invoice.paid`,
     `invoice.payment_succeeded`, `invoice.payment_failed`
5. Run the migration once on Vercel's Neon connection:
   `pnpm prisma migrate deploy` (Vercel does this on every deploy via the
   `buildCommand` if you swap `prisma generate` for `prisma migrate deploy && prisma generate`).

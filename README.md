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
- [x] Phase 1 — Prisma schema + seed (run `pnpm db:migrate` once DATABASE_URL is set)
- [ ] Phase 2 — Auth.js v5 + admin shell
- [ ] Phase 3 — Customers CRUD
- [ ] Phase 4 — Leads CRUD
- [ ] Phase 5 — Contractor dashboard (read-only)
- [ ] Phase 6 — Twilio
- [ ] Phase 7 — Stripe

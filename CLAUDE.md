# TLM Portal — Claude project instructions

This file is the durable brief for Claude Code sessions on the TLM agency portal.
Read this before doing anything in this directory.

## What this app is
An agency operations dashboard for Trade Leads Marketing. Two roles:
- **Admin** (agency owner) — full visibility across all contractor customers.
- **Contractor** (customer) — sees only their own leads, calls, SMS, appointments, billing.

The product is a lead tracking + appointment confirmation + contractor-facing
dashboard + billing operations system. It is not a generic CRM.

## Stack
- Next.js 15 App Router, TypeScript, Tailwind, shadcn/ui
- Prisma + PostgreSQL (Neon, unless changed)
- Auth.js v5 (NextAuth), Credentials provider, argon2id password hashing
- Zod for env, forms, server-action input, webhook payloads
- Stripe (Phase 3), Twilio (Phase 2) — stubs only until those phases
- pnpm, Vercel deploy

## Repo
TLMportal lives at `C:\Users\ahmad\OneDrive\Desktop\WEBSITES\TLM\TLMportal`.
It is a separate project from the marketing site at `TLM/` (Vite). Treat them as
two distinct apps with their own deploys.

## Architecture rules — read every session
1. **Tenant boundary is `customerId`.** Every contractor-scope query MUST go
   through `lib/auth-guard.ts#scopeToCustomer(session)`. Admins bypass.
   Middleware enforces routing; auth-guard enforces data access.
2. **Server action vs server service split.**
   - Actions in `server/actions/*` are thin: parse input with Zod → check auth
     → call a service → `revalidatePath`. No business rules in actions.
   - Services in `server/services/*` are pure-ish business logic, return plain
     data, take a `db` and a `scope` argument. Unit-testable.
3. **No business logic in components.** Components render. Server components
   fetch via services or read-only Prisma calls behind `auth-guard`.
4. **Money is `Decimal`.** Never `Float`. Serialize to string at the API edge.
5. **Phone numbers are E.164.** Normalize on write, never on display.
6. **Soft-delete `Customer` and `Lead`.** `deletedAt: DateTime?`. All queries
   filter `deletedAt: null` by default. Hard delete only via a dedicated admin
   action with audit log.
7. **Webhooks verify signatures.** Twilio `X-Twilio-Signature`, Stripe
   `Stripe-Signature`. Reject before doing any work.
8. **All mutations write `AuditLog`.** Action, entity, who, when, before/after.

## Build order — do not skip ahead
1. Prisma schema + migrations + seed
2. Auth.js v5 + admin shell + role guards
3. Customers CRUD (admin)
4. Leads CRUD (admin) + lead detail page
5. Contractor dashboard read-only views
6. **STOP. Verify with the user.**
7. Twilio integration (calls, SMS, contractor YES/NO/BUSY/BAD)
8. Stripe (subscriptions, billing records, manual appointment-fee approval)
9. Automation rules
10. Google Ads (manual entry first, API later)

Do **not** pre-build Twilio or Stripe surfaces in Phase 1. Stub the modules so
imports type-check; that's it.

## Conventions
- See `docs/CONVENTIONS.md` for code style, validation, error handling.
- See `docs/DATA_MODEL.md` for the schema spec.
- See `docs/ROADMAP.md` for phase deliverables and checkpoints.
- See `docs/ARCHITECTURE.md` for folder layout and module responsibilities.

## Things that will get this project in trouble — avoid
- Building Twilio/Stripe before the data model is stable.
- Putting business rules in components or actions instead of services.
- Skipping the `customerId` scope on contractor queries.
- Using `Float` for money.
- Adding fields to Prisma without a migration.
- Letting AI-drafted SMS promise prices, discounts, warranties, or specific
  appointment times. Templates only, with admin-configured variables.

## When to ask vs proceed
- Schema or auth changes that affect tenant isolation → ask.
- New external integration (Twilio, Stripe, Google Ads) → ask.
- Routine UI work, CRUD pages following the established patterns → proceed.

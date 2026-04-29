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

## Build order — already shipped
All phases through 9 are live. The system in production includes:
- Auth (Auth.js v5, Credentials, argon2id), role-based middleware, tenant scoping
- Admin: customers, leads, appointments, calls, SMS, billing, disputes, ad spend,
  tracking numbers, automation rules, prompt library, contract templates,
  monthly reports, AI ad recommendations
- Contractor (mobile-first): bottom-tab nav, card-based lead/appointment lists,
  one-tap call/text, dispute filing with 48h window, billing summary
- Twilio: real client + signature-verified webhooks, contractor YES/NO/BUSY/BAD
- Stripe: real client + customer/subscription/invoice items + webhook
- Resend email: portal invite + new-lead alert
- Anthropic Claude: AI ad recommendations (reads landing page + ad metrics)
- Onboarding checklist (auto-spawn defaults), per-client contract auto-fill
- 39 tests pass (Vitest); ESLint + tsc + next build clean

When all `*_API_KEY` env vars are missing, the integrations are simulated (no-op)
so the app keeps working. Set them in Vercel to go live.

## Future work
- Cron for `CONTRACTOR_NO_REPLY_24H` automation trigger (Vercel Cron)
- Real Google Ads API integration (replace manual spend entry)
- Vercel Blob storage for contract PDFs (replace URL-based uploads)
- Per-call recording + transcription (Twilio Voice Intelligence or AssemblyAI)

## Conventions
- See `docs/CONVENTIONS.md` for code style, validation, error handling.
- See `docs/DATA_MODEL.md` for the schema spec.
- See `docs/ROADMAP.md` for phase deliverables and checkpoints.
- See `docs/ARCHITECTURE.md` for folder layout and module responsibilities.
- See `docs/OPERATIONS.md` for the agency runbook (onboard contractor,
  monthly close, scaling guidance).

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

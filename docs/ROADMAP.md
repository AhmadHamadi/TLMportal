# Roadmap

Phases are sequential. Do not start phase N+1 until phase N's checkpoint is signed off.

## Phase 0 — Project bootstrap
- `pnpm create next-app` (TS, Tailwind, App Router, no `src/`)
- Install: `prisma @prisma/client zod next-auth@beta @auth/prisma-adapter argon2 lucide-react clsx tailwind-merge class-variance-authority`
- Install dev: `tsx eslint-config-next prettier prettier-plugin-tailwindcss vitest @types/node`
- Initialize shadcn/ui (`pnpm dlx shadcn@latest init`); add: `button card input label select textarea dialog dropdown-menu badge table tabs sheet form toast alert separator avatar`
- Configure `lib/env.ts` with Zod-validated env (DATABASE_URL, AUTH_SECRET, APP_URL stubs only)
- `.env.example` from the user's spec

**Checkpoint:** `pnpm dev` boots, `/` renders a placeholder, env validation runs.

## Phase 1 — Database
- Write `prisma/schema.prisma` per `docs/DATA_MODEL.md`
- `prisma migrate dev --name init`
- `prisma/seed.ts` per the seed plan
- `pnpm prisma db seed` succeeds

**Checkpoint:** Prisma Studio shows the seeded data; migrations folder committed.

## Phase 2 — Auth + admin shell
- Auth.js v5 config in `lib/auth.ts` with Credentials provider + Prisma adapter
- argon2id password hashing in `lib/password.ts`
- `middleware.ts` redirects unauthenticated → `/login`, contractor → `/contractor`, admin → `/admin`
- `lib/auth-guard.ts` with `requireAdmin`, `requireContractor`, `scopeToCustomer`, `withTenantWhere`
- `app/(auth)/login/page.tsx` form, server action that signs in
- `app/admin/layout.tsx` shell: sidebar + topnav + role badge
- `app/contractor/layout.tsx` simpler shell

**Checkpoint:** Login as admin → lands on `/admin`. Login as contractor → lands on `/contractor`. Direct nav to `/admin/*` as contractor → 403.

## Phase 3 — Customers CRUD
- `server/services/customers.ts`: list, get, create, update, soft-delete
- `server/actions/customers.ts`: thin wrappers
- `schemas/customer.ts`: Zod
- `app/admin/customers/page.tsx`: DataTable with filters (status, search)
- `app/admin/customers/new/page.tsx`: create form
- `app/admin/customers/[customerId]/edit/page.tsx`: update form
- `app/admin/customers/[customerId]/page.tsx`: detail with tabs (Overview / Services / Service Areas / Users)
- Sub-CRUD: services, service areas, customer users (invite)

**Checkpoint:** Admin can create, edit, soft-delete a customer. Customer detail shows seeded data correctly.

## Phase 4 — Leads CRUD + lead detail
- `server/services/leads.ts`: list (filterable), get, create (manual), update status, soft-delete, dedupe-hash on write
- `app/admin/leads/page.tsx`: DataTable filters (customer, source, status, billable, date range)
- `app/admin/leads/[leadId]/page.tsx`: lead detail with `LeadEventTimeline`, status changer, manual SMS placeholder, billable toggle
- `app/admin/leads/new/page.tsx`: manual entry form
- Status transitions are validated server-side against an allowed-transitions map

**Checkpoint:** Admin can list, filter, create, view, and change status on leads. Status changes append `LeadEvent` rows.

## Phase 5 — Contractor dashboard (read-only)
- `app/contractor/page.tsx`: overview cards (leads this month, calls, confirmed/billable appointments, est. charges, ad spend)
- `app/contractor/leads/page.tsx`: simplified, scoped to customer
- `app/contractor/leads/[leadId]/page.tsx`: read + a couple of status updates (won/lost/quoted/no-show)
- `app/contractor/appointments/page.tsx`: list + accept/decline buttons
- `app/contractor/billing/page.tsx`: monthly summary
- `app/contractor/disputes/page.tsx`: list + open-dispute action (48h window enforced server-side)

**Checkpoint:** Contractor user only sees their customer's data, confirmed by a manual cross-check (try accessing another customer's URL).

## Phase 5.5 — STOP. Verify with user.
Before any external integration. Walk through every screen, confirm tenant
isolation, confirm seed data shows everything correctly. Get explicit go-ahead.

## Phase 6 — Twilio
- `lib/twilio.ts` real implementation
- Buy/assign tracking number (admin action)
- `app/api/webhooks/twilio/voice/route.ts` — log call, return TwiML to forward to contractor
- `app/api/webhooks/twilio/sms/route.ts` — log inbound SMS; if contractor reply (`YES`/`NO`/`BUSY`/`BAD`) advance state machine
- Outbound SMS function used by lead-confirmation and contractor-summary flows
- Signature verification + idempotency on webhooks

## Phase 7 — Stripe
- `lib/stripe.ts` real implementation
- Stripe customer creation when admin activates a Customer
- Subscription creation for monthly retainer
- Manual approval flow for `APPOINTMENT_FEE` BillingRecords → invoice item
- `app/api/webhooks/stripe/route.ts` — sync subscription status, payment success/failure

## Phase 8 — Automation rules
- `AutomationRule` evaluator
- Triggers: `LEAD_CREATED`, `APPOINTMENT_CONFIRMED`, `CONTRACTOR_NO_REPLY_24H`
- Actions: `SEND_SMS`, `NOTIFY_ADMIN`, `MARK_FOR_REVIEW`
- Admin UI to configure rules per customer

## Phase 9 — Google Ads
- Manual `GoogleAdsSpend` entry (already in schema)
- Later: Google Ads API integration for impressions, clicks, conversions
- Monthly performance report per contractor

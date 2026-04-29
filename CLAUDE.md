# TLM Portal - Project Instructions

This is the durable brief for Claude/Codex sessions on the Trade Leads Marketing agency portal.

## Product
TLM Portal is an agency operations system for a contractor lead-engine service. It is not a generic CRM. It tracks customers, leads, calls, SMS, appointments, disputes, billing, ad spend, onboarding, contracts, reports, and integration health.

Roles:
- Admin: agency owner/operator with access to all customers and operations.
- Contractor: customer user who can access only assigned customer data.

## Stack
- Next.js 16 App Router, React 19, TypeScript, Tailwind 4, shadcn/ui.
- Prisma 7 + PostgreSQL, with Neon recommended for hosting.
- Auth.js v5 Credentials auth with argon2id password hashing.
- Zod for env, forms, server actions, and webhook payloads.
- Twilio for tracking numbers, call forwarding, inbound SMS, outbound SMS, and contractor YES/NO/BUSY/BAD replies.
- Stripe for customers, subscriptions, invoice items, and payment webhooks.
- Resend for portal invites and lead/digest emails.
- Anthropic for optional AI Google Ads recommendations.
- pnpm and Vercel.

## Architecture Rules
1. Tenant boundary is `customerId`. Contractor access must be enforced server-side using `scopeToCustomer(ctx, customerId)` or `withTenantWhere(ctx)`. User-supplied filters must never override tenant scope.
2. Server actions stay thin: auth -> parse with Zod -> call service -> revalidate/redirect. No business rules in actions.
3. Services own business logic and Prisma access. They should be testable without React/request context.
4. Components render and handle interaction only. Avoid Prisma access in components unless the query is trivial and already scoped.
5. Money uses Prisma `Decimal`, never Float.
6. Phone numbers are stored as E.164 and formatted only for display.
7. `Customer` and `Lead` use soft delete via `deletedAt`.
8. Twilio and Stripe webhooks must verify signatures before DB work.
9. Cron routes must require `CRON_SECRET` in production.
10. Mutations should write `AuditLog` rows in the same transaction where practical.

## Current Build Status
Implemented areas:
- Auth, proxy, admin shell, contractor shell.
- Customers CRUD, services, service areas, contractor user invite.
- Leads CRUD, lead detail, timelines, manual SMS, contractor notifications.
- Appointments, accept/decline, billable state, dispute window.
- Disputes, admin review, billing state changes.
- Twilio voice and SMS webhooks, SMS parser, simulated mode when credentials are absent.
- Stripe customer/subscription/invoice item actions and webhook handling.
- Automation rules with allowlisted template variables.
- Manual Google Ads spend, reports, onboarding checklist, contracts, prompt library, AI ad recommendations, Resend emails.
- Tests for auth guard, leads isolation, appointments/disputes, billing evaluation, automation, SMS parser, phone handling.

## Production Environment
Required:
- `DATABASE_URL`
- `AUTH_SECRET`
- `APP_URL`
- `CRON_SECRET`

Provider-specific:
- Twilio: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, optional `TWILIO_MESSAGING_SERVICE_SID`, optional `TWILIO_WEBHOOK_AUTH_TOKEN`.
- Stripe: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
- Email via Resend: `EMAIL_PROVIDER=resend`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`.
- Email via Outlook/Microsoft 365 SMTP: `EMAIL_PROVIDER=smtp`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM_EMAIL`.
- AI: `ANTHROPIC_API_KEY`.

Use Neon pooled URL for Vercel runtime and prefer `sslmode=verify-full`.

## Validation Commands
Run after meaningful changes:

```powershell
pnpm test -- --run
pnpm lint
pnpm build
```

For schema changes:

```powershell
pnpm prisma migrate dev --name <short_name>
pnpm prisma generate
pnpm db:seed
```

## Files to Read Before Major Changes
- `AGENTS.md`
- `docs/OPERATIONS.md`
- `docs/ARCHITECTURE.md`
- `docs/DATA_MODEL.md`
- `docs/CONVENTIONS.md`
- `prisma/schema.prisma`
- `lib/auth-guard.ts`
- `lib/env.ts`

## SMS Appointment Workflow
Read docs/SMS_APPOINTMENT_WORKFLOW.md before changing appointment SMS behavior. The intended loop is: lead availability request -> lead availability reply -> contractor YES/BUSY/NO/BAD -> confirmation or reschedule -> reminders. Keep this deterministic and fully logged before adding AI.

## AI And MCP Opportunities
Read docs/AI_MCP_OPPORTUNITIES.md before adding AI features, browser testing, MCP integrations, or new sellable service ideas. AI can summarize, recommend, and draft, but billing/dispute decisions stay deterministic and admin-reviewed.

## Client Onboarding Access
Read docs/CLIENT_ONBOARDING_ACCESS.md before changing contractor account setup, Google Ads, Google Business Profile, Search Console, domain/DNS, or review-request workflows.

## Known Future Work
- Real Google Ads API integration to replace manual spend entry.
- Vercel Blob or other storage for uploaded/signed contracts.
- Call recording and transcription, if legally approved and disclosed.
- Stronger password reset/invite flow before production client rollout.
- Optional Playwright smoke tests for admin and contractor dashboards.

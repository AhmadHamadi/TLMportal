# Agent Handoff - TLM Portal

Read this before changing code in this repo. This file is for Codex, Claude, and any future agent working on the portal.

## Current Reality
- This is a separate Next.js App Router project at `C:\Users\ahmad\OneDrive\Desktop\WEBSITES\TLM\TLMportal`.
- The parent `TLM/` folder is the marketing site. Do not edit it unless the user explicitly asks.
- Stack: Next.js 16, React 19, TypeScript, Tailwind 4, shadcn/ui, Prisma 7, Neon Postgres, Auth.js v5, Twilio, Stripe, Resend, Anthropic.
- Use `pnpm`, not npm.

## Non-Negotiables
- Tenant boundary is `customerId`. Any contractor-facing read or write must go through `scopeToCustomer(ctx, customerId)` or `withTenantWhere(ctx)` without allowing user filters to override scope.
- Admin-only mutations must call `requireAdmin()` before validation or DB writes.
- Contractor/admin shared mutations must call `requireAuth()` and then scope the target record server-side.
- Do not expose secrets to client components. Read secrets only through `lib/env.ts` in server-only modules.
- Money stays `Decimal` in Prisma and is formatted at the edge/UI. Never use Float for money.
- Phone numbers are E.164 on write and formatted for display.
- Webhooks must verify provider signatures before any database work.
- Cron routes must fail closed in production when `CRON_SECRET` is missing.
- Every business mutation should write an `AuditLog` row in the same transaction where practical.

## Architecture Pattern
- `app/*`: route segments and server components.
- `components/*`: rendering and client interaction only.
- `schemas/*`: Zod validation shared by forms and server actions.
- `server/actions/*`: thin boundary: auth, parse input, call service, revalidate/redirect.
- `server/services/*`: business rules and Prisma access.
- `lib/*`: provider clients, env, auth helpers, formatting helpers.
- `prisma/schema.prisma`: source of truth for data model.

## Validation Commands
Run these after meaningful changes:

```powershell
pnpm test -- --run
pnpm lint
pnpm build
```

If Prisma schema changes:

```powershell
pnpm prisma migrate dev --name <short_name>
pnpm prisma generate
pnpm db:seed
```

## Vercel/Production Checklist
- `DATABASE_URL`: Neon pooled Postgres URL with `sslmode=verify-full`.
- `AUTH_SECRET`: at least 32 chars.
- `APP_URL`: canonical deployed URL, for example `https://portal.tradeleadsmarketing.com`.
- `CRON_SECRET`: required in production.
- Twilio: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, optional `TWILIO_MESSAGING_SERVICE_SID`, optional `TWILIO_WEBHOOK_AUTH_TOKEN`.
- Stripe: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
- Email via Resend: `EMAIL_PROVIDER=resend`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`.
- Email via Outlook/Microsoft 365 SMTP: `EMAIL_PROVIDER=smtp`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM_EMAIL`.
- Anthropic: `ANTHROPIC_API_KEY` only if AI ad recommendations should run.

## SMS Appointment Workflow
- Read docs/SMS_APPOINTMENT_WORKFLOW.md before changing Twilio, lead intake, appointment, reminder, or automation code.
- Preserve webhook idempotency: duplicate Twilio MessageSid values must not repeat SMS sends, appointment transitions, billing changes, or dispute creation.
- Contractor SMS replies are intentionally constrained to YES, BUSY, NO, and BAD. Do not replace this with open-ended AI parsing until deterministic tests and admin fallback exist.
- Niche-specific wording belongs in customer configuration/templates, not hardcoded into webhook route handlers.

## AI And MCP Opportunities
- Read docs/AI_MCP_OPPORTUNITIES.md before adding AI features, browser testing, MCP integrations, or new sellable service ideas.
- AI should assist admins and contractors, not silently make billing/dispute decisions.
- Browser/Playwright MCP is most useful for mobile contractor smoke tests and admin onboarding smoke tests.

## Client Onboarding Access
- Read docs/CLIENT_ONBOARDING_ACCESS.md before changing contractor account setup, Google Ads, Google Business Profile, Search Console, domain/DNS, or review-request workflows.
- Contractor portal accounts may be created by admin during onboarding, but passwords must be temporary and users must be able to change them.
- Read docs/CLIENT_SETUP_PLAYBOOK.md before changing setup flows for landing pages, Google Ads manager access, GBP, Twilio tracking numbers, contractor dashboard summaries, or ad budget request workflows.

## Lead Visibility And Billing
- Read docs/LEAD_VISIBILITY_BILLING_POLICY.md before changing contractor lead lists, lead detail pages, appointment billing, call tracking, or contact reveal rules.
- Contractors should see all lead records for transparency, but full phone/email/address should remain gated until a confirmed/accepted opportunity.
- Contractors should not be able to self-void billing with a direct dispute form. Review requests are admin-reviewed before billing changes.
- Contractor portal should stay simple: overview, appointment calendar, call log, SMS summary, settings/password, and Google Ads budget requests. Do not re-add contractor billing/dispute navigation unless the user explicitly asks.

## Agency Workflow Research
- Read docs/AGENCY_WORKFLOW_RESEARCH.md before changing admin dashboard priorities, lead qualification workflow, reporting, or pay-per-appointment policy.
- Avoid HomeAdvisor-style overclaims. Client-facing reports should stay simple: leads and booked appointments. Internal billing/review states can exist for admin protection, but should not dominate the client portal.

## Before Shipping
- Confirm contractor cannot access another customer's direct lead/customer/report URLs.
- Confirm contractor query filters cannot override tenant scope.
- Confirm Twilio and Stripe webhooks reject invalid signatures.
- Confirm Vercel build runs migrations before building.
- Confirm onboarding creates customer config, tracking number, contractor user, contract, ad spend setup, and billing setup cleanly.

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes. APIs, conventions, and file structure may differ from training data. Check local Next.js docs/types before changing framework-specific code.
<!-- END:nextjs-agent-rules -->

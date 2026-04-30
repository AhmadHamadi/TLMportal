# Architecture

## Summary
TLM Portal is a tenant-scoped agency operations dashboard for contractor lead-engine clients. `customerId` is the tenant key. Admins can see all customers; contractors can only see customers linked through `CustomerUser`.

## Runtime Stack
- Next.js 16 App Router and React 19.
- TypeScript, Tailwind 4, shadcn/ui.
- Prisma 7 with PostgreSQL, hosted on Neon.
- Auth.js v5 Credentials auth and argon2id password hashing.
- Twilio, Stripe, Resend, and Anthropic are server-only integrations with simulated/no-op behavior where appropriate.
- Vercel hosts the app and runs Prisma migrations during build.

## Folder Map
```text
app/                    Route segments, server components, API routes
app/admin/              Admin dashboard and operations screens
app/contractor/         Contractor mobile-first dashboard
app/api/webhooks/       Twilio and Stripe webhooks
app/api/cron/           Scheduled maintenance jobs
components/             UI components and client interaction
lib/                    Env, auth, provider clients, formatting helpers
schemas/                Zod validation schemas
server/actions/         Server action boundary: auth, validate, call service
server/services/        Business rules and Prisma data access
prisma/                 Schema, migrations, seed data
tests/                  Vitest unit and integration tests
docs/                   Architecture, data model, conventions, operations
```

## Request Flow
1. Next.js proxy uses Auth.js to route users away from pages they should not access.
2. Pages/actions call `requireAdmin`, `requireContractor`, or `requireAuth`.
3. Services enforce data scope with `scopeToCustomer` or `withTenantWhere`.
4. Mutations validate with Zod, run in services, and write `AuditLog` where practical.
5. Server actions revalidate paths or redirect after successful service calls.

## Tenant Isolation
Contractor data access must be constrained by `ctx.customerIds`. The risky pattern is combining tenant scope and user filters in a way that allows `customerId` filters to override the scope. When accepting a customer filter:

```ts
if (filter.customerId) scopeToCustomer(ctx, filter.customerId);
const where = { ...(filter.customerId ? { customerId: filter.customerId } : {}), ...withTenantWhere(ctx) };
```

The final spread must keep the tenant scope authoritative, and direct record reads must call `scopeToCustomer` after loading the record's `customerId`.

## Integrations
- Twilio voice webhook logs calls and returns TwiML call forwarding.
- Twilio SMS webhook logs inbound SMS, creates/attaches leads, and handles contractor YES/NO/BUSY/BAD replies.
- Stripe webhook syncs subscriptions and paid/failed invoices.
- Resend sends invite, lead alert, and digest emails; templates escape HTML.
- Anthropic powers AI ad recommendations when `ANTHROPIC_API_KEY` is set.
- Cron endpoints run weekly digest, daily no-reply checks, and monthly Google Ads budget confirmation SMS; `CRON_SECRET` is required in production.

## Deployment
`vercel.json` runs:

```powershell
pnpm prisma migrate deploy && pnpm prisma generate && pnpm next build
```

Use Neon pooled `DATABASE_URL` with `sslmode=verify-full`. Set all required env vars in Vercel before first production deploy.

## Validation
Run:

```powershell
pnpm test -- --run
pnpm lint
pnpm build
```

Current tests cover tenant guards, lead isolation, appointment/dispute flow, billable evaluation, automation dispatch, SMS parsing, phone formatting, and email escaping.

# Architecture

## Folder layout

```
TLMportal/
├─ app/
│  ├─ (auth)/
│  │  ├─ login/page.tsx
│  │  └─ register/page.tsx                # admin-invite only; not public signup
│  ├─ admin/
│  │  ├─ layout.tsx                       # admin shell (sidebar, top nav)
│  │  ├─ page.tsx                         # overview cards
│  │  ├─ customers/
│  │  │  ├─ page.tsx                      # list + filters
│  │  │  ├─ new/page.tsx                  # create form
│  │  │  └─ [customerId]/
│  │  │     ├─ page.tsx                   # customer detail
│  │  │     ├─ edit/page.tsx
│  │  │     ├─ services/page.tsx
│  │  │     ├─ service-areas/page.tsx
│  │  │     └─ users/page.tsx             # invite contractor users
│  │  ├─ leads/
│  │  │  ├─ page.tsx                      # all leads + filters
│  │  │  └─ [leadId]/page.tsx             # lead detail + event timeline
│  │  ├─ calls/page.tsx
│  │  ├─ sms/page.tsx                     # inbox grouped by lead
│  │  ├─ appointments/page.tsx
│  │  ├─ billing/page.tsx
│  │  ├─ disputes/page.tsx
│  │  ├─ tracking-numbers/page.tsx
│  │  ├─ ad-spend/page.tsx
│  │  └─ settings/page.tsx
│  ├─ contractor/
│  │  ├─ layout.tsx                       # contractor shell (simpler)
│  │  ├─ page.tsx                         # overview cards
│  │  ├─ leads/
│  │  │  ├─ page.tsx
│  │  │  └─ [leadId]/page.tsx
│  │  ├─ appointments/page.tsx
│  │  ├─ billing/page.tsx
│  │  ├─ disputes/page.tsx
│  │  └─ settings/page.tsx
│  ├─ api/
│  │  ├─ auth/[...nextauth]/route.ts
│  │  └─ webhooks/                        # Phase 2/3 only
│  │     ├─ twilio/voice/route.ts
│  │     ├─ twilio/sms/route.ts
│  │     └─ stripe/route.ts
│  ├─ layout.tsx                          # root layout, fonts, ThemeProvider
│  └─ globals.css
├─ components/
│  ├─ ui/                                 # shadcn primitives, copy-pasted in
│  ├─ shell/                              # AppShell, Sidebar, TopNav, RoleSwitch
│  ├─ tables/                             # DataTable, ColumnFilters, StatusBadge
│  ├─ forms/                              # FormField, FormSection
│  ├─ leads/                              # LeadCard, LeadStatusBadge, LeadEventTimeline
│  ├─ customers/
│  ├─ appointments/
│  ├─ billing/
│  └─ shared/
├─ lib/
│  ├─ db.ts                               # Prisma client singleton
│  ├─ auth.ts                             # Auth.js v5 config
│  ├─ auth-guard.ts                       # requireAdmin, requireContractor, scopeToCustomer
│  ├─ env.ts                              # Zod-validated process.env
│  ├─ phone.ts                            # E.164 normalize/format
│  ├─ money.ts                            # Decimal helpers, format
│  ├─ dates.ts                            # window/cutoff math
│  ├─ twilio.ts                           # Phase 2 — stubbed: throws "not implemented"
│  ├─ stripe.ts                           # Phase 3 — stubbed
│  └─ utils.ts
├─ server/
│  ├─ actions/                            # thin server actions, "use server"
│  │  ├─ customers.ts
│  │  ├─ leads.ts
│  │  ├─ appointments.ts
│  │  ├─ disputes.ts
│  │  ├─ billing.ts
│  │  └─ users.ts                         # invite, role assign
│  └─ services/                           # business logic, no Next imports
│     ├─ customers.ts
│     ├─ leads.ts
│     ├─ appointments.ts
│     ├─ disputes.ts                      # 48h window math
│     ├─ billing.ts                       # billable computation, monthly summary
│     ├─ tenant.ts                        # customerId scoping helpers
│     └─ audit.ts                         # writeAuditLog
├─ schemas/                               # Zod
│  ├─ customer.ts
│  ├─ lead.ts
│  ├─ appointment.ts
│  ├─ dispute.ts
│  ├─ billing.ts
│  └─ shared.ts
├─ prisma/
│  ├─ schema.prisma
│  ├─ migrations/
│  └─ seed.ts                             # 1 admin, 2 customers, ~20 leads
├─ middleware.ts                          # auth + role-based routing only
├─ types/                                 # ambient types, role enums re-exports
├─ docs/                                  # this file + ROADMAP, DATA_MODEL, CONVENTIONS
├─ tests/                                 # vitest (services), playwright (later)
├─ .env.example
├─ package.json
├─ tsconfig.json
├─ tailwind.config.ts
├─ postcss.config.js
└─ next.config.ts
```

## Module responsibilities

### `app/admin/*` and `app/contractor/*`
- Server components by default. Fetch through services, not Prisma directly,
  unless the read is trivially scoped.
- Client components only for interactivity (filters, dialogs, forms).

### `lib/auth-guard.ts`
The single source of truth for "is this user allowed to see this data."

```ts
// pseudocode
requireAdmin(session)        // throws or returns AdminCtx
requireContractor(session)   // throws or returns ContractorCtx { customerIds: string[] }
scopeToCustomer(ctx, customerId)  // throws if contractor not linked
withTenantWhere(ctx)         // returns Prisma where clause for tenant filter
```

Every server action calls one of these as line 1.

### `server/services/*`
Pure functions of `(db, ctx, input)`. Return plain DTOs.
No `revalidatePath`, no `cookies()`, no `headers()`.

This makes them:
- Unit-testable with a Prisma mock or a transactional test DB.
- Reusable from server actions, route handlers, and webhooks.

### `server/actions/*`
```ts
"use server";
export async function createLead(formData: FormData) {
  const ctx = await requireAdminOrContractor();
  const input = leadCreateSchema.parse(Object.fromEntries(formData));
  const lead = await leadsService.create(db, ctx, input);
  revalidatePath("/admin/leads");
  return { ok: true, leadId: lead.id };
}
```

### `prisma/seed.ts`
Idempotent. Creates: 1 admin user, 2 sample contractor customers, services and
service areas for each, ~20 leads spanning every status, a couple appointments,
one open dispute, one billing record. No real Twilio/Stripe state.

## Authentication flow
1. User hits a protected route. `middleware.ts` checks session cookie; if missing, redirect to `/login`.
2. Server component or action calls `requireAdmin` / `requireContractor`.
3. Contractor queries get `customerId` filter applied via `withTenantWhere`.
4. Mutations append `AuditLog` row in the same transaction.

## Webhooks (Phase 2+)
- Twilio voice + SMS webhooks live under `app/api/webhooks/twilio/*`.
- Stripe webhook lives under `app/api/webhooks/stripe`.
- All three verify provider signatures before any DB work.
- Each webhook is idempotent — keyed on `providerMessageId` / `callSid` / Stripe event ID, with a unique constraint on the corresponding model.

## Testing strategy
- Vitest for services (`tests/services/*`). Use a dedicated test database or `prisma-mock`.
- Playwright later, after the contractor dashboard exists, for the lead → appointment → dispute happy path.

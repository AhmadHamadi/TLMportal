# Conventions

## TypeScript
- `strict: true`. No `any` without a `// eslint-disable-next-line` and a reason.
- Prefer `type` for DTOs, `interface` for extensible shapes.
- Re-export Prisma enums from `types/enums.ts` so callers don't import from `@prisma/client` everywhere.

## Imports
- Path alias `@/*` â†’ project root.
- Group: node/react â†’ third-party â†’ `@/lib` â†’ `@/server` â†’ `@/components` â†’ relative.

## Server actions vs route handlers
- Use server actions for form submits and dashboard mutations.
- Use route handlers (`app/api/*`) only for: external webhooks (Twilio, Stripe), public endpoints (none yet), file downloads.
- Never call a route handler from a client component when a server action would do.

## Validation
- Every server action's first two lines:
  ```ts
  const ctx = await requireAdminOrContractor();
  const input = mySchema.parse(rawInput);
  ```
- Webhook handlers parse with Zod after signature verification.
- Forms use `react-hook-form` + `zodResolver` on the client; the same Zod schema is used by the server action â€” single source of truth in `schemas/`.

## Auth guard usage
```ts
// Admin-only action
const ctx = await requireAdmin();

// Contractor-or-admin action (most read paths)
const ctx = await requireAuth();
const where = withTenantWhere(ctx); // {} for admin, { customerId: { in: [...] } } for contractor

// Contractor action that targets a specific customer
const ctx = await requireContractor();
scopeToCustomer(ctx, customerId); // throws if not linked
```

## Prisma
- Single client instance from `lib/db.ts`.
- Always query through services. Components and actions don't touch `db` directly except for the simplest reads.
- Use `select` to avoid leaking fields. Never `include: { passwordHash: true }`.
- Wrap multi-row mutations in `db.$transaction`.
- Every mutation also writes an `AuditLog` row inside the same transaction.

## Money
- Prisma `Decimal` type. In TS this is `Prisma.Decimal`.
- Pass as string across the API edge: `amount.toFixed(2)`.
- Render with `Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' })`.

## Phone numbers
- Normalize on write with `lib/phone.ts#toE164(input, defaultRegion = 'CA')`.
- Reject invalid phones at the schema layer.
- Display with `formatNational(e164)` so users see `(416) 555-0123`.

## Errors
- Server actions return `{ ok: true, data } | { ok: false, error }`. Don't throw across the boundary except for auth/permission errors that the framework will turn into 401/403.
- In services, throw typed errors (`NotFoundError`, `ForbiddenError`, `ValidationError`) â€” actions catch and translate.
- Log unexpected errors with the requestId from proxy/request context.

## UI
- Server components by default.
- Client components only for: forms, dialogs, anything with `useState`/`useEffect`.
- Loading: `loading.tsx` per route segment.
- Empty states: every list page has a `<EmptyState>` component.
- Status colors: green = good, yellow = pending/attention, red = failed/disputed, blue = info, gray = inactive.

## Naming
- Files: kebab-case (`lead-status-badge.tsx`).
- Components: PascalCase.
- Functions: camelCase. Boolean fields/props start with `is`/`has`/`should`.
- Routes: `/admin/leads/[leadId]` (always `[entityId]`).

## Comments
- Default to none. Only when the *why* is non-obvious â€” invariants, workarounds, regulatory rules.
- Never narrate what code does.

## Tests
- Vitest for services. One test file per service.
- Each test runs against a transactional Prisma sandbox or a mock.
- Playwright after Phase 5 for the lead â†’ appointment â†’ dispute happy path.

## Git
- Conventional commits: `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`.
- One feature per branch. Branch off `main`. PRs squash-merge.
- No commit messages mention "Claude" unless the user adds the trailer.

## Secrets
- Never logged. Never returned in API responses. Never imported from client components.
- All read through `lib/env.ts`, which is server-only (`import "server-only"` at top).

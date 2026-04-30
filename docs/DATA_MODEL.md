# Data model — Prisma schema spec

This is the schema we will commit as `prisma/schema.prisma` in Phase 1.
Refinements over the original spec are called out inline.

## Conventions
- All ids are `cuid()`.
- All tables have `createdAt` (default now) and `updatedAt` (`@updatedAt`) unless noted.
- Money fields are `Decimal(10, 2)`. Never `Float`.
- Phone numbers are `String` in **E.164** (e.g. `+14165550123`). Normalize on write.
- Soft delete: `Customer` and `Lead` have `deletedAt: DateTime?`. Default queries filter `deletedAt: null`.
- Multi-tenant rows always have `customerId` and a compound index `@@index([customerId, createdAt])`.

## Enums

```prisma
enum UserRole { ADMIN CONTRACTOR }

enum CustomerStatus { ACTIVE PAUSED WINTER_MODE CANCELLED }

enum LeadSource {
  LANDING_PAGE_FORM
  GOOGLE_ADS_LEAD_FORM
  TRACKING_PHONE_CALL
  SMS_REPLY
  MANUAL_ADMIN_ENTRY
  QUOTE_BUTTON
}

enum LeadStatus {
  NEW CONTACTED QUALIFIED
  APPOINTMENT_REQUESTED APPOINTMENT_CONFIRMED
  SENT_TO_CONTRACTOR ACCEPTED_BY_CONTRACTOR DECLINED_BY_CONTRACTOR
  COMPLETED_ESTIMATE QUOTED LOST
  DISPUTED NOT_BILLABLE CANCELLED DUPLICATE SPAM
}

enum BillableStatus { PENDING BILLABLE NOT_BILLABLE DISPUTED }

enum NotBillableReason {
  SPAM WRONG_NUMBER DUPLICATE_30D OUTSIDE_SERVICE_AREA
  SERVICE_NOT_OFFERED BELOW_MIN_JOB_SIZE
  CANCELLED_BEFORE_CONFIRMATION EXISTING_CUSTOMER
  EMPLOYMENT_REQUEST VENDOR_INQUIRY DIY_QUESTION
  OTHER
}

enum AppointmentStatus {
  REQUESTED CONFIRMED SENT_TO_CONTRACTOR
  ACCEPTED DECLINED COMPLETED CANCELLED NO_SHOW
}

enum DisputeStatus { OPEN APPROVED REJECTED }

enum BillingType { MONTHLY_RETAINER SETUP_FEE APPOINTMENT_FEE CREDIT ADJUSTMENT }
enum BillingStatus { PENDING APPROVED INVOICED PAID VOID }

enum CallDirection { INBOUND OUTBOUND }
enum SmsDirection  { INBOUND OUTBOUND }

enum NotificationStatus { UNREAD READ ARCHIVED }
```

## Models — refinements over original spec

### `User`
- `email String @unique`
- `passwordHash String?` (nullable for future SSO)
- `role UserRole`

### `Customer`
- `deletedAt DateTime?` (soft delete)
- `slug String @unique` — for tenant-scoped URLs (`admin/customers/[slug]`); generated from businessName
- `setupFee`, `monthlyRetainer`, `appointmentFee`, `monthlyAdBudget` -> `Decimal(10,2)`
- `googleAdsBudgetCurrency String @default("CAD")` -> `CAD` or `USD` for monthly ad budget confirmations
- `disputeWindowHours Int @default(48)` — per-customer override
- `minProjectSize Decimal(10,2)?` — for billable-eligibility check

### `CustomerUser`
- `@@unique([userId, customerId])`
- `role UserRole` — usually `CONTRACTOR`; allows future per-customer roles

### `TrackingNumber`
- `twilioPhoneNumber String @unique`
- `twilioSid String? @unique` — populated when Phase 2 lands
- `status` enum: `ACTIVE INACTIVE RELEASED`

### `Lead`
- `deletedAt DateTime?`
- `phone String?` — E.164, indexed for duplicate detection
- `email String?`
- `googleLeadId String? @unique` — webhook dedupe
- `dedupeHash String?` — index, used for 30-day duplicate detection (phone + customerId + window)
- `@@index([customerId, status])`
- `@@index([customerId, createdAt])`
- `@@index([customerId, phone])`

### `LeadEvent`
- Append-only timeline (created, status changed, SMS sent, call received, contractor accepted, dispute opened, billing approved, etc).
- `type String` — discriminator (`STATUS_CHANGED`, `SMS_OUT`, `SMS_IN`, `CALL_IN`, `CONTRACTOR_REPLY`, `DISPUTE_OPENED`, etc).
- `metadata Json`

### `CallLog`
- `callSid String @unique` — Twilio idempotency
- `recordingUrl String?` — only populated if Phase 2+ recording is enabled
- `recordingDurationSeconds Int?`
- `@@index([customerId, createdAt])`

### `SmsMessage`
- `providerMessageId String @unique`
- `status String` — Twilio delivery status
- `@@index([customerId, createdAt])`
- `@@index([leadId, createdAt])`

### `Appointment`
- `isBillable Boolean @default(false)` — set by `billing.evaluateAppointment()` at confirmation
- `notBillableReason NotBillableReason?`
- `disputeWindowEndsAt DateTime?` — computed from `acceptedByContractorAt + customer.disputeWindowHours`

### `Dispute`
- `@@index([customerId, status])`
- `auditTrail Json` — array of `{ at, byUserId, action, note }`

### `BillingRecord`
- `stripeInvoiceItemId String? @unique`
- `billingMonth String` — `YYYY-MM`, indexed
- `@@index([customerId, billingMonth])`
- `@@unique([customerId, leadId, type])` for `APPOINTMENT_FEE` to prevent double-billing

### `StripeSubscription`
- `customerId String @unique` — one active sub per customer
- `stripeSubscriptionId String @unique`

### `GoogleAdsSpend`
- `@@unique([customerId, month])` — one row per customer per month

### `AutomationRule`
- `trigger String` — `LEAD_CREATED`, `APPOINTMENT_CONFIRMED`, `CONTRACTOR_NO_REPLY_24H`, etc
- `conditions Json` (Zod-validated at runtime)
- `action Json` (e.g. `{ type: "SEND_SMS", templateId: "..." }`)

### `Notification`
- `category String` — `LEAD`, `BILLING`, `DISPUTE`, `SYSTEM`
- `link String?` — deep link into the dashboard

### `AuditLog`
- `before Json?` and `after Json?` for diffable changes
- `ip String?`, `userAgent String?`
- `@@index([entityType, entityId])`
- `@@index([userId, createdAt])`

## Indexes summary
- Every `customerId`-scoped model: `@@index([customerId, createdAt])`
- `Lead`: also `[customerId, status]` and `[customerId, phone]`
- `BillingRecord`: `[customerId, billingMonth]`
- `LeadEvent`: `[leadId, createdAt]`

## Billable-eligibility computation
Lives in `server/services/billing.ts` as `evaluateBillable(lead, appointment, customer)`.
Returns `{ isBillable: boolean, reason?: NotBillableReason }`.

Inputs checked, in order:
1. Lead is not flagged spam/duplicate/wrong-number.
2. Phone is valid E.164.
3. Service requested matches an active `Service` for the customer.
4. City/neighbourhood matches an active `ServiceArea`.
5. `estimatedProjectSize >= customer.minProjectSize` (if set).
6. Lead has confirmed interest (status >= `APPOINTMENT_CONFIRMED`).
7. Date/time agreed (`appointmentWindowStart` set).
8. Contractor was notified (`sentToContractorAt` set).
9. Contractor accepted OR `disputeWindowEndsAt` is in the past with no valid open dispute.
10. Lead did not cancel before the configured cutoff.

Any failed check short-circuits with the corresponding `NotBillableReason`.

## Seed data plan (`prisma/seed.ts`)
- 1 admin: `admin@tlm.local` / known dev password
- 2 contractor companies: "Atlas Concrete" and "Northside Interlock"
- 2 contractor users (one per company)
- 3 services and 4 service areas per company
- 1 tracking number per company (placeholder Twilio number)
- ~20 leads across both companies, one of each major status
- 5 appointments (3 confirmed, 1 disputed, 1 declined)
- 1 open dispute
- 1 paid billing record, 1 pending appointment fee
- 1 month of `GoogleAdsSpend` per company

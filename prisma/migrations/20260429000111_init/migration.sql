-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'CONTRACTOR');

-- CreateEnum
CREATE TYPE "CustomerStatus" AS ENUM ('ACTIVE', 'PAUSED', 'WINTER_MODE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('LANDING_PAGE_FORM', 'GOOGLE_ADS_LEAD_FORM', 'TRACKING_PHONE_CALL', 'SMS_REPLY', 'MANUAL_ADMIN_ENTRY', 'QUOTE_BUTTON');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'APPOINTMENT_REQUESTED', 'APPOINTMENT_CONFIRMED', 'SENT_TO_CONTRACTOR', 'ACCEPTED_BY_CONTRACTOR', 'DECLINED_BY_CONTRACTOR', 'COMPLETED_ESTIMATE', 'QUOTED', 'WON', 'LOST', 'DISPUTED', 'NOT_BILLABLE', 'CANCELLED', 'DUPLICATE', 'SPAM');

-- CreateEnum
CREATE TYPE "BillableStatus" AS ENUM ('PENDING', 'BILLABLE', 'NOT_BILLABLE', 'DISPUTED');

-- CreateEnum
CREATE TYPE "NotBillableReason" AS ENUM ('SPAM', 'WRONG_NUMBER', 'DUPLICATE_30D', 'OUTSIDE_SERVICE_AREA', 'SERVICE_NOT_OFFERED', 'BELOW_MIN_JOB_SIZE', 'CANCELLED_BEFORE_CONFIRMATION', 'EXISTING_CUSTOMER', 'EMPLOYMENT_REQUEST', 'VENDOR_INQUIRY', 'DIY_QUESTION', 'OTHER');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('REQUESTED', 'CONFIRMED', 'SENT_TO_CONTRACTOR', 'ACCEPTED', 'DECLINED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('OPEN', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "BillingType" AS ENUM ('MONTHLY_RETAINER', 'SETUP_FEE', 'APPOINTMENT_FEE', 'CREDIT', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "BillingStatus" AS ENUM ('PENDING', 'APPROVED', 'INVOICED', 'PAID', 'VOID');

-- CreateEnum
CREATE TYPE "CallDirection" AS ENUM ('INBOUND', 'OUTBOUND');

-- CreateEnum
CREATE TYPE "SmsDirection" AS ENUM ('INBOUND', 'OUTBOUND');

-- CreateEnum
CREATE TYPE "TrackingNumberStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'RELEASED');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('UNREAD', 'READ', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "NotificationCategory" AS ENUM ('LEAD', 'BILLING', 'DISPUTE', 'SYSTEM');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "passwordHash" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'CONTRACTOR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "forwardingPhone" TEXT NOT NULL,
    "websiteUrl" TEXT,
    "landingPageUrl" TEXT,
    "googleAdsCustomerId" TEXT,
    "setupFee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "monthlyRetainer" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "appointmentFee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "monthlyAdBudget" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "minProjectSize" DECIMAL(10,2),
    "disputeWindowHours" INTEGER NOT NULL DEFAULT 48,
    "status" "CustomerStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerUser" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'CONTRACTOR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceArea" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "neighbourhood" TEXT,
    "province" TEXT NOT NULL DEFAULT 'ON',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceArea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackingNumber" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "twilioPhoneNumber" TEXT NOT NULL,
    "twilioSid" TEXT,
    "forwardingPhoneNumber" TEXT NOT NULL,
    "label" TEXT,
    "status" "TrackingNumberStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrackingNumber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "source" "LeadSource" NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "city" TEXT,
    "neighbourhood" TEXT,
    "address" TEXT,
    "serviceRequested" TEXT,
    "projectDetails" TEXT,
    "estimatedProjectSize" DECIMAL(10,2),
    "preferredTime" TEXT,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "billableStatus" "BillableStatus" NOT NULL DEFAULT 'PENDING',
    "notBillableReason" "NotBillableReason",
    "sourceCampaign" TEXT,
    "sourceAdGroup" TEXT,
    "sourceKeyword" TEXT,
    "googleLeadId" TEXT,
    "dedupeHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadEvent" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CallLog" (
    "id" TEXT NOT NULL,
    "leadId" TEXT,
    "customerId" TEXT NOT NULL,
    "fromNumber" TEXT NOT NULL,
    "toNumber" TEXT NOT NULL,
    "trackingNumber" TEXT NOT NULL,
    "callSid" TEXT NOT NULL,
    "durationSeconds" INTEGER NOT NULL DEFAULT 0,
    "recordingUrl" TEXT,
    "recordingDurationSeconds" INTEGER,
    "callStatus" TEXT NOT NULL,
    "direction" "CallDirection" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CallLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SmsMessage" (
    "id" TEXT NOT NULL,
    "leadId" TEXT,
    "customerId" TEXT NOT NULL,
    "fromNumber" TEXT NOT NULL,
    "toNumber" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "direction" "SmsDirection" NOT NULL,
    "providerMessageId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SmsMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "appointmentWindowStart" TIMESTAMP(3),
    "appointmentWindowEnd" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "sentToContractorAt" TIMESTAMP(3),
    "acceptedByContractorAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "status" "AppointmentStatus" NOT NULL DEFAULT 'REQUESTED',
    "isBillable" BOOLEAN NOT NULL DEFAULT false,
    "notBillableReason" "NotBillableReason",
    "disputeWindowEndsAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dispute" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "appointmentId" TEXT,
    "customerId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "status" "DisputeStatus" NOT NULL DEFAULT 'OPEN',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedByUserId" TEXT,
    "decisionNote" TEXT,
    "auditTrail" JSONB,

    CONSTRAINT "Dispute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingRecord" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "leadId" TEXT,
    "appointmentId" TEXT,
    "type" "BillingType" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "BillingStatus" NOT NULL DEFAULT 'PENDING',
    "stripeInvoiceId" TEXT,
    "stripeInvoiceItemId" TEXT,
    "billingMonth" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StripeSubscription" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "stripeCustomerId" TEXT NOT NULL,
    "stripeSubscriptionId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "currentPeriodStart" TIMESTAMP(3) NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StripeSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoogleAdsSpend" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "spendAmount" DECIMAL(10,2) NOT NULL,
    "impressions" INTEGER,
    "clicks" INTEGER,
    "conversions" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GoogleAdsSpend_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomationRule" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "conditions" JSONB,
    "action" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutomationRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "customerId" TEXT,
    "category" "NotificationCategory" NOT NULL DEFAULT 'SYSTEM',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "status" "NotificationStatus" NOT NULL DEFAULT 'UNREAD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "customerId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "metadata" JSONB,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_slug_key" ON "Customer"("slug");

-- CreateIndex
CREATE INDEX "Customer_status_deletedAt_idx" ON "Customer"("status", "deletedAt");

-- CreateIndex
CREATE INDEX "CustomerUser_customerId_idx" ON "CustomerUser"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerUser_userId_customerId_key" ON "CustomerUser"("userId", "customerId");

-- CreateIndex
CREATE INDEX "Service_customerId_isActive_idx" ON "Service"("customerId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Service_customerId_name_key" ON "Service"("customerId", "name");

-- CreateIndex
CREATE INDEX "ServiceArea_customerId_isActive_idx" ON "ServiceArea"("customerId", "isActive");

-- CreateIndex
CREATE INDEX "ServiceArea_customerId_city_idx" ON "ServiceArea"("customerId", "city");

-- CreateIndex
CREATE UNIQUE INDEX "TrackingNumber_twilioPhoneNumber_key" ON "TrackingNumber"("twilioPhoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "TrackingNumber_twilioSid_key" ON "TrackingNumber"("twilioSid");

-- CreateIndex
CREATE INDEX "TrackingNumber_customerId_status_idx" ON "TrackingNumber"("customerId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_googleLeadId_key" ON "Lead"("googleLeadId");

-- CreateIndex
CREATE INDEX "Lead_customerId_status_idx" ON "Lead"("customerId", "status");

-- CreateIndex
CREATE INDEX "Lead_customerId_createdAt_idx" ON "Lead"("customerId", "createdAt");

-- CreateIndex
CREATE INDEX "Lead_customerId_phone_idx" ON "Lead"("customerId", "phone");

-- CreateIndex
CREATE INDEX "Lead_customerId_billableStatus_idx" ON "Lead"("customerId", "billableStatus");

-- CreateIndex
CREATE INDEX "Lead_dedupeHash_idx" ON "Lead"("dedupeHash");

-- CreateIndex
CREATE INDEX "LeadEvent_leadId_createdAt_idx" ON "LeadEvent"("leadId", "createdAt");

-- CreateIndex
CREATE INDEX "LeadEvent_type_idx" ON "LeadEvent"("type");

-- CreateIndex
CREATE UNIQUE INDEX "CallLog_callSid_key" ON "CallLog"("callSid");

-- CreateIndex
CREATE INDEX "CallLog_customerId_createdAt_idx" ON "CallLog"("customerId", "createdAt");

-- CreateIndex
CREATE INDEX "CallLog_leadId_createdAt_idx" ON "CallLog"("leadId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SmsMessage_providerMessageId_key" ON "SmsMessage"("providerMessageId");

-- CreateIndex
CREATE INDEX "SmsMessage_customerId_createdAt_idx" ON "SmsMessage"("customerId", "createdAt");

-- CreateIndex
CREATE INDEX "SmsMessage_leadId_createdAt_idx" ON "SmsMessage"("leadId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_leadId_key" ON "Appointment"("leadId");

-- CreateIndex
CREATE INDEX "Appointment_customerId_status_idx" ON "Appointment"("customerId", "status");

-- CreateIndex
CREATE INDEX "Appointment_customerId_createdAt_idx" ON "Appointment"("customerId", "createdAt");

-- CreateIndex
CREATE INDEX "Appointment_disputeWindowEndsAt_idx" ON "Appointment"("disputeWindowEndsAt");

-- CreateIndex
CREATE INDEX "Dispute_customerId_status_idx" ON "Dispute"("customerId", "status");

-- CreateIndex
CREATE INDEX "Dispute_leadId_idx" ON "Dispute"("leadId");

-- CreateIndex
CREATE UNIQUE INDEX "BillingRecord_stripeInvoiceItemId_key" ON "BillingRecord"("stripeInvoiceItemId");

-- CreateIndex
CREATE INDEX "BillingRecord_customerId_billingMonth_idx" ON "BillingRecord"("customerId", "billingMonth");

-- CreateIndex
CREATE INDEX "BillingRecord_customerId_status_idx" ON "BillingRecord"("customerId", "status");

-- CreateIndex
CREATE INDEX "BillingRecord_customerId_type_idx" ON "BillingRecord"("customerId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "StripeSubscription_customerId_key" ON "StripeSubscription"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "StripeSubscription_stripeCustomerId_key" ON "StripeSubscription"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "StripeSubscription_stripeSubscriptionId_key" ON "StripeSubscription"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "GoogleAdsSpend_customerId_month_idx" ON "GoogleAdsSpend"("customerId", "month");

-- CreateIndex
CREATE UNIQUE INDEX "GoogleAdsSpend_customerId_month_key" ON "GoogleAdsSpend"("customerId", "month");

-- CreateIndex
CREATE INDEX "AutomationRule_customerId_isActive_idx" ON "AutomationRule"("customerId", "isActive");

-- CreateIndex
CREATE INDEX "AutomationRule_trigger_idx" ON "AutomationRule"("trigger");

-- CreateIndex
CREATE INDEX "Notification_userId_status_idx" ON "Notification"("userId", "status");

-- CreateIndex
CREATE INDEX "Notification_customerId_createdAt_idx" ON "Notification"("customerId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_createdAt_idx" ON "AuditLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_customerId_createdAt_idx" ON "AuditLog"("customerId", "createdAt");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerUser" ADD CONSTRAINT "CustomerUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerUser" ADD CONSTRAINT "CustomerUser_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceArea" ADD CONSTRAINT "ServiceArea_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackingNumber" ADD CONSTRAINT "TrackingNumber_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadEvent" ADD CONSTRAINT "LeadEvent_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadEvent" ADD CONSTRAINT "LeadEvent_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallLog" ADD CONSTRAINT "CallLog_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallLog" ADD CONSTRAINT "CallLog_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmsMessage" ADD CONSTRAINT "SmsMessage_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmsMessage" ADD CONSTRAINT "SmsMessage_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingRecord" ADD CONSTRAINT "BillingRecord_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingRecord" ADD CONSTRAINT "BillingRecord_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StripeSubscription" ADD CONSTRAINT "StripeSubscription_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoogleAdsSpend" ADD CONSTRAINT "GoogleAdsSpend_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationRule" ADD CONSTRAINT "AutomationRule_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

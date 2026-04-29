-- CreateEnum
CREATE TYPE "GoogleAdsLinkStatus" AS ENUM ('NOT_LINKED', 'INVITED', 'LINKED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('DRAFT', 'SENT', 'SIGNED', 'EXPIRED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('MASTER_SERVICE_AGREEMENT', 'SCOPE_LANDING_PAGE', 'SCOPE_FULL_WEBSITE', 'SCOPE_SEO', 'SCOPE_GOOGLE_ADS_MANAGEMENT', 'SCOPE_GBP_MANAGEMENT', 'PAYMENT_AUTHORIZATION', 'OTHER');

-- CreateEnum
CREATE TYPE "OnboardingItemType" AS ENUM ('LANDING_PAGE_REBUILD', 'FULL_WEBSITE_REBUILD', 'SEO_SETUP', 'GOOGLE_ADS_CAMPAIGNS', 'GOOGLE_BUSINESS_PROFILE', 'CALL_TRACKING_SETUP', 'CONVERSION_GOALS', 'BRAND_ASSETS', 'DOMAIN_DNS_ACCESS', 'OTHER');

-- CreateEnum
CREATE TYPE "OnboardingItemStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE');

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "googleAdsLinkStatus" "GoogleAdsLinkStatus" NOT NULL DEFAULT 'NOT_LINKED',
ADD COLUMN     "industry" TEXT,
ADD COLUMN     "twilioMessagingServiceSid" TEXT;

-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "type" "ContractType" NOT NULL DEFAULT 'OTHER',
    "name" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "status" "ContractStatus" NOT NULL DEFAULT 'DRAFT',
    "signedAt" TIMESTAMP(3),
    "signerName" TEXT,
    "signerEmail" TEXT,
    "notes" TEXT,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnboardingItem" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "type" "OnboardingItemType" NOT NULL,
    "status" "OnboardingItemStatus" NOT NULL DEFAULT 'TODO',
    "title" TEXT NOT NULL,
    "prompt" TEXT,
    "notes" TEXT,
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnboardingItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Contract_customerId_status_idx" ON "Contract"("customerId", "status");

-- CreateIndex
CREATE INDEX "Contract_customerId_type_idx" ON "Contract"("customerId", "type");

-- CreateIndex
CREATE INDEX "OnboardingItem_customerId_status_idx" ON "OnboardingItem"("customerId", "status");

-- CreateIndex
CREATE INDEX "OnboardingItem_customerId_type_idx" ON "OnboardingItem"("customerId", "type");

-- CreateIndex
CREATE INDEX "Customer_industry_idx" ON "Customer"("industry");

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnboardingItem" ADD CONSTRAINT "OnboardingItem_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

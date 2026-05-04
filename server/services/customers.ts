import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { writeAudit } from "./audit";
import type { AuthCtx } from "@/lib/auth-guard";
import { ForbiddenError, scopeToCustomer } from "@/lib/auth-guard";
import type { CustomerCreateInput, CustomerUpdateInput } from "@/schemas/customer";
import { hashPassword } from "@/lib/password";

const CUSTOMER_DETAIL_INCLUDE = {
  services: { orderBy: { name: "asc" } },
  serviceAreas: { orderBy: [{ city: "asc" }, { neighbourhood: "asc" }] },
  trackingNumbers: true,
  users: { include: { user: { select: { id: true, name: true, email: true, role: true } } } },
} satisfies Prisma.CustomerInclude;

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

async function uniqueSlug(base: string): Promise<string> {
  let candidate = base || "customer";
  for (let i = 2; i < 1000; i += 1) {
    const exists = await db.customer.findUnique({ where: { slug: candidate } });
    if (!exists) return candidate;
    candidate = `${base}-${i}`;
  }
  throw new Error("Could not generate unique slug");
}

function parseInitialServices(value?: string | null): string[] {
  return Array.from(
    new Set(
      (value ?? "")
        .split(/\r?\n|,/)
        .map((service) => service.trim())
        .filter((service) => service.length >= 2),
    ),
  ).slice(0, 30);
}

function selectedPackageLabels(input: {
  packageLeadEngine?: boolean;
  leadEngineEnabled?: boolean;
  packageWebsite?: boolean;
  websiteEnabled?: boolean;
  packageSeo?: boolean;
  localSeoEnabled?: boolean;
  packageGbp?: boolean;
  gbpEnabled?: boolean;
  packageGoogleAds?: boolean;
  googleAdsEnabled?: boolean;
}): string[] {
  return [
    input.packageLeadEngine || input.leadEngineEnabled ? "Lead Engine" : null,
    input.packageGoogleAds || input.googleAdsEnabled ? "Google Ads management" : null,
    input.packageWebsite || input.websiteEnabled ? "Website/landing page" : null,
    input.packageSeo || input.localSeoEnabled ? "Local SEO" : null,
    input.packageGbp || input.gbpEnabled ? "Google Business Profile" : null,
  ].filter(Boolean) as string[];
}

function buildBusinessModelNote(input: {
  notes?: string | null;
  payPerAppointment?: "yes" | "no";
  appointmentFee?: string | number | Prisma.Decimal;
  seoGbpMonthlyRetainer?: string | number | Prisma.Decimal;
  packageLeadEngine?: boolean;
  packageWebsite?: boolean;
  packageSeo?: boolean;
  packageGbp?: boolean;
  packageGoogleAds?: boolean;
}) {
  const packages = selectedPackageLabels(input);
  const model =
    !input.packageLeadEngine
      ? "Billing model: flat monthly service retainer; no booked-appointment promise."
      : input.payPerAppointment === "no"
      ? "Billing model: retainer only; no per-booked-appointment fee."
      : `Billing model: retainer plus booked appointment fee (${input.appointmentFee ?? "0"}).`;
  const packageLine =
    packages.length > 0 ? `Included services: ${packages.join(", ")}.` : null;
  const seoLine =
    input.packageSeo || input.packageGbp
      ? `SEO/GBP retainer: ${input.seoGbpMonthlyRetainer ?? "750"} per month.`
      : null;
  return [input.notes?.trim() || null, model, packageLine, seoLine].filter(Boolean).join("\n");
}

export async function listCustomers(ctx: AuthCtx) {
  if (ctx.role !== "ADMIN") throw new ForbiddenError();
  return db.customer.findMany({
    where: { deletedAt: null },
    orderBy: [{ status: "asc" }, { businessName: "asc" }],
    select: {
      id: true,
      slug: true,
      businessName: true,
      contactName: true,
      email: true,
      phone: true,
      status: true,
      monthlyRetainer: true,
      appointmentFee: true,
      seoGbpMonthlyRetainer: true,
      googleAdsBudgetCurrency: true,
      billingCurrency: true,
      leadEngineEnabled: true,
      googleAdsEnabled: true,
      websiteEnabled: true,
      localSeoEnabled: true,
      gbpEnabled: true,
      createdAt: true,
    },
  });
}

export async function getCustomerById(ctx: AuthCtx, id: string) {
  scopeToCustomer(ctx, id);
  return db.customer.findFirst({
    where: { id, deletedAt: null },
    include: CUSTOMER_DETAIL_INCLUDE,
  });
}

export async function getCustomerBySlug(ctx: AuthCtx, slug: string) {
  const customer = await db.customer.findFirst({
    where: { slug, deletedAt: null },
    include: CUSTOMER_DETAIL_INCLUDE,
  });
  if (!customer) return null;
  scopeToCustomer(ctx, customer.id);
  return customer;
}

export async function createCustomer(ctx: AuthCtx, input: CustomerCreateInput) {
  if (ctx.role !== "ADMIN") throw new ForbiddenError();
  const slug = await uniqueSlug(slugify(input.businessName));
  const initialServices = parseInitialServices(input.initialServices);
  const appointmentFee = input.payPerAppointment === "no" ? "0" : input.appointmentFee;
  const seoGbpMonthlyRetainer =
    input.packageSeo || input.packageGbp ? input.seoGbpMonthlyRetainer || "750" : "0";
  // Sensible defaults so the create form can be minimal (5 fields). Admin
  // refines forwarding phone on the dedicated Twilio setup page later.
  const contactName = input.contactName ?? input.businessName;
  const forwardingPhone = input.forwardingPhone ?? input.phone;
  const notes = buildBusinessModelNote({ ...input, appointmentFee, seoGbpMonthlyRetainer });
  return db.$transaction(async (tx) => {
    const customer = await tx.customer.create({
      data: {
        slug,
        businessName: input.businessName,
        contactName,
        email: input.email,
        phone: input.phone,
        forwardingPhone,
        websiteUrl: input.websiteUrl,
        landingPageUrl: input.landingPageUrl,
        industry: input.industry,
        googleAdsCustomerId: input.googleAdsCustomerId,
        twilioMessagingServiceSid: input.twilioMessagingServiceSid,
        leadEngineEnabled: input.packageLeadEngine,
        googleAdsEnabled: input.packageGoogleAds,
        websiteEnabled: input.packageWebsite,
        localSeoEnabled: input.packageSeo,
        gbpEnabled: input.packageGbp,
        setupFee: input.setupFee,
        monthlyRetainer: input.monthlyRetainer,
        appointmentFee,
        seoGbpMonthlyRetainer,
        monthlyAdBudget: input.monthlyAdBudget,
        googleAdsBudgetCurrency: input.googleAdsBudgetCurrency,
        billingCurrency: input.billingCurrency,
        minProjectSize: input.minProjectSize,
        disputeWindowHours: input.disputeWindowHours,
        status: input.status,
        notes,
      },
    });
    if (initialServices.length > 0) {
      await tx.service.createMany({
        data: initialServices.map((name) => ({ customerId: customer.id, name })),
        skipDuplicates: true,
      });
    }
    await writeAudit(
      {
        userId: ctx.userId,
        customerId: customer.id,
        action: "CUSTOMER_CREATED",
        entityType: "Customer",
        entityId: customer.id,
        after: { businessName: customer.businessName, status: customer.status },
      },
      tx,
    );
    return customer;
  });
}

export async function updateCustomer(ctx: AuthCtx, input: CustomerUpdateInput) {
  if (ctx.role !== "ADMIN") throw new ForbiddenError();
  const {
    id,
    initialServices,
    payPerAppointment,
    packageLeadEngine,
    packageWebsite,
    packageSeo,
    packageGbp,
    packageGoogleAds,
    ...rest
  } = input;
  const servicesToAdd = parseInitialServices(initialServices);
  const nextAppointmentFee = payPerAppointment === "no" ? "0" : rest.appointmentFee;
  const nextSeoGbpMonthlyRetainer =
    packageSeo || packageGbp ? rest.seoGbpMonthlyRetainer || "750" : rest.seoGbpMonthlyRetainer;
  const nextNotes =
    payPerAppointment ||
    packageLeadEngine ||
    packageWebsite ||
    packageSeo ||
    packageGbp ||
    packageGoogleAds
      ? buildBusinessModelNote({
          notes: rest.notes,
          payPerAppointment,
          appointmentFee: nextAppointmentFee,
          seoGbpMonthlyRetainer: nextSeoGbpMonthlyRetainer,
          packageLeadEngine,
          packageWebsite,
          packageSeo,
          packageGbp,
          packageGoogleAds,
        })
      : rest.notes;
  const data = {
    ...rest,
    ...(packageLeadEngine !== undefined ? { leadEngineEnabled: packageLeadEngine } : {}),
    ...(packageGoogleAds !== undefined ? { googleAdsEnabled: packageGoogleAds } : {}),
    ...(packageWebsite !== undefined ? { websiteEnabled: packageWebsite } : {}),
    ...(packageSeo !== undefined ? { localSeoEnabled: packageSeo } : {}),
    ...(packageGbp !== undefined ? { gbpEnabled: packageGbp } : {}),
    ...(nextAppointmentFee !== undefined ? { appointmentFee: nextAppointmentFee } : {}),
    ...(nextSeoGbpMonthlyRetainer !== undefined
      ? { seoGbpMonthlyRetainer: nextSeoGbpMonthlyRetainer }
      : {}),
    ...(nextNotes !== undefined ? { notes: nextNotes } : {}),
  };
  return db.$transaction(async (tx) => {
    const before = await tx.customer.findUnique({ where: { id } });
    if (!before || before.deletedAt) throw new Error("Customer not found");
    const customer = await tx.customer.update({
      where: { id },
      data: data as Prisma.CustomerUpdateInput,
    });
    if (servicesToAdd.length > 0) {
      await tx.service.createMany({
        data: servicesToAdd.map((name) => ({ customerId: id, name })),
        skipDuplicates: true,
      });
    }
    await writeAudit(
      {
        userId: ctx.userId,
        customerId: id,
        action: "CUSTOMER_UPDATED",
        entityType: "Customer",
        entityId: id,
        before: { ...before, setupFee: before.setupFee.toString(), monthlyRetainer: before.monthlyRetainer.toString(), appointmentFee: before.appointmentFee.toString(), seoGbpMonthlyRetainer: before.seoGbpMonthlyRetainer.toString(), monthlyAdBudget: before.monthlyAdBudget.toString(), minProjectSize: before.minProjectSize?.toString() ?? null } as Prisma.InputJsonValue,
        after: { ...customer, setupFee: customer.setupFee.toString(), monthlyRetainer: customer.monthlyRetainer.toString(), appointmentFee: customer.appointmentFee.toString(), seoGbpMonthlyRetainer: customer.seoGbpMonthlyRetainer.toString(), monthlyAdBudget: customer.monthlyAdBudget.toString(), minProjectSize: customer.minProjectSize?.toString() ?? null } as Prisma.InputJsonValue,
      },
      tx,
    );
    return customer;
  });
}

export async function softDeleteCustomer(ctx: AuthCtx, id: string) {
  if (ctx.role !== "ADMIN") throw new ForbiddenError();
  return db.$transaction(async (tx) => {
    const customer = await tx.customer.update({
      where: { id },
      data: { deletedAt: new Date(), status: "CANCELLED" },
    });
    await writeAudit(
      {
        userId: ctx.userId,
        customerId: id,
        action: "CUSTOMER_DELETED",
        entityType: "Customer",
        entityId: id,
      },
      tx,
    );
    return customer;
  });
}

export async function addService(ctx: AuthCtx, input: { customerId: string; name: string }) {
  if (ctx.role !== "ADMIN") throw new ForbiddenError();
  return db.service.create({ data: { customerId: input.customerId, name: input.name } });
}

export async function toggleService(ctx: AuthCtx, id: string) {
  if (ctx.role !== "ADMIN") throw new ForbiddenError();
  const cur = await db.service.findUnique({ where: { id } });
  if (!cur) throw new Error("Service not found");
  return db.service.update({ where: { id }, data: { isActive: !cur.isActive } });
}

export async function deleteService(ctx: AuthCtx, id: string) {
  if (ctx.role !== "ADMIN") throw new ForbiddenError();
  return db.service.delete({ where: { id } });
}

export async function addServiceArea(
  ctx: AuthCtx,
  input: { customerId: string; city: string; neighbourhood?: string | null; province?: string },
) {
  if (ctx.role !== "ADMIN") throw new ForbiddenError();
  return db.serviceArea.create({
    data: {
      customerId: input.customerId,
      city: input.city,
      neighbourhood: input.neighbourhood ?? null,
      province: input.province ?? "ON",
    },
  });
}

export async function toggleServiceArea(ctx: AuthCtx, id: string) {
  if (ctx.role !== "ADMIN") throw new ForbiddenError();
  const cur = await db.serviceArea.findUnique({ where: { id } });
  if (!cur) throw new Error("Service area not found");
  return db.serviceArea.update({ where: { id }, data: { isActive: !cur.isActive } });
}

export async function deleteServiceArea(ctx: AuthCtx, id: string) {
  if (ctx.role !== "ADMIN") throw new ForbiddenError();
  return db.serviceArea.delete({ where: { id } });
}

export async function inviteContractorUser(
  ctx: AuthCtx,
  input: { customerId: string; email: string; name: string; password: string },
) {
  if (ctx.role !== "ADMIN") throw new ForbiddenError();
  const passwordHash = await hashPassword(input.password);
  return db.$transaction(async (tx) => {
    let user = await tx.user.findUnique({ where: { email: input.email } });
    if (!user) {
      user = await tx.user.create({
        data: { email: input.email, name: input.name, role: "CONTRACTOR", passwordHash },
      });
    }
    await tx.customerUser.upsert({
      where: { userId_customerId: { userId: user.id, customerId: input.customerId } },
      update: {},
      create: { userId: user.id, customerId: input.customerId, role: "CONTRACTOR" },
    });
    await writeAudit(
      {
        userId: ctx.userId,
        customerId: input.customerId,
        action: "CONTRACTOR_USER_LINKED",
        entityType: "User",
        entityId: user.id,
        metadata: { email: user.email },
      },
      tx,
    );
    return user;
  });
}

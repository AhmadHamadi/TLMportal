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
  return db.$transaction(async (tx) => {
    const customer = await tx.customer.create({
      data: {
        slug,
        businessName: input.businessName,
        contactName: input.contactName,
        email: input.email,
        phone: input.phone,
        forwardingPhone: input.forwardingPhone,
        websiteUrl: input.websiteUrl,
        landingPageUrl: input.landingPageUrl,
        industry: input.industry,
        googleAdsCustomerId: input.googleAdsCustomerId,
        twilioMessagingServiceSid: input.twilioMessagingServiceSid,
        setupFee: input.setupFee,
        monthlyRetainer: input.monthlyRetainer,
        appointmentFee: input.appointmentFee,
        monthlyAdBudget: input.monthlyAdBudget,
        minProjectSize: input.minProjectSize,
        disputeWindowHours: input.disputeWindowHours,
        status: input.status,
        notes: input.notes,
      },
    });
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
  const { id, ...rest } = input;
  return db.$transaction(async (tx) => {
    const before = await tx.customer.findUnique({ where: { id } });
    if (!before || before.deletedAt) throw new Error("Customer not found");
    const customer = await tx.customer.update({
      where: { id },
      data: rest as Prisma.CustomerUpdateInput,
    });
    await writeAudit(
      {
        userId: ctx.userId,
        customerId: id,
        action: "CUSTOMER_UPDATED",
        entityType: "Customer",
        entityId: id,
        before: { ...before, setupFee: before.setupFee.toString(), monthlyRetainer: before.monthlyRetainer.toString(), appointmentFee: before.appointmentFee.toString(), monthlyAdBudget: before.monthlyAdBudget.toString(), minProjectSize: before.minProjectSize?.toString() ?? null } as Prisma.InputJsonValue,
        after: { ...customer, setupFee: customer.setupFee.toString(), monthlyRetainer: customer.monthlyRetainer.toString(), appointmentFee: customer.appointmentFee.toString(), monthlyAdBudget: customer.monthlyAdBudget.toString(), minProjectSize: customer.minProjectSize?.toString() ?? null } as Prisma.InputJsonValue,
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

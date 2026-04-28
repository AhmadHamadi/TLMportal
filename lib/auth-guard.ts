import "server-only";
// Phase 2 will wire this to Auth.js v5. For now this is the contract every
// server action and route handler must call. The implementation throws so
// any accidental call before Phase 2 is loud.

import { UserRole } from "@prisma/client";

export type AuthCtx =
  | { role: "ADMIN"; userId: string }
  | { role: "CONTRACTOR"; userId: string; customerIds: string[] };

export class AuthError extends Error {
  constructor(message: string, public readonly status = 401) {
    super(message);
    this.name = "AuthError";
  }
}

export class ForbiddenError extends AuthError {
  constructor(message = "Forbidden") {
    super(message, 403);
    this.name = "ForbiddenError";
  }
}

export async function requireAuth(): Promise<AuthCtx> {
  throw new AuthError("auth-guard not yet implemented (Phase 2)");
}

export async function requireAdmin(): Promise<Extract<AuthCtx, { role: "ADMIN" }>> {
  const ctx = await requireAuth();
  if (ctx.role !== "ADMIN") throw new ForbiddenError("Admin only");
  return ctx;
}

export async function requireContractor(): Promise<Extract<AuthCtx, { role: "CONTRACTOR" }>> {
  const ctx = await requireAuth();
  if (ctx.role !== "CONTRACTOR") throw new ForbiddenError("Contractor only");
  return ctx;
}

export function scopeToCustomer(ctx: AuthCtx, customerId: string): void {
  if (ctx.role === "ADMIN") return;
  if (!ctx.customerIds.includes(customerId)) {
    throw new ForbiddenError("Not linked to this customer");
  }
}

/**
 * Returns a Prisma `where` fragment that limits queries to the caller's tenant.
 * Admins get an empty object (no scope). Contractors get `customerId in [...]`.
 * Always include `deletedAt: null` separately on soft-deletable models.
 */
export function withTenantWhere(ctx: AuthCtx): { customerId?: { in: string[] } } {
  if (ctx.role === "ADMIN") return {};
  return { customerId: { in: ctx.customerIds } };
}

export function isAdminRole(role: UserRole): boolean {
  return role === "ADMIN";
}

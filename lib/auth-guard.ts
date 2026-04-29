import "server-only";
import { auth } from "@/auth";
import type { UserRole } from "@prisma/client";

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
  const session = await auth();
  if (!session?.user) {
    throw new AuthError("Not authenticated");
  }
  if (session.user.role === "ADMIN") {
    return { role: "ADMIN", userId: session.user.id };
  }
  return {
    role: "CONTRACTOR",
    userId: session.user.id,
    customerIds: session.user.customerIds ?? [],
  };
}

export async function requireAdmin(): Promise<Extract<AuthCtx, { role: "ADMIN" }>> {
  const ctx = await requireAuth();
  if (ctx.role !== "ADMIN") throw new ForbiddenError("Admin only");
  return ctx;
}

export async function requireContractor(): Promise<
  Extract<AuthCtx, { role: "CONTRACTOR" }>
> {
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

export function withTenantWhere(ctx: AuthCtx): { customerId?: { in: string[] } } {
  if (ctx.role === "ADMIN") return {};
  return { customerId: { in: ctx.customerIds } };
}

export function isAdminRole(role: UserRole): boolean {
  return role === "ADMIN";
}

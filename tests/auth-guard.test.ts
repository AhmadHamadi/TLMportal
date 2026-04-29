import { describe, it, expect } from "vitest";
import {
  ForbiddenError,
  scopeToCustomer,
  withTenantWhere,
  isAdminRole,
  type AuthCtx,
} from "@/lib/auth-guard";

const admin: AuthCtx = { role: "ADMIN", userId: "admin-1" };
const contractor: AuthCtx = {
  role: "CONTRACTOR",
  userId: "user-1",
  customerIds: ["cust-A"],
};

describe("auth-guard", () => {
  it("scopeToCustomer allows admin to any customer", () => {
    expect(() => scopeToCustomer(admin, "cust-Z")).not.toThrow();
  });

  it("scopeToCustomer allows contractor only to linked customers", () => {
    expect(() => scopeToCustomer(contractor, "cust-A")).not.toThrow();
    expect(() => scopeToCustomer(contractor, "cust-B")).toThrow(ForbiddenError);
  });

  it("withTenantWhere returns empty for admin", () => {
    expect(withTenantWhere(admin)).toEqual({});
  });

  it("withTenantWhere scopes contractor by customerId in", () => {
    expect(withTenantWhere(contractor)).toEqual({ customerId: { in: ["cust-A"] } });
  });

  it("isAdminRole works", () => {
    expect(isAdminRole("ADMIN")).toBe(true);
    expect(isAdminRole("CONTRACTOR")).toBe(false);
  });
});

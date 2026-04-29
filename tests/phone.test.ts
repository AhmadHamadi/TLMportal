import { describe, it, expect } from "vitest";
import { toE164, formatNational, isE164 } from "@/lib/phone";

describe("phone", () => {
  it("normalizes 10-digit NA numbers to E.164", () => {
    expect(toE164("4165550123")).toBe("+14165550123");
    expect(toE164("(416) 555-0123")).toBe("+14165550123");
    expect(toE164("416-555-0123")).toBe("+14165550123");
  });

  it("preserves leading 1", () => {
    expect(toE164("14165550123")).toBe("+14165550123");
    expect(toE164("1-416-555-0123")).toBe("+14165550123");
  });

  it("preserves explicit + prefix", () => {
    expect(toE164("+14165550123")).toBe("+14165550123");
  });

  it("returns null for clearly invalid input", () => {
    expect(toE164("")).toBe(null);
    expect(toE164("abc")).toBe(null);
    expect(toE164("12345")).toBe(null);
  });

  it("isE164 validates", () => {
    expect(isE164("+14165550123")).toBe(true);
    expect(isE164("+1")).toBe(false);
    expect(isE164("4165550123")).toBe(false);
  });

  it("formats national", () => {
    expect(formatNational("+14165550123")).toBe("(416) 555-0123");
  });
});

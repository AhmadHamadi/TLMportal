import { z } from "zod";
import { isE164, toE164 } from "@/lib/phone";

export const cuid = z.string().min(1, "Required");

export const phoneE164 = z
  .string()
  .min(1, "Phone is required")
  .transform((s, ctx) => {
    const e = toE164(s);
    if (!e || !isE164(e)) {
      ctx.addIssue({ code: "custom", message: "Invalid phone number" });
      return z.NEVER;
    }
    return e;
  });

export const optionalPhoneE164 = z
  .string()
  .optional()
  .transform((s, ctx) => {
    if (!s || s.trim() === "") return null;
    const e = toE164(s);
    if (!e || !isE164(e)) {
      ctx.addIssue({ code: "custom", message: "Invalid phone number" });
      return z.NEVER;
    }
    return e;
  });

export const optionalString = z
  .string()
  .optional()
  .transform((s) => (s && s.trim() !== "" ? s.trim() : null));

export const optionalEmail = z
  .string()
  .optional()
  .transform((s, ctx) => {
    if (!s || s.trim() === "") return null;
    const e = z.string().email().safeParse(s);
    if (!e.success) {
      ctx.addIssue({ code: "custom", message: "Invalid email" });
      return z.NEVER;
    }
    return e.data.toLowerCase();
  });

export const moneyAmount = z
  .union([z.string(), z.number()])
  .transform((v, ctx) => {
    const n = typeof v === "string" ? Number(v) : v;
    if (!Number.isFinite(n) || n < 0) {
      ctx.addIssue({ code: "custom", message: "Invalid amount" });
      return z.NEVER;
    }
    return n.toFixed(2);
  });

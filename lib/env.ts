import "server-only";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  APP_URL: z.string().url().default("http://localhost:3000"),

  DATABASE_URL: z.string().url(),

  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 chars"),
  AUTH_URL: z.string().url().optional(),

  // Phase 2 — optional until Twilio integration lands
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_MESSAGING_SERVICE_SID: z.string().optional(),
  TWILIO_WEBHOOK_AUTH_TOKEN: z.string().optional(),

  // Phase 3 — optional until Stripe integration lands
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "Invalid environment variables:",
    JSON.stringify(z.treeifyError(parsed.error), null, 2),
  );
  throw new Error("Invalid environment variables");
}

export const env = parsed.data;
export type Env = typeof env;

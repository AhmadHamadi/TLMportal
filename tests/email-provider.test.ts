import { afterEach, describe, expect, it, vi } from "vitest";

const originalEnv = { ...process.env };

async function loadProvider(overrides: Record<string, string | undefined>) {
  vi.resetModules();
  process.env = { ...originalEnv, ...overrides };
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) delete process.env[key];
  }
  const mod = await import("@/lib/email");
  return mod.getEmailProvider();
}

afterEach(() => {
  process.env = { ...originalEnv };
  vi.resetModules();
});

describe("email provider selection", () => {
  it("uses Resend when Resend env vars are configured", async () => {
    await expect(
      loadProvider({
        EMAIL_PROVIDER: undefined,
        RESEND_API_KEY: "re_test",
        RESEND_FROM_EMAIL: "TLM <portal@example.com>",
        SMTP_HOST: undefined,
        SMTP_PORT: undefined,
        SMTP_USER: undefined,
        SMTP_PASSWORD: undefined,
        SMTP_FROM_EMAIL: undefined,
      }),
    ).resolves.toBe("resend");
  });

  it("uses SMTP when requested and configured", async () => {
    await expect(
      loadProvider({
        EMAIL_PROVIDER: "smtp",
        SMTP_HOST: "smtp.office365.com",
        SMTP_PORT: "587",
        SMTP_USER: "portal@example.com",
        SMTP_PASSWORD: "secret-password",
        SMTP_FROM_EMAIL: "TLM <portal@example.com>",
      }),
    ).resolves.toBe("smtp");
  });

  it("falls back to simulated when requested provider is incomplete", async () => {
    await expect(
      loadProvider({
        EMAIL_PROVIDER: "smtp",
        SMTP_HOST: "smtp.office365.com",
        SMTP_PORT: "587",
        SMTP_USER: undefined,
        SMTP_PASSWORD: undefined,
        SMTP_FROM_EMAIL: undefined,
        RESEND_API_KEY: undefined,
        RESEND_FROM_EMAIL: undefined,
      }),
    ).resolves.toBe("simulated");
  });
});

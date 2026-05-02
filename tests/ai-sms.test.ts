import { describe, it, expect, vi, beforeEach } from "vitest";

// Force the Anthropic-not-configured path so the test never reaches a real
// network call. We mock @/lib/ai because lib/ai-sms imports its helpers.
vi.mock("@/lib/ai", () => ({
  isAnthropicConfigured: () => false,
  getAnthropic: () => {
    throw new Error("getAnthropic should not be called when not configured");
  },
}));

describe("parseLeadReply (fallback when Anthropic not configured)", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns AVAILABILITY with the raw body as extractedTime", async () => {
    const { parseLeadReply } = await import("@/lib/ai-sms");
    const out = await parseLeadReply({ latestMessage: "Tuesday morning works" });
    expect(out.intent).toBe("AVAILABILITY");
    expect(out.extractedTime).toBe("Tuesday morning works");
    expect(out.needsClarification).toBe(false);
    expect(out.escalate).toBe(false);
  });

  it("flags an empty message as UNKNOWN with a clarifying question", async () => {
    const { parseLeadReply } = await import("@/lib/ai-sms");
    const out = await parseLeadReply({ latestMessage: "   " });
    expect(out.intent).toBe("UNKNOWN");
    expect(out.needsClarification).toBe(true);
    expect(out.clarifyingQuestionKey).toBe("ASK_DAY_AND_TIME");
  });

  it("clamps very long messages to 200 chars", async () => {
    const { parseLeadReply } = await import("@/lib/ai-sms");
    const long = "a".repeat(500);
    const out = await parseLeadReply({ latestMessage: long });
    expect(out.extractedTime?.length).toBe(200);
  });

  it("exposes a fixed allowlist of clarifying questions", async () => {
    const { CLARIFYING_QUESTIONS } = await import("@/lib/ai-sms");
    expect(Object.keys(CLARIFYING_QUESTIONS).sort()).toEqual([
      "ASK_BEST_NUMBER",
      "ASK_DAY_AND_TIME",
      "ASK_NARROWER_WINDOW",
      "ASK_PROJECT_DETAILS",
    ]);
    for (const q of Object.values(CLARIFYING_QUESTIONS)) {
      expect(typeof q).toBe("string");
      expect(q.length).toBeGreaterThan(10);
    }
  });
});

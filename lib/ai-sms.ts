import "server-only";
import { getAnthropic, isAnthropicConfigured } from "@/lib/ai";

export type LeadReplyIntent = "AVAILABILITY" | "QUESTION" | "COMPLAINT" | "OTHER" | "UNKNOWN";

export interface ParsedLeadReply {
  intent: LeadReplyIntent;
  /** A clean human-readable time string for the contractor SMS, e.g. "Tuesday morning" or "after 5pm Wed/Thu". */
  extractedTime: string | null;
  /** True if the message wasn't decisive enough to schedule and we should ask back. */
  needsClarification: boolean;
  /**
   * If needsClarification, an admin-pre-approved clarifying question to send back to the lead.
   * Drawn from a fixed allowlist by intent. Never free-form generated.
   */
  clarifyingQuestionKey:
    | "ASK_DAY_AND_TIME"
    | "ASK_NARROWER_WINDOW"
    | "ASK_BEST_NUMBER"
    | "ASK_PROJECT_DETAILS"
    | null;
  /** Whether to escalate this conversation to admin (e.g., abusive, complex, repeated unparseable). */
  escalate: boolean;
}

const FALLBACK_NLU: ParsedLeadReply = {
  intent: "AVAILABILITY",
  extractedTime: null,
  needsClarification: false,
  clarifyingQuestionKey: null,
  escalate: false,
};

const SYSTEM = `You parse SMS replies from prospective customers responding to estimate-availability questions for contractor lead-generation.

You return STRICT JSON matching this schema:
{
  "intent": "AVAILABILITY" | "QUESTION" | "COMPLAINT" | "OTHER" | "UNKNOWN",
  "extractedTime": string | null,
  "needsClarification": boolean,
  "clarifyingQuestionKey": "ASK_DAY_AND_TIME" | "ASK_NARROWER_WINDOW" | "ASK_BEST_NUMBER" | "ASK_PROJECT_DETAILS" | null,
  "escalate": boolean
}

Rules:
- If the lead gave a clear day/time window, set intent="AVAILABILITY", extractedTime to a concise human-readable string ("Tuesday morning", "Wed or Thu after 5pm", "any weekday between 9am-noon"), needsClarification=false.
- If the message is too vague ("anytime", "whenever", "soon"), needsClarification=true with clarifyingQuestionKey="ASK_NARROWER_WINDOW".
- If the lead asks a question (price, warranty, service details), intent="QUESTION" and escalate=true so admin can answer.
- If the lead is angry, abusive, or wants to cancel, intent="COMPLAINT", escalate=true.
- If the message has no obvious meaning, intent="UNKNOWN", needsClarification=true, clarifyingQuestionKey="ASK_DAY_AND_TIME".
- NEVER include prices, warranties, promises about specific arrival times, or any commitment in extractedTime — only what the lead literally said.
- NEVER add information the lead did not provide.

Return ONLY the JSON object. No prose before or after.`;

/**
 * Parses a lead's SMS reply about availability using Claude Haiku.
 * Falls back to a permissive default when ANTHROPIC_API_KEY is not configured
 * so the existing flow keeps working in dev / unconfigured environments.
 */
export async function parseLeadReply(args: {
  history?: { role: "lead" | "agent"; body: string }[];
  latestMessage: string;
}): Promise<ParsedLeadReply> {
  const trimmed = args.latestMessage.trim();
  if (!trimmed) {
    return { ...FALLBACK_NLU, intent: "UNKNOWN", needsClarification: true, clarifyingQuestionKey: "ASK_DAY_AND_TIME" };
  }
  if (!isAnthropicConfigured()) {
    // Without AI we treat the raw body as the preferredTime (existing behaviour).
    return { ...FALLBACK_NLU, extractedTime: trimmed.slice(0, 200) };
  }

  const client = getAnthropic();
  const conversation =
    (args.history ?? [])
      .slice(-6)
      .map((m) => `${m.role.toUpperCase()}: ${m.body}`)
      .join("\n") || "(no prior messages)";

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: `Recent conversation:\n${conversation}\n\nNew lead message:\n${trimmed}\n\nReturn the JSON.`,
        },
      ],
    });
    const text = message.content
      .filter((c) => c.type === "text")
      .map((c) => (c.type === "text" ? c.text : ""))
      .join("");
    const cleaned = text.replace(/```json\s*|\s*```/g, "").trim();
    const parsed = JSON.parse(cleaned) as Partial<ParsedLeadReply>;
    // Defensive coercion — if Haiku returns an unexpected shape, fall back gracefully.
    return {
      intent: (parsed.intent ?? "UNKNOWN") as LeadReplyIntent,
      extractedTime:
        typeof parsed.extractedTime === "string" && parsed.extractedTime.trim()
          ? parsed.extractedTime.slice(0, 200)
          : null,
      needsClarification: Boolean(parsed.needsClarification),
      clarifyingQuestionKey:
        parsed.clarifyingQuestionKey === "ASK_DAY_AND_TIME" ||
        parsed.clarifyingQuestionKey === "ASK_NARROWER_WINDOW" ||
        parsed.clarifyingQuestionKey === "ASK_BEST_NUMBER" ||
        parsed.clarifyingQuestionKey === "ASK_PROJECT_DETAILS"
          ? parsed.clarifyingQuestionKey
          : null,
      escalate: Boolean(parsed.escalate),
    };
  } catch {
    // Hard fallback — never let a flaky LLM call break the SMS flow.
    return { ...FALLBACK_NLU, extractedTime: trimmed.slice(0, 200) };
  }
}

export const CLARIFYING_QUESTIONS: Record<NonNullable<ParsedLeadReply["clarifyingQuestionKey"]>, string> = {
  ASK_DAY_AND_TIME: "Thanks. Which day and roughly what time works for the estimate? Even a 2-3 hour window helps.",
  ASK_NARROWER_WINDOW: "Got it. Could you narrow that to a day and a 2-3 hour window? It helps the contractor schedule.",
  ASK_BEST_NUMBER: "Thanks. What's the best phone number to confirm with you?",
  ASK_PROJECT_DETAILS: "Thanks. Briefly, what's the project? (e.g. driveway, patio, walkway, steps, garage pad)",
};

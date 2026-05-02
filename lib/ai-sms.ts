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

const SYSTEM = `<role>
You are an SMS reply classifier for a contractor lead-generation agency. You convert short text-message replies (from prospective home-services customers responding to "when works for an estimate?") into a strict JSON record. You never reply to the lead, never invent details, and never make commitments on behalf of the contractor or agency.
</role>

<output_schema>
Return EXACTLY this JSON shape — no prose, no code fences, no extra fields:
{
  "intent": "AVAILABILITY" | "QUESTION" | "COMPLAINT" | "OTHER" | "UNKNOWN",
  "extractedTime": string | null,
  "needsClarification": boolean,
  "clarifyingQuestionKey": "ASK_DAY_AND_TIME" | "ASK_NARROWER_WINDOW" | "ASK_BEST_NUMBER" | "ASK_PROJECT_DETAILS" | null,
  "escalate": boolean
}
</output_schema>

<intent_definitions>
- AVAILABILITY: lead is offering or refining a date/time window. Default for booking-flow replies even if frustrated.
- QUESTION: lead is asking the agency or contractor a question (price, warranty, service detail, scope, scheduling logistics). Set extractedTime=null. Escalate ONLY when the question is about price, warranty, refunds, contracts, or anything legal/regulatory; routine logistics ("how long does the estimate take?") get clarifyingQuestionKey=null and escalate=false — admin will see it via QUESTION + needsClarification=false.
- COMPLAINT: lead is asking to stop, cancel, opt out (STOP / UNSUBSCRIBE / "leave me alone" / "remove me" / "don't text me"), threatening legal action, or sustained abuse. Always escalate.
- OTHER: a coherent message that doesn't fit any category above (chit-chat, accidental message, off-topic).
- UNKNOWN: message is unparseable, garbled, or could be a wrong number ("who is this?", random characters).
</intent_definitions>

<extraction_rules>
- Treat phonetic / autocorrect typos as their canonical form (tues/tuseday → Tuesday; mornin/mornign → morning).
- Normalize abbreviations: EOD/COB = "after 4pm"; lunchtime = "around noon"; ASAP = NOT a time (set extractedTime=null and clarifyingQuestionKey=ASK_NARROWER_WINDOW).
- "anytime" / "whenever" / "soon" / "flexible" = vague. extractedTime=null, needsClarification=true, clarifyingQuestionKey=ASK_NARROWER_WINDOW.
- If the reply is in French or Spanish, parse it normally and emit extractedTime in English.
- If the message has BOTH a clear time AND a question, return intent=AVAILABILITY with extractedTime, AND escalate=true so an admin sees the question.
- Frustration without a request to cancel/stop is NOT COMPLAINT. A frustrated availability reply is still AVAILABILITY.
- Never include prices, warranties, arrival promises, or anything the lead did not literally write in extractedTime.
</extraction_rules>

<clarifying_question_keys>
- ASK_DAY_AND_TIME: use when intent=UNKNOWN to invite a fresh, structured reply.
- ASK_NARROWER_WINDOW: use when intent=AVAILABILITY but the window is too vague to schedule.
- ASK_BEST_NUMBER: use when reply suggests a different phone is better but doesn't give one.
- ASK_PROJECT_DETAILS: use when reply is on-topic but the project scope is unclear and needed before booking.
- null: use when no clarifying question should be sent.
</clarifying_question_keys>

<examples>
<example>
<input>tues morning works</input>
<output>{"intent":"AVAILABILITY","extractedTime":"Tuesday morning","needsClarification":false,"clarifyingQuestionKey":null,"escalate":false}</output>
</example>
<example>
<input>anytime really</input>
<output>{"intent":"AVAILABILITY","extractedTime":null,"needsClarification":true,"clarifyingQuestionKey":"ASK_NARROWER_WINDOW","escalate":false}</output>
</example>
<example>
<input>yeah wed after 5 works, also how much do you charge for an estimate?</input>
<output>{"intent":"AVAILABILITY","extractedTime":"Wednesday after 5pm","needsClarification":false,"clarifyingQuestionKey":null,"escalate":true}</output>
</example>
<example>
<input>stop texting me</input>
<output>{"intent":"COMPLAINT","extractedTime":null,"needsClarification":false,"clarifyingQuestionKey":null,"escalate":true}</output>
</example>
<example>
<input>mardi matin si possible</input>
<output>{"intent":"AVAILABILITY","extractedTime":"Tuesday morning","needsClarification":false,"clarifyingQuestionKey":null,"escalate":false}</output>
</example>
<example>
<input>who is this lol</input>
<output>{"intent":"UNKNOWN","extractedTime":null,"needsClarification":true,"clarifyingQuestionKey":"ASK_DAY_AND_TIME","escalate":false}</output>
</example>
</examples>

<output_format>
Return ONLY the raw JSON object. No code fences, no commentary, no XML tags around the output.
</output_format>`;

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

import "server-only";
import { db } from "@/lib/db";
import { getAnthropic, isAnthropicConfigured } from "@/lib/ai";
import { writeAudit } from "./audit";
import { ForbiddenError, scopeToCustomer, type AuthCtx } from "@/lib/auth-guard";

export interface AdRecommendationInput {
  customerId: string;
  landingPageUrl?: string | null;
  recentMetrics?: {
    spend?: number;
    impressions?: number;
    clicks?: number;
    conversions?: number;
    notes?: string;
  };
  freeFormContext?: string;
}

export interface AdRecommendation {
  summary: string;
  recommendations: Array<{
    category: "Keywords" | "Negative keywords" | "Ad copy" | "Landing page" | "Bidding" | "Targeting";
    title: string;
    detail: string;
    priority: "high" | "medium" | "low";
  }>;
  warnings: string[];
}

const SYSTEM = `You are a senior Google Ads strategist for a Canadian agency that runs lead-generation campaigns for residential contractors (concrete, roofing, HVAC, paving, landscaping).

You produce recommendations that are:
- Specific and actionable. No platitudes.
- Conversion-focused. We optimize for booked-estimate phone calls and form submissions, not impressions.
- Cost-aware. Default to small, tight Search campaigns with strict negative-keyword lists.
- Compliant. Never recommend prices, discounts, or warranties unless the contractor's brief explicitly authorizes them.

Always return valid JSON matching the requested schema. No prose outside the JSON.`;

const SCHEMA_HINT = `{
  "summary": "1-2 sentence executive overview of the recommendation set.",
  "recommendations": [
    { "category": "Keywords" | "Negative keywords" | "Ad copy" | "Landing page" | "Bidding" | "Targeting", "title": "short", "detail": "specific actionable detail", "priority": "high" | "medium" | "low" }
  ],
  "warnings": ["short flags (e.g. 'CTR below 2%, audit ad relevance')"]
}`;

async function fetchLandingPageText(url: string): Promise<string> {
  try {
    const r = await fetch(url, {
      headers: { "User-Agent": "TLMPortal/1.0 (+https://tradeleadsmarketing.ca)" },
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) return "";
    const html = await r.text();
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .slice(0, 8000);
  } catch {
    return "";
  }
}

export async function generateAdRecommendations(
  ctx: AuthCtx,
  input: AdRecommendationInput,
): Promise<AdRecommendation> {
  if (ctx.role !== "ADMIN") throw new ForbiddenError();
  scopeToCustomer(ctx, input.customerId);
  if (!isAnthropicConfigured()) {
    throw new Error("ANTHROPIC_API_KEY not set — add it to .env to use AI recommendations.");
  }

  const customer = await db.customer.findUnique({
    where: { id: input.customerId },
    include: {
      services: { where: { isActive: true } },
      serviceAreas: { where: { isActive: true } },
    },
  });
  if (!customer) throw new Error("Customer not found");

  const landingText = input.landingPageUrl
    ? await fetchLandingPageText(input.landingPageUrl)
    : "";

  const userPayload = {
    customer: {
      businessName: customer.businessName,
      industry: customer.industry,
      services: customer.services.map((s) => s.name),
      serviceAreas: customer.serviceAreas.map((a) =>
        [a.city, a.neighbourhood].filter(Boolean).join(" — "),
      ),
      monthlyAdBudget: customer.monthlyAdBudget.toString(),
      minProjectSize: customer.minProjectSize?.toString() ?? null,
    },
    landingPage: {
      url: input.landingPageUrl ?? customer.landingPageUrl,
      extractedText: landingText
        ? landingText.slice(0, 6000)
        : "(landing page not provided or could not be fetched)",
    },
    metrics: input.recentMetrics ?? null,
    notesFromAdmin: input.freeFormContext ?? null,
  };

  const client = getAnthropic();
  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2000,
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: `Analyze the following Google Ads situation for a contractor we manage and return recommendations strictly as JSON matching this schema:\n\n${SCHEMA_HINT}\n\nCONTEXT:\n${JSON.stringify(userPayload, null, 2)}\n\nReturn only the JSON object, no prose.`,
      },
    ],
  });

  const text = message.content
    .filter((c) => c.type === "text")
    .map((c) => (c.type === "text" ? c.text : ""))
    .join("");
  const cleaned = text.replace(/```json\s*|\s*```/g, "").trim();
  let parsed: AdRecommendation;
  try {
    parsed = JSON.parse(cleaned) as AdRecommendation;
  } catch {
    throw new Error("AI returned malformed JSON; try again.");
  }

  await writeAudit({
    userId: ctx.userId,
    customerId: input.customerId,
    action: "AD_RECOMMENDATIONS_GENERATED",
    entityType: "Customer",
    entityId: input.customerId,
    metadata: {
      landingFetched: Boolean(landingText),
      recsCount: parsed.recommendations?.length ?? 0,
    },
  });

  return parsed;
}

export { isAnthropicConfigured };

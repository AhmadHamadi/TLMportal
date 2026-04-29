"use server";

import { z } from "zod";
import { requireAdmin } from "@/lib/auth-guard";
import {
  generateAdRecommendations,
  type AdRecommendation,
} from "@/server/services/ad-recommendations";

const schema = z.object({
  customerId: z.string().min(1),
  landingPageUrl: z.string().url().optional().or(z.literal("")),
  spend: z.string().optional(),
  impressions: z.string().optional(),
  clicks: z.string().optional(),
  conversions: z.string().optional(),
  notes: z.string().optional(),
});

export type RecResult =
  | { ok: true; data: AdRecommendation }
  | { ok: false; error: string };

export async function generateRecommendationsAction(
  _prev: RecResult | undefined,
  formData: FormData,
): Promise<RecResult> {
  const ctx = await requireAdmin();
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  try {
    const num = (s?: string) => (s && s.trim() ? Number(s) : undefined);
    const data = await generateAdRecommendations(ctx, {
      customerId: parsed.data.customerId,
      landingPageUrl: parsed.data.landingPageUrl || undefined,
      recentMetrics: {
        spend: num(parsed.data.spend),
        impressions: num(parsed.data.impressions),
        clicks: num(parsed.data.clicks),
        conversions: num(parsed.data.conversions),
        notes: parsed.data.notes,
      },
      freeFormContext: parsed.data.notes,
    });
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to generate recommendations",
    };
  }
}

import { z } from "zod";
import { optionalString } from "./shared";

export const ONBOARDING_TYPES = [
  "LANDING_PAGE_REBUILD",
  "FULL_WEBSITE_REBUILD",
  "SEO_SETUP",
  "GOOGLE_ADS_CAMPAIGNS",
  "GOOGLE_BUSINESS_PROFILE",
  "CALL_TRACKING_SETUP",
  "CONVERSION_GOALS",
  "BRAND_ASSETS",
  "DOMAIN_DNS_ACCESS",
  "OTHER",
] as const;

export const ONBOARDING_STATUSES = ["TODO", "IN_PROGRESS", "BLOCKED", "DONE"] as const;

export const onboardingCreateSchema = z.object({
  customerId: z.string().min(1),
  type: z.enum(ONBOARDING_TYPES),
  title: z.string().min(2),
  prompt: optionalString,
  notes: optionalString,
  status: z.enum(ONBOARDING_STATUSES).default("TODO"),
});
export type OnboardingCreateInput = z.infer<typeof onboardingCreateSchema>;

export const onboardingUpdateSchema = z.object({
  id: z.string().min(1),
  status: z.enum(ONBOARDING_STATUSES),
  prompt: optionalString,
  notes: optionalString,
});
export type OnboardingUpdateInput = z.infer<typeof onboardingUpdateSchema>;

// Default prompt templates the admin can spawn for a new customer's onboarding.
export const ONBOARDING_PRESETS: Record<
  (typeof ONBOARDING_TYPES)[number],
  { title: string; prompt: string }
> = {
  LANDING_PAGE_REBUILD: {
    title: "Landing page rebuild",
    prompt:
      "Build a single-service landing page for {{businessName}} ({{industry}}). Headline: convert local homeowners searching for {{primaryService}}. Hero photo from contractor. Primary CTA: free quote. Phone: {{trackingNumber}} (NOT contractor's real number). Form posts to /api/leads. Trust signals: real reviews, before/after photos, license/insurance.",
  },
  FULL_WEBSITE_REBUILD: {
    title: "Full website rebuild",
    prompt:
      "Build a 5-page contractor site for {{businessName}}: Home, Services, Service Areas, About, Contact. Tech: Next.js + Tailwind. Geo-target: {{primaryServiceArea}}. Conversion priority: phone calls then form submissions. Pull copy from existing site if present. Replace contractor's direct number with the assigned tracking number.",
  },
  SEO_SETUP: {
    title: "Local SEO setup",
    prompt:
      "Local SEO for {{businessName}} in {{primaryServiceArea}}: GBP optimisation (categories, services, products, posts), schema markup (LocalBusiness + Service), citation cleanup (Yelp, BBB, etc.), service-area pages for each city in scope. Track rankings for top 10 commercial keywords.",
  },
  GOOGLE_ADS_CAMPAIGNS: {
    title: "Google Ads campaigns",
    prompt:
      "Google Ads campaign structure for {{businessName}}: 1 Search campaign per service ({{services}}), tight match types, negative keyword list (DIY, jobs, salary, free). Conversion tracking via call extensions + form submissions to /api/leads webhook. Budget: ${{monthlyAdBudget}}/mo. Bid strategy: maximize conversions. Geo: {{serviceAreas}}.",
  },
  GOOGLE_BUSINESS_PROFILE: {
    title: "Google Business Profile setup",
    prompt:
      "GBP for {{businessName}}: claim/verify, primary category {{primaryService}}, secondary categories, services list, products, hours, photos (before/after, team, equipment), Q&A seeded, weekly Google Posts schedule. Review request automation via call/SMS post-job.",
  },
  CALL_TRACKING_SETUP: {
    title: "Call tracking setup",
    prompt:
      "Provision Twilio tracking number, configure forwarding to {{forwardingPhone}}, ensure landing page + GBP + ad extensions all use the tracking number (not contractor's real number). Verify call logs flow into /admin/calls.",
  },
  CONVERSION_GOALS: {
    title: "Conversion goals + analytics",
    prompt:
      "Define billable-conversion criteria: confirmed estimate appointment via {{forwardingPhone}} ≥ 30s call OR landing page form submission with valid phone in {{serviceAreas}} for {{services}}. Wire GA4 + Google Ads conversion events.",
  },
  BRAND_ASSETS: {
    title: "Brand assets handoff",
    prompt:
      "Collect from contractor: logo (SVG + PNG), brand colors, fonts, photo library (jobs, team, trucks), license + insurance certificates, headshot of owner/contact, any existing video.",
  },
  DOMAIN_DNS_ACCESS: {
    title: "Domain + DNS access",
    prompt:
      "Get registrar credentials or DNS-only access (preferred). Add CNAME to Vercel for the new site. Set up email forwarding if domain hosts email. Document in 1Password vault for {{businessName}}.",
  },
  OTHER: { title: "Other onboarding task", prompt: "" },
};

// Reusable prompt library for the agency. Templates are written for one
// purpose: feed them into a code-generating LLM (Cursor / Claude Code / etc.)
// to scaffold landing pages, full sites, GBP entries, and Google Ads campaigns
// for any kind of contractor.
//
// Variables use {{var}} and are filled per-customer from the Customer record:
//   businessName, contactName, industry, primaryService, primaryServiceArea,
//   serviceAreas, services, forwardingPhone, monthlyAdBudget,
//   landingPageUrl, websiteUrl

export type PromptCategory =
  | "LANDING_PAGE"
  | "FULL_WEBSITE"
  | "GBP"
  | "GOOGLE_ADS"
  | "SEO"
  | "ONBOARDING_INTAKE"
  | "EMAIL"
  | "REVIEW_REQUEST";

export type Niche =
  | "Concrete"
  | "Roofing"
  | "HVAC"
  | "Landscaping"
  | "Plumbing"
  | "Electrical"
  | "Paving"
  | "Painting"
  | "Renovation"
  | "Cleaning"
  | "Pest Control"
  | "General";

export interface PromptTemplate {
  id: string;
  category: PromptCategory;
  niches: Niche[];
  title: string;
  description: string;
  body: string;
}

export const PROMPT_LIBRARY: PromptTemplate[] = [
  {
    id: "landing.general",
    category: "LANDING_PAGE",
    niches: ["General"],
    title: "Single-service landing page (any niche)",
    description:
      "Conversion-focused single-page landing for one specific service. Uses the assigned tracking number (never the contractor's real number) and posts to /api/leads.",
    body: `Build a single-service landing page for {{businessName}} ({{industry}}).

Target keyword bucket: homeowners in {{primaryServiceArea}} searching for {{primaryService}}.

Stack: Next.js App Router + Tailwind + shadcn/ui. Server components by default. No client-side state for the form — submit to /api/leads (POST, JSON: customerId="{{customerId}}", source="LANDING_PAGE_FORM", firstName, phone, email, city, serviceRequested="{{primaryService}}", projectDetails).

Sections, in order:
1. Hero with H1 ("{{primaryService}} in {{primaryServiceArea}}"), one-sentence subhead, click-to-call to {{trackingNumber}}, primary CTA "Get a free quote".
2. Three trust signals (real reviews, license/insurance, before/after photos — placeholders OK).
3. Services list with the 3-5 specific {{primaryService}} types.
4. Service-area list ({{serviceAreas}}).
5. Estimate request form with phone, email, city, project notes.
6. FAQ (3-5 items).
7. Footer with {{trackingNumber}}, address (placeholder), social links.

Rules:
- Tracking phone {{trackingNumber}} everywhere. Never the contractor's real number.
- No prices, discounts, warranties, or guaranteed timelines.
- Mobile-first. Form must be reachable in one thumb-scroll on iPhone SE.
- Lighthouse mobile performance must be 90+.`,
  },

  {
    id: "fullsite.general",
    category: "FULL_WEBSITE",
    niches: ["General"],
    title: "5-page contractor website",
    description:
      "Full marketing site: Home, Services, Service Areas, About, Contact. Conversion priority is phone calls then form submissions.",
    body: `Build a 5-page contractor site for {{businessName}} ({{industry}}).

Pages: Home, Services, Service Areas, About, Contact.

Stack: Next.js App Router + Tailwind + shadcn/ui. Server components, MDX for static content.

Conversion priority order: phone calls > form submissions > email.

Geo: {{primaryServiceArea}}. Service areas: {{serviceAreas}}.

Services to feature: {{services}}.

Required:
- Replace contractor's direct number with the assigned tracking number {{trackingNumber}} on every page.
- Click-to-call sticky button on mobile.
- Estimate form on every service-area page, posts to /api/leads.
- LocalBusiness + Service schema markup.
- One service-area landing page per city ({{serviceAreas}}) with local copy.
- Footer with hours, phone, address.
- About page with photos, license/insurance proof, owner bio (placeholder OK).

Pull copy from the existing site if present ({{websiteUrl}}). Rewrite in plain language. Keep it tight: no AI-generated paragraphs about "passion for craftsmanship".`,
  },

  {
    id: "gbp.general",
    category: "GBP",
    niches: ["General"],
    title: "Google Business Profile setup",
    description: "Optimize the contractor's GBP for local pack visibility.",
    body: `Set up Google Business Profile for {{businessName}} ({{industry}}).

Steps:
1. Claim/verify if not already.
2. Primary category: most specific Google category for {{primaryService}} (e.g. "Concrete contractor", "Roofing contractor").
3. Secondary categories: 2-3 related (e.g. "Driveway contractor", "Patio enclosure supplier").
4. Service areas: {{serviceAreas}}.
5. Services list: {{services}} — each with description and price range left blank.
6. Hours: Mon-Fri 8am-6pm by default; ask {{contactName}} to confirm.
7. Photos: minimum 10 (3 of crew, 3 before/after, 2 of trucks/equipment, 2 of completed jobs).
8. Q&A: pre-seed 5 common questions ("Do you offer free estimates?", "Are you licensed and insured?", etc.) and answer them yourself.
9. Posts: 1 weekly Google Post (project of the week, before/after) for the first 8 weeks.
10. Reviews: enable review requests via post-call SMS, target 5+ new reviews in month 1.

Phone field on GBP: {{trackingNumber}} (NOT contractor's real number).
Website field: {{websiteUrl}} or {{landingPageUrl}}.`,
  },

  {
    id: "ads.general",
    category: "GOOGLE_ADS",
    niches: ["General"],
    title: "Google Ads campaign structure (any niche)",
    description: "Tight Search campaigns, one per service, with strict negatives.",
    body: `Build Google Ads campaigns for {{businessName}} ({{industry}}). MCC under our agency.

Structure: 1 Search campaign per service in {{services}}. Inside each:
- 2 ad groups: "{{primaryService}} [city]" and "{{primaryService}} contractor [city]".
- Match types: phrase + exact only. No broad.
- Bidding: maximize conversions (move to tCPA after 30 conversions).
- Geo: {{serviceAreas}}, presence-based not interest.
- Languages: English.
- Schedule: business hours + 1h either side.
- Devices: mobile +20% bid mod (most contractor leads call from mobile).

Negative keyword list (apply to every campaign):
- diy, do it yourself, materials, supplies, wholesale
- jobs, hiring, salary, careers, employment, apprentice
- free, cheap, lowest price, discount
- review, reviews, complaints, lawsuits
- school, training, course, certification
- wholesale, supplier, manufacturer
- residential | commercial — keep only the one that matches scope

Conversion tracking: form submission to /api/leads + call from ads ≥30s. Both must report to Google Ads via gtag + offline conversion uploads (we'll wire offline conv uploads later).

Ad copy rules:
- Headlines: include {{primaryService}}, location, "free quote".
- No prices, no discounts, no fake urgency.
- Sitelinks: services list, service area page, reviews, contact.
- Callouts: "Licensed & insured", "Local crew", "Free estimates", "Same-week service" (only if true).
- Call extension: {{trackingNumber}}.

Budget: \${{monthlyAdBudget}}/mo. Allocate proportionally across services by historical conversion volume; default equal split for week 1.`,
  },

  {
    id: "seo.general",
    category: "SEO",
    niches: ["General"],
    title: "Local SEO + content cluster",
    description: "On-page + content + citations for local rankings.",
    body: `Local SEO for {{businessName}} in {{primaryServiceArea}}.

On-page:
- Title tag template: "{{primaryService}} in [city] | {{businessName}}".
- H1 matches title, one per page.
- Schema: LocalBusiness + Service per service page.
- Internal linking: home -> service pages -> service-area pages.

Content:
- Service-area page per city in {{serviceAreas}} (700-1000 words each, locally relevant copy, embedded GBP map).
- Service-detail page per service in {{services}} (800-1200 words, FAQs, photos).
- Cornerstone: "Cost guide for {{primaryService}} in {{primaryServiceArea}}" — no specific prices unless contractor approves.

Off-page:
- Citation cleanup on top 30 directories (Yelp, BBB, Houzz, HomeStars in Canada, etc.) — name/address/phone consistent everywhere with the tracking number {{trackingNumber}}.
- 5-10 niche-relevant local backlinks per quarter.
- Reviews: 5+ new GBP reviews/month, respond to every one within 48h.

Tracking: GA4 + Search Console + GBP Insights connected to looker studio dashboard.`,
  },

  {
    id: "intake.general",
    category: "ONBOARDING_INTAKE",
    niches: ["General"],
    title: "Onboarding intake call agenda",
    description: "30-minute intake structure for new contractor onboarding.",
    body: `Intake call agenda for {{businessName}} ({{industry}}).

30 minutes, recorded with consent.

1. Business basics (3 min)
   - Confirm legal name, DBA, address, EIN.
   - Years in business, team size, service vehicles.
   - Insurance + license details.

2. Services + pricing tiers (5 min)
   - Top 3 services by revenue.
   - Min and max project size you'll quote.
   - Services to exclude (commercial only, residential only, etc.).

3. Service area (3 min)
   - Cities you work in.
   - Cities you specifically don't work in.
   - Drive-time limit.

4. Lead handling (5 min)
   - How you currently get leads.
   - Who answers the phone — owner or scheduler?
   - Hours you can take calls vs. voicemail.
   - Follow-up speed expectation (we recommend <5 min).

5. Tracking + tooling (5 min)
   - Existing GBP claimed?
   - Domain registrar access?
   - Existing Google Ads / GA4 / Search Console?
   - Existing CRM or spreadsheet?

6. Goals + concerns (5 min)
   - Confirmed jobs/month target.
   - Average project value.
   - Biggest pain point right now.
   - Anything that'll make this not work? (vacations, capacity caps, etc.)

7. Next steps (4 min)
   - Send brand-asset request email.
   - Send DocuSign for MSA.
   - Schedule kickoff in 5-7 days once assets arrive.`,
  },

  {
    id: "review.general",
    category: "REVIEW_REQUEST",
    niches: ["General"],
    title: "Post-job review request SMS",
    description: "Sent 24h after job completion. Drives Google reviews.",
    body: `Hi {{firstName}}, thanks again for choosing {{businessName}} for your {{primaryService}}. If we did good work, would you mind leaving a quick Google review? It helps a small local business a lot. {{reviewLink}}`,
  },
];

// Niche-flavored variants — these get loaded as additional templates the
// admin can copy with one click on the customer detail page.
export const NICHE_LANDING_VARIANTS: Record<Niche, string> = {
  Concrete:
    "Hero photo: freshly poured driveway with broom finish. Trust signals: licensed concrete contractor, ICPI member if applicable, 1-year workmanship warranty (only if the contractor confirms), real before/after photos. Services: driveways, sidewalks, patios, steps, curbs, foundations. Project size emphasis: residential 200-2,000 sqft pours.",
  Roofing:
    "Hero photo: completed shingle re-roof. Trust signals: GAF/Owens Corning certified (if applicable), workmanship warranty, drone roof inspection mention. Services: full re-roof, repairs, leak triage, gutters, flashing, ventilation. Note insurance-claim help if contractor offers it.",
  HVAC:
    "Hero focus: emergency response time and licensed/bonded technicians. Services: AC install/repair, furnace install/repair, ductwork, heat pumps, IAQ. Highlight 24/7 emergency line if available. Mention government rebate help (Greener Homes / Enbridge) if applicable.",
  Landscaping:
    "Hero photo: a finished hardscape + softscape combo. Services: design, sod, paver patios, retaining walls, garden beds, irrigation, lighting, fall/spring cleanup, snow removal (winter mode toggle). Emphasize portfolio + 3D design previews if offered.",
  Plumbing:
    "Hero focus: same-day service. Services: drain cleaning, water heater, leaks, fixtures, repipe, sump pumps, sewer line repair. Mention licensing/red seal cert. Note emergency line if 24/7. Photos of clean trucks and uniformed techs.",
  Electrical:
    "Hero focus: licensed/master electrician. Services: panel upgrades, EV chargers, knob-and-tube replacement, generators, smart home, lighting. Mention ESA permits + safety inspections in copy. Photos showing certifications.",
  Paving:
    "Hero photo: fresh asphalt driveway. Services: asphalt driveways, sealcoating, parking lots, repairs, line painting. Emphasize season window (Apr-Oct in Canada). Photos: roller in action.",
  Painting:
    "Hero photo: clean cut-in trim. Services: interior, exterior, cabinets, decks, commercial. Mention Benjamin Moore/Sherwin-Williams partnership if applicable. Photos: drop-cloth-covered floors, spray-painted exteriors.",
  Renovation:
    "Hero focus: design-build process + portfolio gallery. Services: kitchens, baths, basements, additions, full home remodels. Highlight project management + single point of contact. Insurance + permit handling mentioned explicitly.",
  Cleaning:
    "Hero focus: same-day quote, recurring vs one-time. Services: residential, move-in/out, post-construction, commercial. Bonded + insured + background-checked. Photos: branded uniforms, marked vehicles.",
  "Pest Control":
    "Hero focus: licensed exterminator + integrated pest management. Services: ants, rodents, wasps, termites, bedbugs. Mention pet-safe options + warranty on follow-up visits.",
  General:
    "Generic contractor positioning. Pick the photo that matches the contractor's actual primary service. Avoid stock-photo vibes.",
};

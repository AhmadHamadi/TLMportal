# TLM Expert Brain Prompt Map

Use this document to build a NotebookLM notebook, ChatGPT Project, or Claude Project that understands the portal's marketing, lead generation, onboarding, SMS, billing, and contractor workflow topics.

The goal is not to create a 24/7 autonomous agent. The goal is to create an expert advisor that can answer questions like:

- "This contractor website is not ranking. What should we fix first?"
- "What Google Ads setup should we use for a concrete contractor with a 1500/month budget?"
- "Write a landing page prompt for a roofing contractor in Toronto."
- "Audit our SMS appointment flow."
- "What should a monthly client report say?"

## Existing Portal Prompt Inventory

### Prompt Library

Source: `lib/prompt-library.ts`

Current production prompt topics:

- Single-service contractor landing pages.
- Five-page contractor websites.
- Google Business Profile setup.
- Google Ads Search campaign structure.
- Local SEO and content clusters.
- Contractor onboarding intake calls.
- Post-job Google review request SMS.
- Niche landing-page variants.

Supported contractor niches:

- Concrete
- Roofing
- HVAC
- Landscaping
- Plumbing
- Electrical
- Paving
- Painting
- Renovation
- Cleaning
- Pest Control
- General contractors

### AI Ad Recommendations

Source: `server/services/ad-recommendations.ts`

Current system role:

- Senior Google Ads strategist for a Canadian agency running residential contractor lead-generation campaigns.
- Focuses on booked-estimate calls and form submissions, not vanity metrics.
- Defaults to tight Search campaigns, strict negative keywords, and cost-aware recommendations.
- Avoids prices, discounts, warranties, or guarantees unless explicitly authorized.

Recommendation categories:

- Keywords
- Negative keywords
- Ad copy
- Landing page
- Bidding
- Targeting

### SMS Templates

Source: `lib/sms-templates.ts`

Current SMS workflow topics:

- Ask lead for availability.
- Confirm availability was received.
- Ask for project details.
- Ask for photos.
- Send contractor a proposed appointment.
- Contractor replies with YES, BUSY, NO, or BAD.
- Confirm appointment to lead.
- Ask lead for a new time if contractor is busy.
- Missed-call text-back.
- Monthly Google Ads budget confirmation.

SMS guardrails:

- Keep messages short.
- Do not promise exact arrival times.
- Do not promise prices, discounts, warranties, or guaranteed results.
- Keep contractor reply parsing deterministic.

### Operations And Research Docs

Good NotebookLM sources already in this repo:

- `docs/CLIENT_SETUP_PLAYBOOK.md`
- `docs/SMS_APPOINTMENT_WORKFLOW.md`
- `docs/LEAD_VISIBILITY_BILLING_POLICY.md`
- `docs/AGENCY_WORKFLOW_RESEARCH.md`
- `docs/AI_MCP_OPPORTUNITIES.md`
- `docs/CLIENT_ONBOARDING_ACCESS.md`
- `docs/OPERATIONS.md`
- `docs/COMPETITIVE_REVIEW.md`
- `AGENTS.md`
- `CLAUDE.md`

## NotebookLM Setup

Create notebooks by topic instead of one giant messy notebook.

Recommended notebooks:

1. `TLM Contractor Marketing Brain`
2. `TLM Google Ads Brain`
3. `TLM Local SEO And GBP Brain`
4. `TLM Landing Page And Website Brain`
5. `TLM SMS Appointment Workflow Brain`
6. `TLM Billing And Lead Visibility Brain`
7. `TLM Client Onboarding Brain`

Start with repo docs as sources, then add web sources from NotebookLM search.

## Source Search Prompts

Use these in NotebookLM's "Search the web for new sources" box.

### Google Ads For Contractors

```text
best Google Ads strategy for local contractors by monthly budget lead generation home services 2025 2026
```

```text
Google Ads home services campaign structure small budget medium budget large budget Search Ads Local Services Ads
```

```text
Google Ads conversion tracking phone calls form submissions booked appointments contractors
```

```text
Google Ads negative keywords for plumbing HVAC roofing concrete landscaping contractors
```

```text
Google Ads bidding strategy for local lead generation maximize conversions target CPA home services
```

### Landing Pages And Websites

```text
contractor landing page best practices lead generation phone calls form submissions 2026
```

```text
home services website conversion rate optimization contractor landing pages examples
```

```text
local service business landing page structure trust signals reviews photos FAQ call tracking
```

```text
roofing HVAC plumbing concrete landscaping website SEO landing page best practices
```

### Local SEO And GBP

```text
local SEO for contractors Google Business Profile service area business best practices 2026
```

```text
Google Business Profile optimization for home service contractors services photos posts reviews
```

```text
service area pages local SEO contractors city pages internal linking schema
```

```text
contractor SEO content clusters service pages location pages review strategy
```

### Lead Quality And Appointment Setting

```text
home services lead qualification booked appointment workflow SMS contractor lead generation
```

```text
speed to lead home services SMS follow up missed call text back contractor leads
```

```text
pay per appointment contractor lead generation billing model best practices
```

```text
call tracking for contractors lead attribution booked appointment reporting
```

### Client Reporting And Retention

```text
monthly marketing report for contractors leads booked appointments ad spend cost per lead
```

```text
agency client reporting home services lead generation simple dashboard metrics
```

```text
contractor marketing KPI leads calls appointments Google Ads spend local SEO
```

## Master Advisor Prompt

Use this as the custom instruction for a ChatGPT Project or Claude Project.

```text
You are the TLM Expert Brain for Trade Leads Marketing, a Canadian contractor lead-generation agency and portal.

Your job is to help with contractor marketing strategy, Google Ads, landing pages, local SEO, Google Business Profile, SMS appointment workflows, call tracking, lead visibility, onboarding, billing policy, and monthly reporting.

Core business model:
- TLM helps residential contractors get leads, calls, texts, and booked estimate appointments.
- The portal tracks customers, leads, appointments, SMS, call logs, ad spend, billing, disputes/internal reviews, onboarding, and reports.
- Contractors should see simple client-facing terms: leads, booked appointments, call logs, ad spend, settings, and reports.
- Internal billing/review logic can be more detailed, but client-facing language must stay simple.

Marketing rules:
- Focus on booked estimate appointments and qualified phone/form leads, not impressions or vanity metrics.
- Prefer tight campaigns and specific service pages over generic broad campaigns.
- Use plain local contractor language. Avoid hype.
- Do not promise guaranteed rankings, guaranteed leads, guaranteed timelines, prices, discounts, or warranties unless a contractor explicitly authorizes it.
- Use tracking numbers in landing pages, GBP, ads, and call CTAs when TLM is measuring leads.

Google Ads rules:
- For small budgets, prefer focused Search campaigns around one or two high-intent services and tight geos.
- Use phrase and exact match first; avoid broad match until there is enough conversion data and strong negatives.
- Use strict negative keyword lists.
- Track phone calls, forms, booked appointments, and eventually offline qualified conversions.
- Budget strategy must change by budget level.

Website and landing page rules:
- Mobile-first.
- Clear H1 with service and city/area.
- Phone CTA and estimate form must be easy to reach.
- Include trust signals, services, service areas, photos, reviews, FAQ, and schema.
- Do not write vague AI filler like "passion for craftsmanship."

SMS and appointment workflow rules:
- Messages must be short, clear, and non-promissory.
- Contractor replies are constrained to YES, BUSY, NO, and BAD unless a human admin intervenes.
- AI may suggest, summarize, and draft, but it should not silently make billing or dispute decisions.

When answering:
- Be practical and specific.
- Use checklists, budget tables, and priority order when helpful.
- Say what to do first, second, and third.
- Separate client-facing advice from internal admin advice.
- If sources disagree or are missing, say what should be verified.
```

## Reusable Question Prompts

### Website Audit

```text
Act as the TLM Contractor Marketing Brain. Audit this contractor website or landing page for ranking, conversion, and lead quality.

Business:
- Name:
- Niche:
- City/service area:
- Main service:
- Website URL:
- Monthly ad budget:

Give me:
1. Top 10 issues.
2. Priority fixes for this week.
3. SEO fixes.
4. Google Ads fixes.
5. Landing-page conversion fixes.
6. Tracking/call/SMS fixes.
7. What I should not waste time on yet.
8. A better landing-page prompt for Codex/Claude.
```

### Google Ads Budget Plan

```text
Based on the TLM Google Ads rules and the sources in this notebook, create a Google Ads setup for a contractor.

Contractor:
- Niche:
- Main services:
- Service areas:
- Monthly ad budget:
- Website/landing page:
- Tracking number:
- Goal: booked estimate appointments

Break down:
1. Campaign type.
2. Campaign/ad group structure.
3. Budget allocation.
4. Keywords.
5. Negative keywords.
6. Landing page requirements.
7. Conversion tracking.
8. What to avoid at this budget.
9. When to scale.
```

### Landing Page Prompt

```text
Create a production-ready prompt for Codex/Claude to build a contractor landing page.

Inputs:
- Business name:
- Niche:
- Main service:
- Main city:
- Service areas:
- Tracking number:
- Desired lead type:
- Existing website:

The prompt must require mobile-first design, click-to-call, estimate form, service-area copy, reviews, photos, FAQs, schema, and TLM lead endpoint compatibility. It must avoid unsupported prices, discounts, warranties, and guarantees.
```

### Monthly Growth Coach

```text
Act as TLM's Monthly Growth Coach. Review this contractor's month and create admin notes plus a client-facing summary.

Inputs:
- Leads:
- Booked appointments:
- Calls:
- Missed calls:
- SMS issues:
- Ad spend:
- Cost per lead:
- Cost per booked appointment:
- Top services:
- Top service areas:
- Notes:

Return:
1. Internal diagnosis.
2. Client-facing summary.
3. What improved.
4. What needs work.
5. Next 3 actions.
6. Risks or missing tracking.
```

## What To Improve Next In The Portal Prompt Library

Recommended future prompt templates:

1. Website audit prompt.
2. Google Ads budget-by-level prompt.
3. Niche-specific intake questions per contractor trade.
4. Monthly growth coach/report prompt.
5. GBP weekly post prompt.
6. Review response prompt.
7. Call/missed-call summary prompt.
8. Lead quality review prompt.
9. Competitor comparison prompt.
10. Client-facing explanation prompt for why a lead did or did not become a booked appointment.


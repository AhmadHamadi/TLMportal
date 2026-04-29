# Agency Workflow Research Review

Research date: 2026-04-29

This review compares TLM Portal against contractor lead generation agencies and lead-tracking platforms such as WhatConverts, CallRail, GoHighLevel-style agency stacks, and pay-per-appointment contractor lead providers.

## What Similar Agencies And Tools Do

### Lead Tracking Platforms

WhatConverts and CallRail focus on capturing calls, forms, chats, texts, source attribution, campaign/keyword data, and reporting. The strongest pattern is not just "count leads" but "track every conversion path and prove which marketing source produced it."

Implication for TLM Portal:

- Keep calls, forms, SMS, appointment status, billing, disputes, and reports in one admin hub.
- Store campaign/source fields on every lead wherever possible.
- Keep improving qualified/not-qualified tagging because raw lead counts are not enough.
- Eventually send only qualified conversions back to Google Ads as offline conversions.

### Pay-Per-Appointment Contractor Lead Agencies

Some contractor lead providers sell either raw leads or booked qualified appointments. The booked appointment model usually requires more operational work: call center or SMS qualification, scheduling, dispute rules, and strong proof of what was booked.

Implication for TLM Portal:

- Do not expose full contact details too early when a contractor is paying per booked appointment.
- Show contractors all lead records for trust, but gate phone/email/address until accepted/confirmed.
- Make billing model configurable per client: retainer-only vs retainer plus booked appointment fee.
- Keep dispute reasons clear and bounded.

### HomeAdvisor / Angi Lesson

The FTC action against HomeAdvisor is a warning for any lead business: do not overpromise lead quality, readiness to hire, exclusivity, or source unless the system can prove it.

Implication for TLM Portal:

- Use precise language: "lead", "qualified lead", "booked estimate appointment", and "billable appointment" should mean different things.
- Keep audit logs and timelines for every billing decision.
- Never imply every form/call is ready-to-hire.
- Reports should separate raw leads, qualified leads, booked appointments, billable appointments, disputes, and won jobs.

## Best Workflow For TLM

1. Lead enters from form, call, SMS, or manual admin entry.
2. Portal records source, customer, service, area, phone/email if available.
3. TLM qualifies lead by SMS/call/admin review.
4. Contractor can see lead exists, but full contact details stay gated while unqualified.
5. Once a booked appointment is ready, contractor receives YES/BUSY/NO/BAD SMS.
6. Accepted/confirmed opportunities unlock full contact details.
7. Billable status is determined from service area, service offered, phone validity, appointment state, dispute state, and customer billing model.
8. Monthly report shows raw leads -> qualified leads -> booked appointments -> billable appointments -> revenue/won jobs.

## Admin Dashboard As The Hub

The admin dashboard should answer these daily questions:

- What new leads need qualification?
- Which calls were missed or need recovery?
- Which SMS conversations need admin attention?
- Which appointments are ready for contractor confirmation?
- Which disputes are open?
- Which customers are not fully onboarded?
- Which tracking numbers or integrations need attention?
- Which reports need to go out?

Changes made from this review:

- Admin overview renamed to "Agency command center".
- Added a "Daily operating hub" section with links to leads, calls, SMS, appointments, disputes, customers, tracking numbers, and reports.
- Cleaned stale Twilio phase copy from Calls/SMS pages.

## Product Rules To Keep

- Contractor portal should stay simple: Leads, Appointments, Billing, Disputes, Settings.
- Admin portal can be more operational because it is the agency command center.
- Contractors should see all lead records for transparency, but contact details should unlock only after accepted/confirmed opportunities on pay-per-appointment clients.
- Retainer-only clients can be more open, but the same contact gating is still acceptable until the lead is qualified.
- Every charge needs proof: lead source, timeline, SMS/call logs, appointment state, and dispute window.

## Future High-Value Improvements

1. Integration health dashboard for Twilio, Stripe, email, Google Ads, Google Business Profile, and database.
2. Qualified conversion export back to Google Ads.
3. Admin review queue: new unqualified leads, missed calls, unread SMS, stale contractor no-replies, open disputes.
4. Response-time metric per contractor.
5. Call recording/transcription after consent language is approved.
6. Monthly report funnel: raw leads, qualified leads, booked appointments, billable appointments, won jobs.
7. Review request automation after completed estimate or won job.

## Sources

- WhatConverts lead tracking overview: https://www.whatconverts.com/help/docs/lead-tracking/lead-tracking-overview/
- WhatConverts platform/pricing features: https://www.whatconverts.com/
- CallRail platform overview: https://www.callrail.com/
- CallRail contractor call-tracking article: https://www.callrail.com/blog/contractors-stop-missing-leads-with-call-tracking
- Minyona contractor lead generation/booked appointment offer: https://minyona.com/contractor-lead-generation
- FTC final order against HomeAdvisor: https://www.ftc.gov/news-events/news/press-releases/2023/04/ftc-approves-final-order-against-homeadvisor-inc-deceptively-marketing-its-leads-home-improvement
- FTC proposed order against HomeAdvisor: https://www.ftc.gov/node/80302

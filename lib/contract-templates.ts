// Master contract template library. One general MSA + scoped SOWs that the
// admin can render with the customer's details auto-filled, then download as
// a printable HTML page (browser saves as PDF). Replaces the per-client
// contract uploads when you don't have a signed PDF yet.

export interface ContractTemplate {
  id: string;
  type: string;
  name: string;
  body: string;
}

const today = () =>
  new Intl.DateTimeFormat("en-CA", { dateStyle: "long" }).format(new Date());

export interface ContractFillVars {
  agencyName: string; // "Trade Leads Marketing"
  customerName: string; // contact person
  businessName: string; // legal name of contractor
  email: string;
  phone: string;
  setupFee: string;
  monthlyRetainer: string;
  appointmentFee: string;
  date: string;
}

export function defaultFillVars(args: {
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  setupFee: string;
  monthlyRetainer: string;
  appointmentFee: string;
}): ContractFillVars {
  return {
    agencyName: "Trade Leads Marketing",
    customerName: args.contactName,
    businessName: args.businessName,
    email: args.email,
    phone: args.phone,
    setupFee: args.setupFee,
    monthlyRetainer: args.monthlyRetainer,
    appointmentFee: args.appointmentFee,
    date: today(),
  };
}

function fill(body: string, vars: ContractFillVars): string {
  let out = body;
  for (const [k, v] of Object.entries(vars)) {
    out = out.split(`{{${k}}}`).join(v);
  }
  return out;
}

export const CONTRACT_TEMPLATES: ContractTemplate[] = [
  {
    id: "msa-v1",
    type: "MASTER_SERVICE_AGREEMENT",
    name: "Master Service Agreement (Lead Engine)",
    body: `THIS MASTER SERVICE AGREEMENT (this "Agreement") is entered into on {{date}} between {{agencyName}} ("Agency") and {{businessName}} ("Client"), represented by {{customerName}} ({{email}} / {{phone}}).

1. SERVICES
The Agency will provide lead-generation services for the Client through Google Ads management, landing-page hosting, call/SMS tracking, and lead routing (the "Lead Engine"). Specific scope, deliverables, and exclusions for each service line are described in the applicable Statement of Work.

2. FEES
2.1 Setup Fee. Client will pay a one-time setup fee of $ {{setupFee}} CAD on signing.
2.2 Monthly Retainer. Client will pay a recurring monthly retainer of $ {{monthlyRetainer}} CAD, billed via Stripe on the same calendar day each month, prorated for the first month.
2.3 Confirmed Estimate Appointment Fee. Client will pay $ {{appointmentFee}} CAD per confirmed estimate appointment, as defined in Section 3. These fees are billed monthly in arrears via Stripe invoice item.
2.4 Ad Spend. Client is responsible for the cost of media (Google Ads spend) directly with Google. Agency does not mark up or rebill ad spend.

3. CONFIRMED ESTIMATE APPOINTMENTS
A lead becomes a billable confirmed estimate appointment when ALL of the following are true:
(a) the prospect is real and reachable at a valid phone number;
(b) the requested service is one Client offers;
(c) the prospect's location is within Client's defined service area;
(d) the project meets Client's stated minimum project size, if any;
(e) a date or time window for the estimate is agreed;
(f) Client has been notified of the lead;
(g) Client has accepted the lead, or has not validly disputed it within forty-eight (48) hours of being notified.

4. DISPUTES
Client may dispute a confirmed estimate appointment within forty-eight (48) hours of being notified by replying through the TLM Portal with one of the listed reasons (spam, wrong number, duplicate within 30 days, outside service area, service not offered, below minimum project size, cancelled before confirmation, or existing customer). Agency will review and respond in good faith. After the dispute window closes, the appointment is final and billable.

5. TERM AND TERMINATION
This Agreement is month-to-month and may be terminated by either party with thirty (30) days' written notice. The Client remains responsible for all confirmed estimate appointments fees accrued before the effective termination date.

6. INTELLECTUAL PROPERTY
Agency retains ownership of campaign structures, ad copy, landing pages, and tracking infrastructure. On termination, Client receives a copy of any websites or landing pages built specifically for Client and may continue hosting them at Client's expense.

7. CONFIDENTIALITY
Each party will keep the other party's non-public business information confidential and use it only for the purpose of performing under this Agreement.

8. LIMITATION OF LIABILITY
Agency's aggregate liability under this Agreement is capped at the fees paid by Client to Agency in the three (3) months preceding the event giving rise to the claim. Neither party is liable for indirect, incidental, or consequential damages.

9. GOVERNING LAW
This Agreement is governed by the laws of the Province of Ontario, Canada, and the federal laws of Canada applicable therein.

10. ENTIRE AGREEMENT
This Agreement, together with any signed Statements of Work, is the entire agreement between the parties on this subject.

SIGNATURES

For {{agencyName}}:

________________________________
Signature

________________________________
Printed name

Date: ________________________

For {{businessName}}:

________________________________
Signature ({{customerName}})

________________________________
Printed name

Date: ________________________`,
  },

  {
    id: "sow-google-ads",
    type: "SCOPE_GOOGLE_ADS_MANAGEMENT",
    name: "Statement of Work — Google Ads Management",
    body: `STATEMENT OF WORK ("SOW") — Google Ads Management

This SOW is dated {{date}} and supplements the Master Service Agreement between {{agencyName}} and {{businessName}}.

1. SCOPE
Agency will manage Google Ads Search campaigns for Client targeting Client's defined services and service areas. Scope includes campaign structure, keyword research, ad copy, negative keywords, conversion tracking, and weekly optimisation.

2. ACCESS
Client will grant Agency manager-level access to Client's Google Ads account via Manager Account (MCC) link request. Client retains ownership of the account.

3. AD SPEND
Client pays Google directly for media costs. Agency does not mark up media. Agency will alert Client if monthly spend will exceed the agreed budget by more than 10%.

4. REPORTING
Agency will deliver a monthly performance report through the TLM Portal showing spend, impressions, clicks, conversions, cost per lead, and cost per confirmed estimate appointment.

5. CHANGES
Client may pause or change the campaign budget at any time with 5 business days' notice.

6. SIGNATURES

For {{agencyName}}: ________________________________ Date: ________

For {{businessName}}: ________________________________ Date: ________`,
  },

  {
    id: "sow-landing-page",
    type: "SCOPE_LANDING_PAGE",
    name: "Statement of Work — Landing Page",
    body: `STATEMENT OF WORK ("SOW") — Single-Service Landing Page

This SOW is dated {{date}} and supplements the Master Service Agreement between {{agencyName}} and {{businessName}}.

1. SCOPE
Agency will design and build one (1) single-service landing page focused on Client's primary service. Page includes: hero with CTA, trust signals, service detail, service area list, FAQ, and an estimate request form that posts to the TLM Portal lead pipeline.

2. PHONE NUMBERS
The page will display the assigned TLM tracking number. Client's direct numbers will not appear on the page.

3. HOSTING
The page will be hosted on Agency's infrastructure (Vercel) under a subdomain of Client's domain or Agency's lead domain. On termination, Agency will hand over the source code if Client wishes to self-host.

4. TIMELINE
First draft within 7 business days of receiving Client's brand assets and copy approvals.

5. SIGNATURES

For {{agencyName}}: ________________________________ Date: ________

For {{businessName}}: ________________________________ Date: ________`,
  },
];

export function renderContract(
  template: ContractTemplate,
  vars: ContractFillVars,
): { name: string; body: string } {
  return {
    name: fill(template.name, vars),
    body: fill(template.body, vars),
  };
}

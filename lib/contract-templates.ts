// We ship one onboarding contract — the Master Onboarding Agreement. It
// auto-fills with the customer's selected services, setup fee, monthly
// retainer, appointment fee, billing currency, and dispute window. The
// admin sends it right before kicking off Stripe onboarding so the client
// has accepted the fees before any charge runs.

import type { BillingCurrency } from "./money";

export interface ContractTemplate {
  id: string;
  type: string;
  name: string;
  body: string;
}

const today = () =>
  new Intl.DateTimeFormat("en-CA", { dateStyle: "long" }).format(new Date());

export interface ContractFillVars {
  agencyName: string;
  customerName: string;
  businessName: string;
  email: string;
  phone: string;
  setupFee: string;
  monthlyRetainer: string;
  appointmentFee: string;
  seoGbpRetainer: string;
  servicesSelected: string;
  packagesSelected: string;
  appointmentBilling: string;
  disputeWindowHours: string;
  currencyCode: BillingCurrency;
  currencySymbol: string;
  date: string;
}

function moneyLine(amount: string, currencyCode: BillingCurrency, currencySymbol: string): string {
  const n = Number(amount);
  if (!Number.isFinite(n) || n <= 0) return `${currencySymbol}0 ${currencyCode}`;
  return `${currencySymbol}${n.toFixed(2)} ${currencyCode}`;
}

function packagesLine(p: {
  leadEngineEnabled: boolean;
  googleAdsEnabled: boolean;
  websiteEnabled: boolean;
  localSeoEnabled: boolean;
  gbpEnabled: boolean;
}): string {
  const items = [
    p.leadEngineEnabled ? "Lead Engine (tracking number, SMS, booked appointments)" : null,
    p.googleAdsEnabled ? "Google Ads management" : null,
    p.websiteEnabled ? "Website / landing page build" : null,
    p.localSeoEnabled ? "Local SEO" : null,
    p.gbpEnabled ? "Google Business Profile management" : null,
  ].filter(Boolean) as string[];
  return items.length > 0 ? items.map((s) => `   - ${s}`).join("\n") : "   - (no packages selected — onboarding cannot start)";
}

export function defaultFillVars(args: {
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  setupFee: string;
  monthlyRetainer: string;
  appointmentFee: string;
  seoGbpRetainer: string;
  services: string[];
  packages: {
    leadEngineEnabled: boolean;
    googleAdsEnabled: boolean;
    websiteEnabled: boolean;
    localSeoEnabled: boolean;
    gbpEnabled: boolean;
  };
  disputeWindowHours: number;
  currencyCode: BillingCurrency;
}): ContractFillVars {
  const currencySymbol = args.currencyCode === "USD" ? "US$" : "CA$";
  const apptFeeNum = Number(args.appointmentFee);
  const appointmentBilling =
    Number.isFinite(apptFeeNum) && apptFeeNum > 0
      ? `Confirmed estimate appointment fee of ${moneyLine(args.appointmentFee, args.currencyCode, currencySymbol)} per appointment, billed monthly in arrears.`
      : "No per-appointment fee. Monthly retainer covers the included services.";

  return {
    agencyName: "Trade Leads",
    customerName: args.contactName,
    businessName: args.businessName,
    email: args.email,
    phone: args.phone,
    setupFee: moneyLine(args.setupFee, args.currencyCode, currencySymbol),
    monthlyRetainer: moneyLine(args.monthlyRetainer, args.currencyCode, currencySymbol),
    appointmentFee: moneyLine(args.appointmentFee, args.currencyCode, currencySymbol),
    seoGbpRetainer: moneyLine(args.seoGbpRetainer, args.currencyCode, currencySymbol),
    servicesSelected:
      args.services.length > 0
        ? args.services.map((s) => `   - ${s}`).join("\n")
        : "   - (services to be confirmed at intake)",
    packagesSelected: packagesLine(args.packages),
    appointmentBilling,
    disputeWindowHours: String(args.disputeWindowHours),
    currencyCode: args.currencyCode,
    currencySymbol,
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

const MASTER_ONBOARDING_BODY = `MASTER ONBOARDING AGREEMENT

This Agreement is entered into on {{date}} between {{agencyName}} ("Agency") and {{businessName}} ("Client"), represented by {{customerName}} ({{email}} / {{phone}}).

By signing below, Client confirms the scope, fees, and billing currency listed in this Agreement and authorizes Agency to begin onboarding immediately upon signature.

1. SERVICES
   Agency will deliver the following packages to Client:
{{packagesSelected}}

   Within those packages, the initial service lines Agency will market are:
{{servicesSelected}}

   Service areas, tracking numbers, landing-page rebuilds, ad campaigns, GBP management, and SEO tasks are detailed on the Client's setup pages inside the TLM Portal and may evolve over the engagement without amending this Agreement.

2. FEES AND BILLING CURRENCY
   All fees in this Agreement are denominated in {{currencyCode}} and will be invoiced via Stripe in {{currencyCode}}.
   2.1 Setup Fee. {{setupFee}}, billed once on signing. Onboarding deliverables (tracking number provisioning, landing page or rebuild, GBP audit, ad account access, conversion goals) begin once this fee is paid.
   2.2 Monthly Retainer. {{monthlyRetainer}}, billed every 30 days from the subscription start date via Stripe (collection method: invoice, net 7).
   2.3 Booked Appointment Fee. {{appointmentBilling}}
   2.4 SEO / GBP Retainer. {{seoGbpRetainer}} additional monthly retainer when Local SEO or Google Business Profile management is included in this Agreement.
   2.5 Ad Spend. Client pays Google directly for media costs. Agency does not mark up or rebill ad spend.

3. CONFIRMED ESTIMATE APPOINTMENTS
   A lead becomes a billable confirmed estimate appointment when ALL of the following are true:
   (a) the prospect is real and reachable at a valid phone number;
   (b) the requested service is one Client offers;
   (c) the prospect's location is within Client's defined service area;
   (d) the project meets Client's stated minimum project size, if any;
   (e) a date or time window for the estimate is agreed;
   (f) Client has been notified of the lead;
   (g) Client has accepted the lead, or has not validly disputed it within {{disputeWindowHours}} hours of being notified.

4. DISPUTES
   Client may dispute a confirmed estimate appointment within {{disputeWindowHours}} hours of being notified by replying through the TLM Portal with one of the listed reasons (spam, wrong number, duplicate within 30 days, outside service area, service not offered, below minimum project size, cancelled before confirmation, or existing customer). Agency will review and respond in good faith. After the dispute window closes, the appointment is final and billable.

5. TERM AND TERMINATION
   This Agreement is month-to-month and may be terminated by either party with thirty (30) days' written notice. Client remains responsible for all confirmed estimate appointment fees accrued before the effective termination date.

6. INTELLECTUAL PROPERTY
   Agency retains ownership of campaign structures, ad copy, landing pages, and tracking infrastructure. On termination, Client receives a copy of any websites or landing pages built specifically for Client and may continue hosting them at Client's expense.

7. CONFIDENTIALITY
   Each party will keep the other party's non-public business information confidential and use it only for the purpose of performing under this Agreement.

8. AUTHORIZATION TO CHARGE
   Client authorizes Agency to invoice the Setup Fee on signing and to begin recurring Monthly Retainer billing on the same calendar day each month, in {{currencyCode}}, via the payment method Client provides in Stripe. Booked appointment fees, where applicable, will be added to the upcoming invoice.

9. LIMITATION OF LIABILITY
   Agency's aggregate liability under this Agreement is capped at the fees paid by Client to Agency in the three (3) months preceding the event giving rise to the claim. Neither party is liable for indirect, incidental, or consequential damages.

10. GOVERNING LAW
    This Agreement is governed by the laws of the Province of Ontario, Canada, and the federal laws of Canada applicable therein, regardless of billing currency.

11. ENTIRE AGREEMENT
    This Agreement is the entire agreement between the parties on this subject and supersedes all prior discussions and proposals.

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

Date: ________________________`;

export const CONTRACT_TEMPLATES: ContractTemplate[] = [
  {
    id: "master-onboarding",
    type: "MASTER_SERVICE_AGREEMENT",
    name: "Master Onboarding Agreement",
    body: MASTER_ONBOARDING_BODY,
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

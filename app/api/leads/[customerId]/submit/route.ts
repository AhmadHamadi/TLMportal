import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { toE164 } from "@/lib/phone";
import { dispatch as dispatchAutomation } from "@/server/services/automation";
import { requestLeadAvailability } from "@/server/services/sms";
import { notifyContractorOfNewLead } from "@/server/services/notifications";

export const runtime = "nodejs";

// Public lead-intake endpoint for contractor landing pages and other
// outside-the-portal forms. POST JSON to:
//
//   https://portal.tradeleadsmarketing.com/api/leads/<customerId>/submit
//
// CORS-open so any landing page can fire from the browser. Per-customer
// dedupe via Lead.dedupeHash (phone + customerId + monthly bucket) prevents
// duplicate submissions from a refresh-spammer.
//
// On success, fires the same downstream pipeline as a manually-created lead:
// LEAD_CREATED automation rules, contractor email/SMS notification, and the
// availability-ask SMS to the lead.

const submissionSchema = z.object({
  firstName: z.string().min(1).max(80).optional(),
  lastName: z.string().min(1).max(80).optional(),
  phone: z.string().min(1).max(40).optional(),
  email: z.string().email().max(160).optional(),
  city: z.string().max(80).optional(),
  neighbourhood: z.string().max(80).optional(),
  address: z.string().max(200).optional(),
  serviceRequested: z.string().max(200).optional(),
  projectDetails: z.string().max(2000).optional(),
  preferredTime: z.string().max(200).optional(),
  estimatedProjectSize: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => {
      if (v === undefined) return null;
      const n = typeof v === "string" ? Number(v) : v;
      return Number.isFinite(n) && n > 0 ? n.toFixed(2) : null;
    }),
  source: z
    .enum(["LANDING_PAGE_FORM", "QUOTE_BUTTON", "GOOGLE_ADS_LEAD_FORM"])
    .default("LANDING_PAGE_FORM"),
  // Honeypot — bots fill it, humans don't. If set, we silently drop.
  hp: z.string().optional(),
  // Optional referrer / utm tracking from the landing page.
  sourceCampaign: z.string().max(120).optional(),
  sourceAdGroup: z.string().max(120).optional(),
  sourceKeyword: z.string().max(120).optional(),
});

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

function withCors(res: NextResponse): NextResponse {
  for (const [k, v] of Object.entries(CORS_HEADERS)) {
    res.headers.set(k, v);
  }
  return res;
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ customerId: string }> },
): Promise<NextResponse> {
  const { customerId } = await params;

  // Confirm the customer exists and isn't archived.
  const customer = await db.customer.findFirst({
    where: { id: customerId, deletedAt: null },
    select: { id: true, status: true },
  });
  if (!customer) {
    return withCors(NextResponse.json({ ok: false, error: "Unknown customer" }, { status: 404 }));
  }
  if (customer.status === "CANCELLED") {
    return withCors(
      NextResponse.json({ ok: false, error: "Customer not active" }, { status: 410 }),
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return withCors(NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 }));
  }

  const parsed = submissionSchema.safeParse(body);
  if (!parsed.success) {
    return withCors(
      NextResponse.json(
        { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 },
      ),
    );
  }
  const input = parsed.data;

  // Honeypot — bots filled it; pretend success and move on.
  if (input.hp && input.hp.trim() !== "") {
    return withCors(NextResponse.json({ ok: true, dedupe: false, leadId: null }));
  }

  const phone = input.phone ? toE164(input.phone) : null;
  const monthsBucket = Math.floor(Date.now() / (30 * 24 * 3600 * 1000));
  const dedupeHash = `${customerId}:${phone ?? ""}:${monthsBucket}`;

  // Dedupe within 30 days on phone + customer.
  if (phone) {
    const existing = await db.lead.findFirst({
      where: { customerId, dedupeHash, deletedAt: null },
      select: { id: true },
    });
    if (existing) {
      return withCors(NextResponse.json({ ok: true, dedupe: true, leadId: existing.id }));
    }
  }

  const lead = await db.lead.create({
    data: {
      customerId,
      source: input.source,
      firstName: input.firstName ?? null,
      lastName: input.lastName ?? null,
      phone,
      email: input.email?.toLowerCase() ?? null,
      city: input.city ?? null,
      neighbourhood: input.neighbourhood ?? null,
      address: input.address ?? null,
      serviceRequested: input.serviceRequested ?? null,
      projectDetails: input.projectDetails ?? null,
      preferredTime: input.preferredTime ?? null,
      estimatedProjectSize: input.estimatedProjectSize ?? null,
      sourceCampaign: input.sourceCampaign ?? null,
      sourceAdGroup: input.sourceAdGroup ?? null,
      sourceKeyword: input.sourceKeyword ?? null,
      dedupeHash,
    },
  });

  await db.leadEvent.create({
    data: {
      leadId: lead.id,
      type: "LEAD_CREATED",
      description: `Lead submitted via ${input.source} form`,
    },
  });
  await db.auditLog.create({
    data: {
      userId: null,
      customerId,
      action: "LEAD_CREATED",
      entityType: "Lead",
      entityId: lead.id,
      metadata: {
        source: input.source,
        ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
        userAgent: req.headers.get("user-agent") ?? null,
      },
    },
  });

  // Fire the same downstream pipeline as createLead — automation rules,
  // contractor notification, availability ask. All wrapped so a flaky
  // integration doesn't 500 the form.
  await Promise.allSettled([
    dispatchAutomation({ trigger: "LEAD_CREATED", customerId, leadId: lead.id }),
    notifyContractorOfNewLead({ leadId: lead.id, alsoSms: false }),
    phone && !input.preferredTime
      ? requestLeadAvailability({ leadId: lead.id })
      : Promise.resolve(null),
  ]);

  return withCors(NextResponse.json({ ok: true, dedupe: false, leadId: lead.id }));
}

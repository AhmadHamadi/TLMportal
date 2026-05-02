import { afterAll, beforeAll, describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
import { getSeededCustomers, testDb } from "./helpers";

// Stub out the downstream services that run after the lead is created — they
// would otherwise attempt to send real SMS / email and break the test. We only
// care that the public endpoint accepts the payload, dedupes correctly, and
// writes a Lead + LeadEvent + AuditLog row.
vi.mock("@/server/services/automation", () => ({
  dispatch: vi.fn(async () => undefined),
}));
vi.mock("@/server/services/notifications", () => ({
  notifyContractorOfNewLead: vi.fn(async () => undefined),
}));
vi.mock("@/server/services/sms", () => ({
  requestLeadAvailability: vi.fn(async () => undefined),
}));

let POST: typeof import("@/app/api/leads/[customerId]/submit/route").POST;

beforeAll(async () => {
  ({ POST } = await import("@/app/api/leads/[customerId]/submit/route"));
});

afterAll(async () => {
  await testDb.$disconnect();
});

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("https://portal.test/api/leads/x/submit", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function clean(customerId: string, phone: string) {
  await testDb.lead.deleteMany({ where: { customerId, phone } });
}

describe("public form-submission API", () => {
  it("creates a lead from a valid landing-page submission", async () => {
    const { atlas } = await getSeededCustomers();
    const phone = "+15555550101";
    await clean(atlas.id, phone);

    const req = makeRequest({
      firstName: "Test",
      lastName: "User",
      phone,
      email: "test-user@example.com",
      city: "Toronto",
      serviceRequested: "Driveway",
      source: "LANDING_PAGE_FORM",
    });
    const res = await POST(req, { params: Promise.resolve({ customerId: atlas.id }) });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.dedupe).toBe(false);
    expect(typeof json.leadId).toBe("string");

    const lead = await testDb.lead.findUnique({ where: { id: json.leadId } });
    expect(lead).not.toBeNull();
    expect(lead?.firstName).toBe("Test");
    expect(lead?.email).toBe("test-user@example.com");
    expect(lead?.source).toBe("LANDING_PAGE_FORM");

    await clean(atlas.id, phone);
  });

  it("returns 404 for an unknown customer", async () => {
    const req = makeRequest({ firstName: "Nope", phone: "+15555550000" });
    const res = await POST(req, {
      params: Promise.resolve({ customerId: "00000000-0000-0000-0000-000000000000" }),
    });
    expect(res.status).toBe(404);
  });

  it("dedupes a second submission with the same phone within the month", async () => {
    const { atlas } = await getSeededCustomers();
    const phone = "+15555550102";
    await clean(atlas.id, phone);

    const first = makeRequest({ firstName: "A", phone });
    const r1 = await POST(first, { params: Promise.resolve({ customerId: atlas.id }) });
    const j1 = await r1.json();
    expect(j1.ok).toBe(true);
    expect(j1.dedupe).toBe(false);

    const second = makeRequest({ firstName: "A again", phone });
    const r2 = await POST(second, { params: Promise.resolve({ customerId: atlas.id }) });
    const j2 = await r2.json();
    expect(j2.ok).toBe(true);
    expect(j2.dedupe).toBe(true);
    expect(j2.leadId).toBe(j1.leadId);

    await clean(atlas.id, phone);
  });

  it("silently swallows honeypot submissions", async () => {
    const { atlas } = await getSeededCustomers();
    const req = makeRequest({ firstName: "Bot", phone: "+15555550199", hp: "i-am-a-bot" });
    const res = await POST(req, { params: Promise.resolve({ customerId: atlas.id }) });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.leadId).toBeNull();
    const lead = await testDb.lead.findFirst({
      where: { customerId: atlas.id, phone: "+15555550199" },
    });
    expect(lead).toBeNull();
  });

  it("rejects an invalid payload with 400", async () => {
    const { atlas } = await getSeededCustomers();
    const req = makeRequest({ email: "not-an-email" });
    const res = await POST(req, { params: Promise.resolve({ customerId: atlas.id }) });
    expect(res.status).toBe(400);
  });

  it("sets CORS headers so any origin can submit", async () => {
    const { atlas } = await getSeededCustomers();
    const phone = "+15555550103";
    await clean(atlas.id, phone);
    const req = makeRequest({ firstName: "Cors", phone });
    const res = await POST(req, { params: Promise.resolve({ customerId: atlas.id }) });
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
    await clean(atlas.id, phone);
  });
});

import { describe, it, expect } from "vitest";
import { evaluateBillable } from "@/server/services/billing";
import { Prisma } from "@prisma/client";

const baseCustomer = {
  minProjectSize: null,
  services: [{ name: "Concrete driveways", isActive: true }],
  serviceAreas: [{ city: "Mississauga", isActive: true }],
};

const validLead = {
  status: "APPOINTMENT_CONFIRMED",
  billableStatus: "PENDING",
  phone: "+14165550123",
  city: "Mississauga",
  serviceRequested: "Concrete driveway",
  estimatedProjectSize: null,
};

const validAppointment = {
  appointmentWindowStart: new Date("2026-05-01T14:00:00Z"),
  sentToContractorAt: new Date("2026-04-30T10:00:00Z"),
  acceptedByContractorAt: new Date("2026-04-30T10:30:00Z"),
  cancelledAt: null,
  disputeWindowEndsAt: new Date("2026-05-02T10:30:00Z"),
};

describe("evaluateBillable", () => {
  it("approves a valid lead/appointment", () => {
    const r = evaluateBillable({
      lead: validLead,
      appointment: validAppointment,
      customer: baseCustomer,
      hasOpenValidDispute: false,
    });
    expect(r.isBillable).toBe(true);
  });

  it("rejects spam leads", () => {
    const r = evaluateBillable({
      lead: { ...validLead, status: "SPAM" },
      appointment: validAppointment,
      customer: baseCustomer,
      hasOpenValidDispute: false,
    });
    expect(r.isBillable).toBe(false);
    if (!r.isBillable) expect(r.reason).toBe("SPAM_OR_FLAGGED");
  });

  it("rejects leads with missing or invalid phones", () => {
    const r = evaluateBillable({
      lead: { ...validLead, phone: null },
      appointment: validAppointment,
      customer: baseCustomer,
      hasOpenValidDispute: false,
    });
    expect(r.isBillable).toBe(false);
    if (!r.isBillable) expect(r.reason).toBe("WRONG_NUMBER");
  });

  it("rejects leads outside service area", () => {
    const r = evaluateBillable({
      lead: { ...validLead, city: "Calgary" },
      appointment: validAppointment,
      customer: baseCustomer,
      hasOpenValidDispute: false,
    });
    expect(r.isBillable).toBe(false);
    if (!r.isBillable) expect(r.reason).toBe("OUTSIDE_SERVICE_AREA");
  });

  it("rejects leads asking for a service the customer doesn't offer", () => {
    const r = evaluateBillable({
      lead: { ...validLead, serviceRequested: "Roof shingles" },
      appointment: validAppointment,
      customer: baseCustomer,
      hasOpenValidDispute: false,
    });
    expect(r.isBillable).toBe(false);
    if (!r.isBillable) expect(r.reason).toBe("SERVICE_NOT_OFFERED");
  });

  it("rejects leads below the customer's minimum project size", () => {
    const r = evaluateBillable({
      lead: { ...validLead, estimatedProjectSize: new Prisma.Decimal(800) },
      appointment: validAppointment,
      customer: { ...baseCustomer, minProjectSize: new Prisma.Decimal(2500) },
      hasOpenValidDispute: false,
    });
    expect(r.isBillable).toBe(false);
    if (!r.isBillable) expect(r.reason).toBe("BELOW_MIN_JOB_SIZE");
  });

  it("rejects when contractor was not notified", () => {
    const r = evaluateBillable({
      lead: validLead,
      appointment: { ...validAppointment, sentToContractorAt: null },
      customer: baseCustomer,
      hasOpenValidDispute: false,
    });
    expect(r.isBillable).toBe(false);
  });

  it("rejects when there is an open valid dispute", () => {
    const r = evaluateBillable({
      lead: validLead,
      appointment: validAppointment,
      customer: baseCustomer,
      hasOpenValidDispute: true,
    });
    expect(r.isBillable).toBe(false);
    if (!r.isBillable) expect(r.reason).toBe("OPEN_VALID_DISPUTE");
  });

  it("rejects cancelled appointments", () => {
    const r = evaluateBillable({
      lead: validLead,
      appointment: { ...validAppointment, cancelledAt: new Date() },
      customer: baseCustomer,
      hasOpenValidDispute: false,
    });
    expect(r.isBillable).toBe(false);
  });
});

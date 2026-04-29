import { describe, expect, it } from "vitest";
import {
  canRevealLeadContactToContractor,
  contractorLeadVisibilityMessage,
} from "@/lib/lead-visibility";

describe("contractor lead visibility", () => {
  it("hides contact details before appointment acceptance", () => {
    const lead = { status: "NEW", appointment: null };
    expect(canRevealLeadContactToContractor(lead)).toBe(false);
    expect(contractorLeadVisibilityMessage(lead)).toContain("TLM is qualifying");
  });

  it("keeps sent-to-contractor leads gated until accepted", () => {
    const lead = { status: "SENT_TO_CONTRACTOR", appointment: { status: "SENT_TO_CONTRACTOR" } };
    expect(canRevealLeadContactToContractor(lead)).toBe(false);
    expect(contractorLeadVisibilityMessage(lead)).toContain("Accept the appointment");
  });

  it("reveals contact details after accepted or confirmed opportunity", () => {
    expect(
      canRevealLeadContactToContractor({
        status: "ACCEPTED_BY_CONTRACTOR",
        appointment: { status: "ACCEPTED" },
      }),
    ).toBe(true);
    expect(
      canRevealLeadContactToContractor({
        status: "APPOINTMENT_CONFIRMED",
        appointment: { status: "CONFIRMED" },
      }),
    ).toBe(true);
  });
});

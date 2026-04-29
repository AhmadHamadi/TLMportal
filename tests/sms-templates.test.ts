import { describe, expect, it } from "vitest";
import { SMS_TEMPLATES } from "@/lib/sms-templates";

describe("SMS templates", () => {
  it("asks leads for 1-2 availability options without overpromising", () => {
    const body = SMS_TEMPLATES.leadAvailabilityRequest({
      firstName: "Maya",
      service: "a patio estimate",
      businessName: "Atlas Concrete",
    });

    expect(body).toContain("Maya");
    expect(body).toContain("1-2 options");
    expect(body.toLowerCase()).not.toContain("guarantee");
    expect(body.toLowerCase()).not.toContain("discount");
  });

  it("gives contractors explicit reply options", () => {
    const body = SMS_TEMPLATES.contractorProposedTime({
      leadName: "Sam Patel",
      service: "driveway replacement",
      cityOrNeighbourhood: "Etobicoke",
      preferredTime: "Tuesday after 4pm",
      projectDetails: "Two-car driveway",
    });

    expect(body).toContain("Reply YES");
    expect(body).toContain("BUSY");
    expect(body).toContain("NO");
    expect(body).toContain("BAD");
  });
});

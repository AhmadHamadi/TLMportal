import { describe, it, expect } from "vitest";
import { renderTemplate } from "@/server/services/automation";

describe("renderTemplate", () => {
  it("substitutes allowlisted variables", () => {
    const out = renderTemplate(
      "Hi {{firstName}}, thanks for the {{service}} request in {{city}}.",
      { firstName: "Sara", service: "driveway", city: "Mississauga" },
    );
    expect(out).toBe("Hi Sara, thanks for the driveway request in Mississauga.");
  });

  it("ignores variables not on the allowlist (no price/discount injection)", () => {
    const out = renderTemplate(
      "Special offer: {{price}} off your {{service}}!",
      { service: "patio" },
    );
    expect(out).toBe("Special offer:  off your patio!");
    expect(out).not.toContain("price");
  });

  it("returns empty for missing allowlisted vars", () => {
    expect(
      renderTemplate("Hi {{firstName}}, project: {{projectDetails}}", {
        firstName: "",
        projectDetails: "",
      }),
    ).toBe("Hi , project: ");
  });

  it("does not invoke arbitrary code via template syntax", () => {
    // Tokens with anything other than [a-zA-Z]+ inside the braces are not
    // matched by the regex, so the malicious sequence passes through as
    // literal text — never as executable code.
    const out = renderTemplate(
      "Pre {{firstName.constructor('return 42')()}} Post",
      { firstName: "Sara" },
    );
    // No interpolation happened — no expansion of `firstName`
    expect(out).not.toContain("Sara");
    // The resulting string still contains the literal braces (proof that no
    // code was evaluated; we just left the unsafe token alone)
    expect(out).toContain("{{");
  });
});

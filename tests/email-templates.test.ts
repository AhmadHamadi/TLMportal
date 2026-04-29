import { describe, expect, it } from "vitest";
import { EmailTemplates } from "@/lib/email-templates";

describe("EmailTemplates", () => {
  it("escapes user-controlled values before rendering HTML", () => {
    const tpl = EmailTemplates.newLeadAlert({
      contractorName: "Owner <script>",
      leadName: "Jane <img src=x onerror=alert(1)>",
      service: "Concrete & patios",
      cityOrArea: "Mississauga <b>",
      preferredTime: "Tomorrow < noon",
      leadUrl: "https://portal.example/contractor/leads/lead_1?x=<bad>",
    });

    expect(tpl.html).toContain("Jane &lt;img src=x onerror=alert(1)&gt;");
    expect(tpl.html).toContain("Concrete &amp; patios");
    expect(tpl.html).toContain("Mississauga &lt;b&gt;");
    expect(tpl.html).toContain("Tomorrow &lt; noon");
    expect(tpl.html).not.toContain("<img src=x");
    expect(tpl.html).not.toContain("<bad>");
  });
});

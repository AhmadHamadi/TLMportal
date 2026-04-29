import { describe, it, expect } from "vitest";
import { parseContractorReply } from "@/lib/sms-parser";

describe("parseContractorReply", () => {
  it("recognizes YES variants", () => {
    expect(parseContractorReply("YES")).toBe("YES");
    expect(parseContractorReply("yes")).toBe("YES");
    expect(parseContractorReply("Y")).toBe("YES");
    expect(parseContractorReply("Accept")).toBe("YES");
    expect(parseContractorReply("YES please")).toBe("YES");
    expect(parseContractorReply("  yes!  ")).toBe("YES");
  });

  it("recognizes NO variants", () => {
    expect(parseContractorReply("NO")).toBe("NO");
    expect(parseContractorReply("no thanks")).toBe("NO");
    expect(parseContractorReply("decline")).toBe("NO");
    expect(parseContractorReply("N")).toBe("NO");
  });

  it("recognizes BUSY", () => {
    expect(parseContractorReply("BUSY")).toBe("BUSY");
    expect(parseContractorReply("busy today")).toBe("BUSY");
    expect(parseContractorReply("later")).toBe("BUSY");
  });

  it("recognizes BAD as a dispute trigger", () => {
    expect(parseContractorReply("BAD")).toBe("BAD");
    expect(parseContractorReply("bad lead")).toBe("BAD");
    expect(parseContractorReply("dispute")).toBe("BAD");
  });

  it("returns null for ambiguous text", () => {
    expect(parseContractorReply("hi")).toBe(null);
    expect(parseContractorReply("")).toBe(null);
    expect(parseContractorReply("schedule for tuesday")).toBe(null);
  });

  it("does not match prices/numbers", () => {
    expect(parseContractorReply("$500 estimate")).toBe(null);
    expect(parseContractorReply("416-555-0123")).toBe(null);
  });
});

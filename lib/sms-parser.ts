// Pure parser for inbound contractor replies. Tested in isolation.

export type ContractorReply = "YES" | "NO" | "BUSY" | "BAD" | null;

export function parseContractorReply(body: string): ContractorReply {
  const text = body.trim().toUpperCase();
  if (!text) return null;
  // Single-token replies are most common
  const first = text.split(/\s+/)[0].replace(/[^A-Z]/g, "");
  if (first === "YES" || first === "Y" || first === "ACCEPT") return "YES";
  if (first === "NO" || first === "N" || first === "DECLINE") return "NO";
  if (first === "BUSY" || first === "LATER") return "BUSY";
  if (first === "BAD" || first === "DISPUTE") return "BAD";
  return null;
}

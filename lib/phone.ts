// Naive E.164 utilities. Sufficient for North American numbers in the seed
// and admin entry forms. Replace with libphonenumber-js if/when international
// dialling becomes a real concern.

const NA_DEFAULT_COUNTRY = "1";

export function toE164(input: string, defaultCountry = NA_DEFAULT_COUNTRY): string | null {
  const digits = input.replace(/\D/g, "");
  if (digits.length === 0) return null;
  if (input.trim().startsWith("+")) {
    return `+${digits}`;
  }
  if (digits.length === 10) {
    return `+${defaultCountry}${digits}`;
  }
  if (digits.length === 11 && digits.startsWith(defaultCountry)) {
    return `+${digits}`;
  }
  return null;
}

export function formatNational(e164: string): string {
  const digits = e164.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return e164;
}

export function isE164(input: string): boolean {
  return /^\+[1-9]\d{6,14}$/.test(input);
}

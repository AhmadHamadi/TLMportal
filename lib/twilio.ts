import "server-only";

// Phase 2 stub. Real Twilio client lands when we wire webhooks + outbound SMS.
// Imports of this module type-check today; calls throw so we notice early.

export interface SendSmsArgs {
  to: string;
  body: string;
  customerId: string;
  leadId?: string;
}

export async function sendSms(_args: SendSmsArgs): Promise<{ providerMessageId: string }> {
  throw new Error("Twilio not yet wired (Phase 2)");
}

export function verifyTwilioSignature(_signature: string, _url: string, _params: Record<string, string>): boolean {
  throw new Error("Twilio signature verification not yet wired (Phase 2)");
}

import "server-only";
import twilio from "twilio";
import { env } from "@/lib/env";

let _client: ReturnType<typeof twilio> | null = null;

export function isTwilioConfigured(): boolean {
  return Boolean(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN);
}

function getClient() {
  if (!isTwilioConfigured()) {
    throw new Error("Twilio not configured (missing TWILIO_ACCOUNT_SID/AUTH_TOKEN)");
  }
  if (!_client) {
    _client = twilio(env.TWILIO_ACCOUNT_SID!, env.TWILIO_AUTH_TOKEN!);
  }
  return _client;
}

export interface SendSmsArgs {
  to: string;
  body: string;
  from?: string;
}

export interface SendSmsResult {
  providerMessageId: string;
  status: string;
  simulated: boolean;
}

export async function sendSms(args: SendSmsArgs): Promise<SendSmsResult> {
  if (!isTwilioConfigured()) {
    return {
      providerMessageId: `simulated_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      status: "simulated",
      simulated: true,
    };
  }
  const client = getClient();
  const messagingServiceSid = env.TWILIO_MESSAGING_SERVICE_SID;
  const message = await client.messages.create({
    to: args.to,
    body: args.body,
    ...(args.from
      ? { from: args.from }
      : messagingServiceSid
        ? { messagingServiceSid }
        : {}),
  });
  return {
    providerMessageId: message.sid,
    status: message.status,
    simulated: false,
  };
}

export function verifyTwilioSignature(
  signature: string | null,
  url: string,
  params: Record<string, string>,
): boolean {
  if (!isTwilioConfigured()) return false;
  if (!signature) return false;
  const token = env.TWILIO_WEBHOOK_AUTH_TOKEN ?? env.TWILIO_AUTH_TOKEN!;
  return twilio.validateRequest(token, signature, url, params);
}

export async function buyPhoneNumber(args: {
  areaCode?: string;
  searchExisting?: string;
}): Promise<{ phoneNumber: string; sid: string; simulated: boolean }> {
  if (!isTwilioConfigured()) {
    const sim = `+1${(args.areaCode ?? "416")}555${String(Math.floor(Math.random() * 9000) + 1000)}`;
    return { phoneNumber: sim, sid: `PN_simulated_${Date.now()}`, simulated: true };
  }
  const client = getClient();
  if (args.searchExisting) {
    const existing = await client.incomingPhoneNumbers.list({
      phoneNumber: args.searchExisting,
      limit: 1,
    });
    if (existing.length > 0) {
      return {
        phoneNumber: existing[0].phoneNumber,
        sid: existing[0].sid,
        simulated: false,
      };
    }
  }
  const available = await client.availablePhoneNumbers("CA").local.list({
    areaCode: args.areaCode ? Number(args.areaCode) : undefined,
    limit: 1,
  });
  if (available.length === 0) {
    throw new Error(`No numbers available in area code ${args.areaCode ?? "CA"}`);
  }
  const purchased = await client.incomingPhoneNumbers.create({
    phoneNumber: available[0].phoneNumber,
    voiceUrl: `${env.APP_URL}/api/webhooks/twilio/voice`,
    smsUrl: `${env.APP_URL}/api/webhooks/twilio/sms`,
  });
  return { phoneNumber: purchased.phoneNumber, sid: purchased.sid, simulated: false };
}

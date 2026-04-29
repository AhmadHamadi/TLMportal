import "server-only";
import { Resend } from "resend";
import { env } from "@/lib/env";

let _client: Resend | null = null;

export function isEmailConfigured(): boolean {
  return Boolean(env.RESEND_API_KEY && env.RESEND_FROM_EMAIL);
}

function getClient(): Resend {
  if (!isEmailConfigured()) {
    throw new Error("Resend not configured (RESEND_API_KEY + RESEND_FROM_EMAIL required)");
  }
  if (!_client) {
    _client = new Resend(env.RESEND_API_KEY!);
  }
  return _client;
}

export interface SendEmailArgs {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

export interface SendEmailResult {
  providerMessageId: string;
  simulated: boolean;
}

export async function sendEmail(args: SendEmailArgs): Promise<SendEmailResult> {
  if (!isEmailConfigured()) {
    return {
      providerMessageId: `simulated_email_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      simulated: true,
    };
  }
  const client = getClient();
  const result = await client.emails.send({
    from: env.RESEND_FROM_EMAIL!,
    to: args.to,
    subject: args.subject,
    html: args.html,
    replyTo: args.replyTo,
  });
  if (result.error) {
    throw new Error(`Resend send failed: ${result.error.message}`);
  }
  return {
    providerMessageId: result.data?.id ?? "unknown",
    simulated: false,
  };
}

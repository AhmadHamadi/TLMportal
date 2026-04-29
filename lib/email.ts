import "server-only";
import nodemailer from "nodemailer";
import { Resend } from "resend";
import { env } from "@/lib/env";

type EmailProvider = "resend" | "smtp" | "simulated";

let resendClient: Resend | null = null;
let smtpTransport: nodemailer.Transporter | null = null;

export function getEmailProvider(): EmailProvider {
  if (env.EMAIL_PROVIDER === "smtp") {
    return isSmtpConfigured() ? "smtp" : "simulated";
  }
  if (env.EMAIL_PROVIDER === "resend") {
    return isResendConfigured() ? "resend" : "simulated";
  }
  if (isResendConfigured()) return "resend";
  if (isSmtpConfigured()) return "smtp";
  return "simulated";
}

export function isResendConfigured(): boolean {
  return Boolean(env.RESEND_API_KEY && env.RESEND_FROM_EMAIL);
}

export function isSmtpConfigured(): boolean {
  return Boolean(
    env.SMTP_HOST &&
      env.SMTP_PORT &&
      env.SMTP_USER &&
      env.SMTP_PASSWORD &&
      env.SMTP_FROM_EMAIL,
  );
}

export function isEmailConfigured(): boolean {
  return getEmailProvider() !== "simulated";
}

function getResendClient(): Resend {
  if (!isResendConfigured()) {
    throw new Error("Resend not configured (RESEND_API_KEY + RESEND_FROM_EMAIL required)");
  }
  if (!resendClient) {
    resendClient = new Resend(env.RESEND_API_KEY!);
  }
  return resendClient;
}

function getSmtpTransport(): nodemailer.Transporter {
  if (!isSmtpConfigured()) {
    throw new Error(
      "SMTP not configured (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM_EMAIL required)",
    );
  }
  if (!smtpTransport) {
    smtpTransport = nodemailer.createTransport({
      host: env.SMTP_HOST!,
      port: env.SMTP_PORT!,
      secure: env.SMTP_SECURE ?? env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER!,
        pass: env.SMTP_PASSWORD!,
      },
    });
  }
  return smtpTransport;
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
  provider: EmailProvider;
}

export async function sendEmail(args: SendEmailArgs): Promise<SendEmailResult> {
  const provider = getEmailProvider();
  if (provider === "simulated") {
    return {
      providerMessageId: `simulated_email_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      simulated: true,
      provider,
    };
  }

  if (provider === "smtp") {
    const result = await getSmtpTransport().sendMail({
      from: env.SMTP_FROM_EMAIL!,
      to: args.to,
      subject: args.subject,
      html: args.html,
      replyTo: args.replyTo,
    });
    return {
      providerMessageId: result.messageId,
      simulated: false,
      provider,
    };
  }

  const result = await getResendClient().emails.send({
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
    provider,
  };
}

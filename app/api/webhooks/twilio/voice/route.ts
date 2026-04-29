import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyTwilioSignature } from "@/lib/twilio";
import { env } from "@/lib/env";
import { sendMissedCallTextBack } from "@/server/services/sms";

export const runtime = "nodejs";

function twiml(body: string): NextResponse {
  return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?><Response>${body}</Response>`, {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const url = req.url;
  const params = Object.fromEntries(await req.formData()) as Record<string, string>;
  const sig = req.headers.get("x-twilio-signature");

  if (!verifyTwilioSignature(sig, url, params)) {
    return new NextResponse("invalid signature", { status: 403 });
  }

  const callSid = params.CallSid;
  const from = params.From;
  const to = params.To;
  const status = params.CallStatus ?? "initiated";
  if (!callSid || !from || !to) return twiml(`<Reject reason="rejected"/>`);

  const tn = await db.trackingNumber.findUnique({
    where: { twilioPhoneNumber: to },
    include: { customer: { select: { id: true, forwardingPhone: true } } },
  });
  if (!tn) {
    return twiml(`<Reject reason="rejected"/>`);
  }

  const priorCall = await db.callLog.findUnique({
    where: { callSid },
    select: { callStatus: true },
  });
  const dialStatus = params.DialCallStatus;
  const resolvedStatus = dialStatus ?? status;
  const durationSeconds = Number(params.DialCallDuration ?? params.CallDuration ?? 0) || 0;

  await db.callLog.upsert({
    where: { callSid },
    create: {
      callSid,
      customerId: tn.customerId,
      fromNumber: from,
      toNumber: to,
      trackingNumber: to,
      callStatus: resolvedStatus,
      durationSeconds,
      direction: "INBOUND",
    },
    update: { callStatus: resolvedStatus, durationSeconds },
  });

  const missedStatuses = new Set(["no-answer", "busy", "failed", "canceled"]);
  const isDialCallback = Boolean(dialStatus);
  const shouldTextBack =
    isDialCallback &&
    missedStatuses.has(resolvedStatus) &&
    priorCall?.callStatus !== resolvedStatus;

  if (shouldTextBack) {
    await sendMissedCallTextBack({
      customerId: tn.customerId,
      callerPhone: from,
      trackingNumber: to,
      callSid,
    });
    return twiml("");
  }

  const forward = tn.forwardingPhoneNumber || tn.customer.forwardingPhone;
  return twiml(
    `<Dial answerOnBridge="true" callerId="${to}" timeout="20" action="${env.APP_URL}/api/webhooks/twilio/voice" method="POST"><Number>${forward}</Number></Dial>`,
  );
}

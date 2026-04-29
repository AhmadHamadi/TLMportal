import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyTwilioSignature } from "@/lib/twilio";

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

  const tn = await db.trackingNumber.findUnique({
    where: { twilioPhoneNumber: to },
    include: { customer: { select: { id: true, forwardingPhone: true } } },
  });
  if (!tn) {
    return twiml(`<Reject reason="rejected"/>`);
  }

  await db.callLog.upsert({
    where: { callSid },
    create: {
      callSid,
      customerId: tn.customerId,
      fromNumber: from,
      toNumber: to,
      trackingNumber: to,
      callStatus: status,
      direction: "INBOUND",
    },
    update: { callStatus: status },
  });

  const forward = tn.forwardingPhoneNumber || tn.customer.forwardingPhone;
  return twiml(
    `<Dial answerOnBridge="true" callerId="${to}" timeout="20"><Number>${forward}</Number></Dial>`,
  );
}

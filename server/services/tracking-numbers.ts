import "server-only";
import { db } from "@/lib/db";
import { buyPhoneNumber, isTwilioConfigured } from "@/lib/twilio";
import { writeAudit } from "./audit";
import { ForbiddenError, type AuthCtx } from "@/lib/auth-guard";
import { toE164 } from "@/lib/phone";

export async function provisionTrackingNumber(
  ctx: AuthCtx,
  args: {
    customerId: string;
    forwardingPhoneNumber: string;
    label?: string | null;
    areaCode?: string | null;
    existingNumber?: string | null;
  },
) {
  if (ctx.role !== "ADMIN") throw new ForbiddenError();

  const forwarding = toE164(args.forwardingPhoneNumber);
  if (!forwarding) throw new Error("Invalid forwarding phone");

  const purchased = await buyPhoneNumber({
    areaCode: args.areaCode ?? undefined,
    searchExisting: args.existingNumber ?? undefined,
  });

  return db.$transaction(async (tx) => {
    const tn = await tx.trackingNumber.create({
      data: {
        customerId: args.customerId,
        twilioPhoneNumber: purchased.phoneNumber,
        twilioSid: purchased.sid,
        forwardingPhoneNumber: forwarding,
        label: args.label ?? null,
        status: "ACTIVE",
      },
    });
    await writeAudit(
      {
        userId: ctx.userId,
        customerId: args.customerId,
        action: "TRACKING_NUMBER_PROVISIONED",
        entityType: "TrackingNumber",
        entityId: tn.id,
        metadata: {
          simulated: purchased.simulated,
          twilioConfigured: isTwilioConfigured(),
        },
      },
      tx,
    );
    return { trackingNumber: tn, simulated: purchased.simulated };
  });
}

export async function releaseTrackingNumber(ctx: AuthCtx, id: string) {
  if (ctx.role !== "ADMIN") throw new ForbiddenError();
  return db.trackingNumber.update({
    where: { id },
    data: { status: "RELEASED" },
  });
}

import { type NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { db } from "@/lib/db";
import { verifyStripeSignature } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const sig = req.headers.get("stripe-signature");
  const payload = await req.text();

  let event: Stripe.Event;
  try {
    event = verifyStripeSignature(payload, sig);
  } catch (err) {
    return new NextResponse(
      `Webhook signature verification failed: ${err instanceof Error ? err.message : "unknown"}`,
      { status: 400 },
    );
  }

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = (sub.metadata?.tlm_customer_id as string | undefined) ?? null;
      if (customerId) {
        const subAny = sub as unknown as { current_period_start?: number; current_period_end?: number };
        const periodStart = subAny.current_period_start
          ? new Date(subAny.current_period_start * 1000)
          : new Date();
        const periodEnd = subAny.current_period_end
          ? new Date(subAny.current_period_end * 1000)
          : new Date(Date.now() + 30 * 24 * 3600 * 1000);
        await db.stripeSubscription.upsert({
          where: { customerId },
          create: {
            customerId,
            stripeCustomerId: sub.customer as string,
            stripeSubscriptionId: sub.id,
            status: sub.status,
            currentPeriodStart: periodStart,
            currentPeriodEnd: periodEnd,
          },
          update: {
            status: sub.status,
            currentPeriodStart: periodStart,
            currentPeriodEnd: periodEnd,
          },
        });
      }
      break;
    }
    case "invoice.paid":
    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;
      const lineItemIds: string[] = [];
      for (const li of invoice.lines.data) {
        if ("invoice_item" in li && typeof li.invoice_item === "string") {
          lineItemIds.push(li.invoice_item);
        }
      }
      if (lineItemIds.length > 0) {
        await db.billingRecord.updateMany({
          where: { stripeInvoiceItemId: { in: lineItemIds } },
          data: { status: "PAID", stripeInvoiceId: invoice.id },
        });
      }
      break;
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const invoiceAny = invoice as unknown as {
        subscription_details?: { metadata?: Record<string, string> };
      };
      const customerMeta = (invoiceAny.subscription_details?.metadata?.tlm_customer_id ??
        invoice.metadata?.tlm_customer_id) as string | undefined;
      if (customerMeta) {
        await db.notification.create({
          data: {
            customerId: customerMeta,
            category: "BILLING",
            title: "Stripe payment failed",
            message: `Invoice ${invoice.id} failed for ${invoice.amount_due / 100}.`,
          },
        });
      }
      break;
    }
    default:
      break;
  }

  return new NextResponse("ok", { status: 200 });
}

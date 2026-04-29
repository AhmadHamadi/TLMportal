import "server-only";
import Stripe from "stripe";
import { env } from "@/lib/env";

let _client: Stripe | null = null;

export function isStripeConfigured(): boolean {
  return Boolean(env.STRIPE_SECRET_KEY);
}

export function getStripe(): Stripe {
  if (!isStripeConfigured()) {
    throw new Error("Stripe not configured (missing STRIPE_SECRET_KEY)");
  }
  if (!_client) {
    _client = new Stripe(env.STRIPE_SECRET_KEY!, {
      typescript: true,
    });
  }
  return _client;
}

export function verifyStripeSignature(
  payload: string,
  signature: string | null,
): Stripe.Event {
  if (!isStripeConfigured()) {
    throw new Error("Stripe not configured");
  }
  if (!signature) throw new Error("Missing stripe-signature header");
  if (!env.STRIPE_WEBHOOK_SECRET) {
    throw new Error("STRIPE_WEBHOOK_SECRET not set");
  }
  return getStripe().webhooks.constructEvent(
    payload,
    signature,
    env.STRIPE_WEBHOOK_SECRET,
  );
}

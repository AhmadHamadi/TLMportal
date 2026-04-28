import "server-only";

// Phase 3 stub. Real Stripe client lands when subscriptions and invoice items
// are wired. Imports of this module type-check today; calls throw.

export interface CreateSubscriptionArgs {
  customerId: string;
  monthlyRetainer: number;
}

export async function ensureStripeCustomer(_customerId: string): Promise<string> {
  throw new Error("Stripe not yet wired (Phase 3)");
}

export async function createSubscription(_args: CreateSubscriptionArgs): Promise<{ subscriptionId: string }> {
  throw new Error("Stripe not yet wired (Phase 3)");
}

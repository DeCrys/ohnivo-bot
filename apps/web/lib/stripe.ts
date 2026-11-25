import Stripe from "stripe";
import type { BillingInterval } from "@ohnivo/shared";
import { env } from "./env";
import { AppError } from "./errors";
import { stripePriceDetails, type PaidPlanId } from "./stripe-price-data";

let cached: Stripe | null = null;

export function getStripe(): Stripe {
  if (!env.STRIPE_SECRET_KEY) throw new AppError("stripe_missing", "Stripe is not configured");
  cached ??= new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });
  return cached;
}

export async function getOrCreateStripePrice(
  plan: PaidPlanId,
  interval: BillingInterval,
): Promise<string> {
  const stripe = getStripe();
  const details = stripePriceDetails(plan, interval);
  const existing = await stripe.prices.list({
    active: true,
    lookup_keys: [details.lookupKey],
    limit: 1,
  });
  if (existing.data[0]) return existing.data[0].id;

  const price = await stripe.prices.create(
    {
      currency: "czk",
      unit_amount: details.unitAmount,
      recurring: { interval },
      lookup_key: details.lookupKey,
      product_data: {
        name: details.productName,
        metadata: { ohnivo_plan: plan },
      },
      metadata: {
        ohnivo_plan: plan,
        ohnivo_interval: interval,
      },
    },
    { idempotencyKey: `ohnivo-${details.lookupKey}` },
  );
  return price.id;
}

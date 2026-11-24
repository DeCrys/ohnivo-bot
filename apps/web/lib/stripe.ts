import Stripe from "stripe";
import type { BillingInterval, PlanId } from "@ohnivo/shared";
import { env } from "./env";
import { AppError } from "./errors";

let cached: Stripe | null = null;

export function getStripe(): Stripe {
  if (!env.STRIPE_SECRET_KEY) throw new AppError("stripe_missing", "Stripe is not configured");
  cached ??= new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });
  return cached;
}

type PaidPlanId = Exclude<PlanId, "free">;

export const PLAN_PRICE_ENV: Record<PaidPlanId, Record<BillingInterval, string>> = {
  starter: { month: "STRIPE_PRICE_STARTER_MONTH", year: "STRIPE_PRICE_STARTER_YEAR" },
  premium: { month: "STRIPE_PRICE_PREMIUM_MONTH", year: "STRIPE_PRICE_PREMIUM_YEAR" },
  pro: { month: "STRIPE_PRICE_PRO_MONTH", year: "STRIPE_PRICE_PRO_YEAR" },
};

export function priceIdFor(plan: PaidPlanId, interval: BillingInterval): string | null {
  const name = PLAN_PRICE_ENV[plan][interval];
  return process.env[name] ?? null;
}

export function planFromPriceId(
  priceId: string,
): { plan: PaidPlanId; interval: BillingInterval } | null {
  for (const plan of Object.keys(PLAN_PRICE_ENV) as PaidPlanId[]) {
    for (const interval of ["month", "year"] as BillingInterval[]) {
      if (priceIdFor(plan, interval) === priceId) return { plan, interval };
    }
  }
  return null;
}

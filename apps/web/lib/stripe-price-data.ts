import { PLANS, type BillingInterval } from "@ohnivo/shared";

export type PaidPlanId = "starter" | "premium" | "pro";

const PLAN_NAMES: Record<PaidPlanId, string> = {
  starter: "Starter",
  premium: "Premium",
  pro: "Pro",
};

export function stripePriceDetails(plan: PaidPlanId, interval: BillingInterval) {
  const definition = PLANS[plan];
  const amountCzk = interval === "month" ? definition.priceMonthCzk : definition.priceYearCzk;
  const unitAmount = amountCzk * 100;

  if (!Number.isSafeInteger(unitAmount) || unitAmount <= 0) {
    throw new Error(`Invalid Stripe amount for ${plan}/${interval}`);
  }

  return {
    // Amount changes get a new Stripe price while existing subscriptions keep their price.
    lookupKey: `ohnivo_${plan}_${interval}_${unitAmount}_czk`,
    productName: `Ohnivo ${PLAN_NAMES[plan]} - ${interval === "month" ? "monthly" : "annual"}`,
    unitAmount,
  };
}

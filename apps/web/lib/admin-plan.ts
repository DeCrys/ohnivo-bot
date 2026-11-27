import { PLANS, type BillingInterval, type PlanId } from "@ohnivo/shared";

/** Credits granted once when an admin assigns a plan. Yearly means 12 months. */
export function manualPlanCredits(plan: PlanId, interval: BillingInterval | null): number {
  if (plan === "free") return 0;
  const months = interval === "year" ? 12 : 1;
  return PLANS[plan].monthlyCredits * months;
}

/** One automatic grant per target user and UTC month, even if the plan changes. */
export function manualPlanGrantKey(userId: string, now = new Date()): string {
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `manual-plan:${year}-${month}:${userId}`;
}

/**
 * Stripe keeps control of a user's plan unless an admin explicitly set a
 * manual plan and the subscription is no longer active. A real, active
 * subscription always wins so purchases keep working normally.
 */
export function shouldStripeOverridePlan(
  currentSource: string | null | undefined,
  subscriptionActive: boolean,
): boolean {
  return subscriptionActive || currentSource !== "manual";
}

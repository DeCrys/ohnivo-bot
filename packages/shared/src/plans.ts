export type PlanId = "free" | "starter" | "premium" | "pro";
export type BillingInterval = "month" | "year";

export interface PlanDefinition {
  id: PlanId;
  monthlyCredits: number;
  /** AI blueprints the plan may generate per calendar month. */
  monthlyGenerations: number;
  priceMonthCzk: number;
  priceYearCzk: number;
  /** Highlighted on the pricing page. */
  recommended?: boolean;
}

export const PLAN_ORDER: readonly PlanId[] = ["free", "starter", "premium", "pro"];

export const PLANS: Record<PlanId, PlanDefinition> = {
  free: { id: "free", monthlyCredits: 0, monthlyGenerations: 0, priceMonthCzk: 0, priceYearCzk: 0 },
  starter: {
    id: "starter",
    monthlyCredits: 300,
    monthlyGenerations: 10,
    priceMonthCzk: 149,
    priceYearCzk: 1490,
  },
  premium: {
    id: "premium",
    monthlyCredits: 900,
    monthlyGenerations: 30,
    priceMonthCzk: 349,
    priceYearCzk: 3490,
    recommended: true,
  },
  pro: {
    id: "pro",
    monthlyCredits: 2400,
    monthlyGenerations: 100,
    priceMonthCzk: 799,
    priceYearCzk: 7990,
  },
};

export function isPaidPlan(plan: string): plan is Exclude<PlanId, "free"> {
  return plan === "starter" || plan === "premium" || plan === "pro";
}

export const CREDIT_COSTS = {
  /** Blueprint generation is included in a plan, not paid for with credits. */
  generate: 40,
  regenerate: 40,
  refine: 20,
  apply: 30,
  imageIcon: 60,
  imageBanner: 45,
  imageEmoji: 15,
  imageSticker: 25,
} as const;

export type CreditCostKey = keyof typeof CREDIT_COSTS;

export function creditsForPlan(plan: PlanId): number {
  return PLANS[plan].monthlyCredits;
}

export function generationQuotaForPlan(plan: PlanId): number {
  return PLANS[plan].monthlyGenerations;
}

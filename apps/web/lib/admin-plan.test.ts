import { describe, expect, it } from "vitest";
import { manualPlanCredits, manualPlanGrantKey, shouldStripeOverridePlan } from "./admin-plan";

describe("manualPlanCredits", () => {
  it("grants nothing for a free plan", () => {
    expect(manualPlanCredits("free", "month")).toBe(0);
  });

  it("uses monthly credits for a monthly plan", () => {
    expect(manualPlanCredits("starter", "month")).toBe(300);
  });

  it("multiplies yearly credits by twelve", () => {
    expect(manualPlanCredits("premium", "year")).toBe(900 * 12);
  });
});

describe("manualPlanGrantKey", () => {
  it("is scoped to the UTC month and target user", () => {
    const now = new Date("2026-11-27T23:30:00Z");
    expect(manualPlanGrantKey("user-1", now)).toBe("manual-plan:2026-11:user-1");
  });
});

describe("shouldStripeOverridePlan", () => {
  it("keeps a manual plan when a subscription is canceled", () => {
    expect(shouldStripeOverridePlan("manual", false)).toBe(false);
  });

  it("lets a real active subscription win over a manual plan", () => {
    expect(shouldStripeOverridePlan("manual", true)).toBe(true);
  });

  it("lets Stripe manage plans that were never manual", () => {
    expect(shouldStripeOverridePlan("stripe", false)).toBe(true);
    expect(shouldStripeOverridePlan(undefined, false)).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import {
  CREDIT_PACKS,
  creditPackLookupKey,
  findCreditPack,
  generationQuotaForPlan,
  PLANS,
  type PlanId,
} from "../src/index.js";

describe("plan generation quotas", () => {
  it("gives no free generations on the free plan", () => {
    expect(generationQuotaForPlan("free")).toBe(0);
  });

  it("increases the quota with the paid tiers", () => {
    const quotas = (["starter", "premium", "pro"] as const).map(generationQuotaForPlan);
    expect(quotas).toEqual([10, 30, 100]);
    expect(quotas.every((quota, index) => index === 0 || quota > quotas[index - 1])).toBe(true);
  });

  it("keeps the monthly credit allotment unchanged", () => {
    const credits = (Object.keys(PLANS) as PlanId[]).map((plan) => PLANS[plan].monthlyCredits);
    expect(credits).toEqual([0, 300, 900, 2400]);
  });
});

describe("credit packs", () => {
  it("resolves packs by id and builds stable Stripe lookup keys", () => {
    for (const pack of CREDIT_PACKS) {
      expect(findCreditPack(pack.id)).toBe(pack);
      expect(creditPackLookupKey(pack)).toBe(
        `ohnivo_credits_${pack.credits}_${pack.priceCzk * 100}_czk`,
      );
    }
  });

  it("rejects unknown packs", () => {
    expect(findCreditPack("unlimited")).toBeUndefined();
  });
});

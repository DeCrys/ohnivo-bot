import { describe, expect, it } from "vitest";
import { stripePriceDetails } from "./stripe-price-data";

describe("stripePriceDetails", () => {
  it("uses the configured CZK amount in Stripe's minor units", () => {
    expect(stripePriceDetails("starter", "month")).toEqual({
      lookupKey: "ohnivo_starter_month_14900_czk",
      productName: "Ohnivo Starter - monthly",
      unitAmount: 14900,
    });
    expect(stripePriceDetails("premium", "year").unitAmount).toBe(349000);
    expect(stripePriceDetails("pro", "year").unitAmount).toBe(799000);
  });

  it("uses distinct stable lookup keys for billing intervals", () => {
    expect(stripePriceDetails("starter", "month").lookupKey).not.toBe(
      stripePriceDetails("starter", "year").lookupKey,
    );
  });
});

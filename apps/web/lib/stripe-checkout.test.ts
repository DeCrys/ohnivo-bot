import { describe, expect, it } from "vitest";
import { isMissingStripeCustomerError } from "./stripe-checkout";

describe("isMissingStripeCustomerError", () => {
  it("recognizes a Stripe checkout request with a customer ID from another mode", () => {
    expect(
      isMissingStripeCustomerError({
        type: "StripeInvalidRequestError",
        code: "resource_missing",
        param: "customer",
      }),
    ).toBe(true);
  });

  it("does not recover from unrelated Stripe errors", () => {
    expect(
      isMissingStripeCustomerError({
        type: "StripeInvalidRequestError",
        code: "resource_missing",
        param: "price",
      }),
    ).toBe(false);
    expect(
      isMissingStripeCustomerError({
        type: "StripeAuthenticationError",
        code: "resource_missing",
        param: "customer",
      }),
    ).toBe(false);
  });
});

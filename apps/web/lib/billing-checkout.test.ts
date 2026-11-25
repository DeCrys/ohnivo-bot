import { describe, expect, it } from "vitest";
import { hasSubscriptionCreditsSince } from "./billing-checkout";

describe("hasSubscriptionCreditsSince", () => {
  const checkoutStartedAt = Date.parse("2026-11-25T15:00:00.000Z");

  it("confirms credits granted after checkout started", () => {
    expect(
      hasSubscriptionCreditsSince(
        [{ kind: "subscription", created_at: "2026-11-25T15:01:00.000Z" }],
        String(checkoutStartedAt),
      ),
    ).toBe(true);
  });

  it("does not mistake earlier or unrelated credits for this checkout", () => {
    expect(
      hasSubscriptionCreditsSince(
        [
          { kind: "subscription", created_at: "2026-11-25T14:59:59.000Z" },
          { kind: "admin_grant", created_at: "2026-11-25T15:02:00.000Z" },
        ],
        String(checkoutStartedAt),
      ),
    ).toBe(false);
  });

  it("keeps the confirmation pending when the checkout timestamp is missing or invalid", () => {
    const ledger = [{ kind: "subscription", created_at: "2026-11-25T15:01:00.000Z" }];
    expect(hasSubscriptionCreditsSince(ledger)).toBe(false);
    expect(hasSubscriptionCreditsSince(ledger, "invalid")).toBe(false);
  });
});

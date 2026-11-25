type CreditEntry = {
  created_at: string;
  kind: string;
};

export function hasSubscriptionCreditsSince(
  ledger: readonly CreditEntry[],
  checkoutStartedAt?: string,
): boolean {
  const startedAt = Number(checkoutStartedAt);
  if (!Number.isSafeInteger(startedAt) || startedAt <= 0) return false;

  return ledger.some(
    (entry) => entry.kind === "subscription" && Date.parse(entry.created_at) >= startedAt,
  );
}

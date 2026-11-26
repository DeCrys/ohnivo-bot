export interface CreditPackDefinition {
  id: string;
  credits: number;
  priceCzk: number;
}

/** One-off top-ups. Available to every user regardless of plan, never expire. */
export const CREDIT_PACKS: readonly CreditPackDefinition[] = [
  { id: "small", credits: 100, priceCzk: 199 },
  { id: "medium", credits: 300, priceCzk: 499 },
  { id: "large", credits: 1000, priceCzk: 1490 },
] as const;

export function findCreditPack(id: string): CreditPackDefinition | undefined {
  return CREDIT_PACKS.find((pack) => pack.id === id);
}

/** Matches the plan convention: ohnivo_<product>_<amount>_<unitAmount>_czk. */
export function creditPackLookupKey(pack: CreditPackDefinition): string {
  return `ohnivo_credits_${pack.credits}_${pack.priceCzk * 100}_czk`;
}

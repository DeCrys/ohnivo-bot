import { AppError, isInsufficientCreditsError } from "./errors";
import { getServiceClient } from "./supabase/service";

export async function getCreditBalance(userId: string): Promise<number> {
  const { data, error } = await getServiceClient().rpc("credit_balance", { p_user: userId });
  if (error) throw new AppError("unknown", `Credit balance failed: ${error.message}`);
  return Number(data ?? 0);
}

export async function spendCredits(
  userId: string,
  amount: number,
  kind: string,
  meta: Record<string, unknown> = {},
): Promise<number> {
  const { data, error } = await getServiceClient().rpc("spend_credits", {
    p_user: userId,
    p_amount: amount,
    p_kind: kind,
    p_meta: meta,
  });
  if (error) {
    if (isInsufficientCreditsError(error)) {
      throw new AppError("insufficient_credits", "Insufficient credits");
    }
    throw new AppError("unknown", `Credit spend failed: ${error.message}`);
  }
  return Number(data ?? 0);
}

export async function grantCredits(
  userId: string,
  amount: number,
  kind: string,
  meta: Record<string, unknown> = {},
): Promise<number> {
  const { data, error } = await getServiceClient().rpc("grant_credits", {
    p_user: userId,
    p_amount: amount,
    p_kind: kind,
    p_meta: meta,
  });
  if (error) throw new AppError("unknown", `Credit grant failed: ${error.message}`);
  return Number(data ?? 0);
}

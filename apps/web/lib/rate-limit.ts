import { env } from "./env";
import { AppError } from "./errors";
import { getServiceClient } from "./supabase/service";

export async function assertAiRateLimit(userId: string): Promise<void> {
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error } = await getServiceClient()
    .from("ai_usage")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", since);
  if (error) {
    console.error("[rate-limit] query failed", error.message);
    return;
  }
  if ((count ?? 0) >= env.AI_RATE_LIMIT_PER_HOUR) {
    throw new AppError("rate_limited", "AI rate limit reached");
  }
}

interface UsageInput {
  userId: string;
  action: string;
  model?: string | null;
  inputTokens?: number | null;
  outputTokens?: number | null;
  ok: boolean;
  errorCode?: string | null;
}

export async function recordAiUsage(input: UsageInput): Promise<void> {
  const { error } = await getServiceClient().from("ai_usage").insert({
    user_id: input.userId,
    action: input.action,
    model: input.model ?? null,
    input_tokens: input.inputTokens ?? null,
    output_tokens: input.outputTokens ?? null,
    ok: input.ok,
    error_code: input.errorCode ?? null,
  });
  if (error) console.error("[ai] usage log failed", error.message);
}

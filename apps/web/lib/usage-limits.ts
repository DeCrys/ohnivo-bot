import { generationQuotaForPlan, isPaidPlan, type PlanId } from "@ohnivo/shared";
import { isAdminUser } from "./auth/admin";
import { env } from "./env";
import { AppError } from "./errors";
import { getServiceClient } from "./supabase/service";

interface QuotaUser {
  id: string;
  discord_id: string;
  is_admin: boolean;
  plan: string;
}

export interface GenerationAccess {
  allowed: boolean;
  planRequired: boolean;
  used: number;
  limit: number;
  resetsAt: string;
  plan: PlanId;
}

function monthStart(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

function nextMonthStart(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
}

/** Successful generations in the current UTC calendar month. */
export async function getGenerationUsage(userId: string): Promise<number> {
  const { count, error } = await getServiceClient()
    .from("ai_usage")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("action", "generate")
    .eq("ok", true)
    .gte("created_at", monthStart(new Date()).toISOString());
  if (error) {
    console.error("[usage-limits] generation query failed", error.message);
    return 0;
  }
  return count ?? 0;
}

/**
 * Generations are a plan feature, not a credit cost. Admins keep their local
 * development bypass and get the largest quota when they have no plan.
 */
export function generationAccess(user: QuotaUser, used: number, now = new Date()): GenerationAccess {
  const paid = isPaidPlan(user.plan);
  const plan: PlanId = paid
    ? (user.plan as Exclude<PlanId, "free">)
    : isAdminUser(user)
      ? "pro"
      : "free";
  const limit = generationQuotaForPlan(plan);

  return {
    allowed: limit > 0 && used < limit,
    planRequired: limit === 0,
    used,
    limit,
    resetsAt: nextMonthStart(now).toISOString(),
    plan,
  };
}

export async function assertGenerationQuota(user: QuotaUser): Promise<void> {
  const used = await getGenerationUsage(user.id);
  const access = generationAccess(user, used);
  if (access.planRequired) {
    throw new AppError("plan_required", "AI generation requires a paid plan");
  }
  if (!access.allowed) {
    throw new AppError("generation_limit", "Monthly generation quota reached", {
      used: access.used,
      limit: access.limit,
      resetsAt: access.resetsAt,
    });
  }
}

/** Applying a draft is free for its owner, but still bounded to avoid abuse. */
export async function assertApplyRateLimit(userId: string): Promise<void> {
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error } = await getServiceClient()
    .from("apply_jobs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", since);
  if (error) {
    console.error("[usage-limits] apply query failed", error.message);
    return;
  }
  if ((count ?? 0) >= env.APPLY_RATE_LIMIT_PER_HOUR) {
    throw new AppError("apply_rate_limited", "Too many builds started recently");
  }
}

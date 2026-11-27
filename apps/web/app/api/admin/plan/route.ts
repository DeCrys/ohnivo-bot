import { NextResponse } from "next/server";
import { z } from "zod";
import type { PlanId } from "@ohnivo/shared";
import { manualPlanCredits, manualPlanGrantKey } from "@/lib/admin-plan";
import { isAdminUser } from "@/lib/auth/admin";
import { requireApiUser } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit";
import { AppError } from "@/lib/errors";
import { assertSameOrigin, errorResponse, parseJson } from "@/lib/http";
import { getServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  targetUserId: z.string().uuid(),
  plan: z.enum(["free", "starter", "premium", "pro"]),
  interval: z.enum(["month", "year"]).nullable().optional(),
  reason: z.string().trim().min(3).max(200),
});

interface AssignmentResult {
  balance: number;
  creditsGranted: boolean;
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const session = await requireApiUser();
    if (!isAdminUser(session.user)) {
      throw new AppError("forbidden", "Administrator access required");
    }

    const body = await parseJson(request, (value) => bodySchema.parse(value));
    const interval = body.plan === "free" ? null : (body.interval ?? "month");
    if (body.plan !== "free" && !body.interval) {
      throw new AppError("invalid_input", "A paid plan needs an interval");
    }

    const service = getServiceClient();
    const { data: target, error: lookupError } = await service
      .from("users")
      .select("id")
      .eq("id", body.targetUserId)
      .maybeSingle();
    if (lookupError) throw new AppError("unknown", `User lookup failed: ${lookupError.message}`);
    if (!target) throw new AppError("not_found", "User not found");

    const amount = manualPlanCredits(body.plan as PlanId, interval);
    const grantKey = manualPlanGrantKey(body.targetUserId);
    const { data, error } = await service.rpc("admin_assign_manual_plan", {
      p_target: body.targetUserId,
      p_actor: session.user.id,
      p_plan: body.plan,
      p_interval: interval,
      p_amount: amount,
      p_reason: body.reason,
      p_grant_key: grantKey,
    });
    if (error) throw new AppError("unknown", `Manual plan assignment failed: ${error.message}`);
    const result = (data ?? {}) as AssignmentResult;

    await logAudit({
      actorUserId: session.user.id,
      action: "admin.plan_assign",
      meta: {
        targetUserId: body.targetUserId,
        plan: body.plan,
        interval,
        credits: amount,
        grantKey,
        reason: body.reason,
      },
    });

    return NextResponse.json({
      targetUserId: body.targetUserId,
      plan: body.plan,
      interval,
      balance: Number(result.balance ?? 0),
      creditsGranted: Boolean(result.creditsGranted),
      credits: amount,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

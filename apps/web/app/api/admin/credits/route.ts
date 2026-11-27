import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser } from "@/lib/auth/session";
import { isAdminUser } from "@/lib/auth/admin";
import { logAudit } from "@/lib/audit";
import { getCreditBalance, grantCredits } from "@/lib/credits";
import { AppError } from "@/lib/errors";
import { assertSameOrigin, errorResponse, parseJson } from "@/lib/http";
import { getServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  amount: z.number().int().min(1).max(10_000),
  reason: z.string().trim().min(3).max(200),
  targetUserId: z.string().uuid().optional(),
});

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const session = await requireApiUser();
    if (!isAdminUser(session.user)) {
      throw new AppError("forbidden", "Administrator access required");
    }

    const body = await parseJson(request, (value) => bodySchema.parse(value));
    const targetUserId = body.targetUserId ?? session.user.id;
    const service = getServiceClient();
    const { data: target, error: lookupError } = await service
      .from("users")
      .select("id")
      .eq("id", targetUserId)
      .maybeSingle();
    if (lookupError) throw new AppError("unknown", `User lookup failed: ${lookupError.message}`);
    if (!target) throw new AppError("not_found", "User not found");

    const balance = await grantCredits(targetUserId, body.amount, "admin_grant", {
      reason: body.reason,
      source: "admin_panel",
      actorUserId: session.user.id,
      targetUserId,
    });
    await logAudit({
      actorUserId: session.user.id,
      action: "admin.credit_grant",
      meta: { amount: body.amount, reason: body.reason, targetUserId },
    });

    return NextResponse.json({ balance, targetUserId });
  } catch (error) {
    return errorResponse(error);
  }
}

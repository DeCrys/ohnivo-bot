import { NextResponse } from "next/server";
import { z } from "zod";
import { CREDIT_COSTS, isPaidPlan } from "@ohnivo/shared";
import { generateValidatedBlueprint } from "@/lib/ai/service";
import { sanitizePrompt } from "@/lib/ai/sanitize";
import { requireApiUser } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit";
import { getCreditBalance, grantCredits, spendCredits } from "@/lib/credits";
import { AppError } from "@/lib/errors";
import { assertGuildAccess } from "@/lib/guild-access";
import { assertSameOrigin, errorResponse, parseJson } from "@/lib/http";
import { assertAiRateLimit, recordAiUsage } from "@/lib/rate-limit";
import { getServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const bodySchema = z.object({
  guildId: z.string().min(5).max(25),
  prompt: z.string().min(3).max(1200),
});

export async function POST(request: Request) {
  let userId: string | null = null;
  let charged = false;
  try {
    assertSameOrigin(request);
    const session = await requireApiUser();
    userId = session.user.id;

    const body = await parseJson(request, (value) => bodySchema.parse(value));
    const prompt = sanitizePrompt(body.prompt);
    const access = await assertGuildAccess(session.user.id, body.guildId);

    if (!isPaidPlan(session.user.plan)) {
      throw new AppError("plan_required", "AI generation requires a paid plan");
    }
    await assertAiRateLimit(session.user.id);

    const balance = await getCreditBalance(session.user.id);
    if (balance < CREDIT_COSTS.generate) {
      throw new AppError("insufficient_credits", "Not enough credits");
    }

    await spendCredits(session.user.id, CREDIT_COSTS.generate, "generate", {
      guildId: access.guild.id,
    });
    charged = true;

    const result = await generateValidatedBlueprint(prompt);

    const { data, error } = await getServiceClient()
      .from("blueprints")
      .insert({
        user_id: session.user.id,
        guild_id: access.guild.id,
        title: result.blueprint.serverName,
        prompt,
        data: result.blueprint,
        issues: result.issues,
        removed_permissions: result.removedPermissions,
      })
      .select("id")
      .single();
    if (error || !data) {
      throw new AppError("unknown", `Could not save blueprint: ${error?.message ?? "unknown"}`);
    }

    await recordAiUsage({
      userId: session.user.id,
      action: "generate",
      model: result.model,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      ok: true,
    });
    await logAudit({
      actorUserId: session.user.id,
      action: "blueprint.generate",
      guildId: access.guild.id,
      meta: { blueprintId: data.id, demo: result.demo, model: result.model },
    });

    return NextResponse.json({
      blueprintId: data.id,
      blueprint: result.blueprint,
      issues: result.issues,
      removedPermissions: result.removedPermissions,
      demo: result.demo,
    });
  } catch (error) {
    if (charged && userId) {
      try {
        await grantCredits(userId, CREDIT_COSTS.generate, "refund", { reason: "generate_failed" });
      } catch (refundError) {
        console.error("[credits] generate refund failed", refundError);
      }
    }
    if (userId) {
      await recordAiUsage({
        userId,
        action: "generate",
        ok: false,
        errorCode: error instanceof AppError ? error.code : "unknown",
      });
    }
    return errorResponse(error);
  }
}

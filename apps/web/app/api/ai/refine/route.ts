import { NextResponse } from "next/server";
import { z } from "zod";
import { CREDIT_COSTS } from "@ohnivo/shared";
import { refineValidatedBlueprint } from "@/lib/ai/service";
import { sanitizeInstruction } from "@/lib/ai/sanitize";
import { requireApiUser } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit";
import { getCreditBalance, grantCredits, spendCredits } from "@/lib/credits";
import { AppError } from "@/lib/errors";
import { assertGuildAccess } from "@/lib/guild-access";
import { assertSameOrigin, errorResponse, parseJson } from "@/lib/http";
import { getOwnedBlueprint } from "@/lib/jobs";
import { assertAiRateLimit, recordAiUsage } from "@/lib/rate-limit";
import { getServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const bodySchema = z.object({
  blueprintId: z.string().uuid(),
  instruction: z.string().min(3).max(600),
});

export async function POST(request: Request) {
  let userId: string | null = null;
  let charged = false;
  try {
    assertSameOrigin(request);
    const session = await requireApiUser();
    userId = session.user.id;

    const body = await parseJson(request, (value) => bodySchema.parse(value));
    const instruction = sanitizeInstruction(body.instruction);
    const blueprint = await getOwnedBlueprint(body.blueprintId, session.user.id);
    const access = await assertGuildAccess(session.user.id, blueprint.guild_id);

    await assertAiRateLimit(session.user.id);

    const balance = await getCreditBalance(session.user.id);
    if (balance < CREDIT_COSTS.refine) {
      throw new AppError("insufficient_credits", "Not enough credits");
    }

    await spendCredits(session.user.id, CREDIT_COSTS.refine, "refine", {
      guildId: blueprint.guild_id,
      blueprintId: blueprint.id,
    });
    charged = true;

    const result = await refineValidatedBlueprint(blueprint.data, instruction);
    const { error } = await getServiceClient()
      .from("blueprints")
      .update({
        title: result.blueprint.serverName,
        data: result.blueprint,
        issues: result.issues,
        removed_permissions: result.removedPermissions,
        revision: blueprint.revision + 1,
      })
      .eq("id", blueprint.id)
      .eq("user_id", session.user.id);
    if (error) throw new AppError("unknown", `Could not save blueprint: ${error.message}`);

    await recordAiUsage({
      userId: session.user.id,
      action: "refine",
      model: result.model,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      ok: true,
    });
    await logAudit({
      actorUserId: session.user.id,
      action: "blueprint.refine",
      guildId: access.guild.id,
      meta: { blueprintId: blueprint.id, instruction: instruction.slice(0, 200) },
    });

    return NextResponse.json({
      blueprint: result.blueprint,
      issues: result.issues,
      removedPermissions: result.removedPermissions,
      revision: blueprint.revision + 1,
      demo: result.demo,
    });
  } catch (error) {
    if (charged && userId) {
      try {
        await grantCredits(userId, CREDIT_COSTS.refine, "refund", { reason: "refine_failed" });
      } catch (refundError) {
        console.error("[credits] refine refund failed", refundError);
      }
    }
    if (userId) {
      await recordAiUsage({
        userId,
        action: "refine",
        ok: false,
        errorCode: error instanceof AppError ? error.code : "unknown",
      });
    }
    return errorResponse(error);
  }
}

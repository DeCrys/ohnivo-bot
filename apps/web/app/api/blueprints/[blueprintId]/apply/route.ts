import { NextResponse } from "next/server";
import { z } from "zod";
import { CREDIT_COSTS, isPaidPlan } from "@ohnivo/shared";
import { requireApiUser } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit";
import { getCreditBalance, grantCredits, spendCredits } from "@/lib/credits";
import { checkBotPresence } from "@/lib/discord";
import { AppError } from "@/lib/errors";
import { assertGuildAccess } from "@/lib/guild-access";
import { assertSameOrigin, errorResponse, parseJson } from "@/lib/http";
import {
  applySummary,
  getOwnedBlueprint,
  initialProgress,
  requireBotPresent,
} from "@/lib/jobs";
import { getServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  mode: z.enum(["merge", "append"]).default("merge"),
});

export async function POST(
  request: Request,
  { params }: { params: { blueprintId: string } },
) {
  let userId: string | null = null;
  let charged = false;
  try {
    assertSameOrigin(request);
    const session = await requireApiUser();
    userId = session.user.id;
    const body = await parseJson(request, (value) => bodySchema.parse(value));

    const blueprint = await getOwnedBlueprint(params.blueprintId, session.user.id);
    const access = await assertGuildAccess(session.user.id, blueprint.guild_id);

    if (!isPaidPlan(session.user.plan)) {
      throw new AppError("plan_required", "Applying a blueprint requires a paid plan");
    }

    const { data: activeJob } = await getServiceClient()
      .from("apply_jobs")
      .select("id")
      .eq("blueprint_id", blueprint.id)
      .in("status", ["queued", "running"])
      .maybeSingle();
    if (activeJob) throw new AppError("job_active", "An apply job is already running");

    const botPresent = await requireBotPresent(access.guild, checkBotPresence);
    if (!botPresent) throw new AppError("bot_missing", "The bot is not on this guild");

    const balance = await getCreditBalance(session.user.id);
    if (balance < CREDIT_COSTS.apply) {
      throw new AppError("insufficient_credits", "Not enough credits");
    }

    await spendCredits(session.user.id, CREDIT_COSTS.apply, "apply", {
      guildId: access.guild.id,
      blueprintId: blueprint.id,
      mode: body.mode,
    });
    charged = true;

    const { data: job, error } = await getServiceClient()
      .from("apply_jobs")
      .insert({
        user_id: session.user.id,
        guild_id: access.guild.id,
        blueprint_id: blueprint.id,
        blueprint_revision: blueprint.revision,
        blueprint_snapshot: blueprint.data,
        mode: body.mode,
        status: "queued",
        progress: initialProgress(blueprint.data, body.mode),
        summary: applySummary(blueprint.data, body.mode),
        cost: CREDIT_COSTS.apply,
      })
      .select("*")
      .single();

    if (error || !job) {
      if (error?.code === "23505") {
        throw new AppError("job_active", "An apply job is already running");
      }
      throw new AppError("unknown", `Could not queue the job: ${error?.message ?? "unknown"}`);
    }

    await getServiceClient()
      .from("blueprints")
      .update({ status: "queued" })
      .eq("id", blueprint.id)
      .eq("user_id", session.user.id);

    await logAudit({
      actorUserId: session.user.id,
      action: "apply.queue",
      guildId: access.guild.id,
      jobId: job.id as string,
      meta: {
        blueprintId: blueprint.id,
        revision: blueprint.revision,
        mode: body.mode,
        cost: CREDIT_COSTS.apply,
      },
    });

    return NextResponse.json({
      jobId: job.id,
      balance: balance - CREDIT_COSTS.apply,
    });
  } catch (error) {
    if (charged && userId) {
      try {
        await grantCredits(userId, CREDIT_COSTS.apply, "refund", { reason: "apply_queue_failed" });
      } catch (refundError) {
        console.error("[credits] apply refund failed", refundError);
      }
    }
    return errorResponse(error);
  }
}

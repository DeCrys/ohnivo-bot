import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit";
import { isManualBlueprint } from "@/lib/blueprint-source";
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
import { assertApplyRateLimit } from "@/lib/usage-limits";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  mode: z.enum(["merge", "append", "replace"]).default("append"),
  confirmReplace: z.enum(["SMAZAT", "DELETE"]).optional(),
});

export async function POST(
  request: Request,
  { params }: { params: { blueprintId: string } },
) {
  try {
    assertSameOrigin(request);
    const session = await requireApiUser();
    const body = await parseJson(request, (value) => bodySchema.parse(value));
    if (body.mode === "replace" && !body.confirmReplace) {
      throw new AppError("invalid_input", "Replacing the existing structure requires confirmation");
    }

    const blueprint = await getOwnedBlueprint(params.blueprintId, session.user.id);
    const access = await assertGuildAccess(session.user.id, blueprint.guild_id);

    // Applying your own draft is free for everyone; only the bot work is rate limited.
    await assertApplyRateLimit(session.user.id);

    const { data: activeJob } = await getServiceClient()
      .from("apply_jobs")
      .select("id")
      .eq("blueprint_id", blueprint.id)
      .in("status", ["queued", "running"])
      .maybeSingle();
    if (activeJob) throw new AppError("job_active", "An apply job is already running");

    const botPresent = await requireBotPresent(access.guild, checkBotPresence);
    if (!botPresent) throw new AppError("bot_missing", "The bot is not on this guild");

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
        cost: 0,
      })
      .select("*")
      .single();

    if (error || !job) {
      if (error?.code === "23505") {
        throw new AppError("job_active", "An apply job is already running");
      }
      if (
        body.mode === "replace" &&
        error?.code === "23514" &&
        error.message.includes("apply_jobs_mode_check")
      ) {
        throw new AppError(
          "replace_not_ready",
          "Apply the replace-mode database migration and update the bot before retrying",
        );
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
        cost: 0,
        source: isManualBlueprint(blueprint) ? "manual" : "ai",
        destructiveConfirmed: body.mode === "replace" && body.confirmReplace !== undefined,
      },
    });

    return NextResponse.json({ jobId: job.id });
  } catch (error) {
    return errorResponse(error);
  }
}

import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit";
import { grantCredits } from "@/lib/credits";
import { AppError } from "@/lib/errors";
import { assertSameOrigin, errorResponse } from "@/lib/http";
import { notify } from "@/lib/notifications";
import { getServiceClient } from "@/lib/supabase/service";
import type { ApplyJobRow } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * Only queued jobs can be cancelled. Once the bot has claimed a job we let it
 * finish (it never deletes existing objects) instead of killing it mid-build.
 */
export async function POST(
  request: Request,
  { params }: { params: { jobId: string } },
) {
  try {
    assertSameOrigin(request);
    const session = await requireApiUser();
    const service = getServiceClient();

    const { data, error } = await service
      .from("apply_jobs")
      .select("*")
      .eq("id", params.jobId)
      .eq("user_id", session.user.id)
      .maybeSingle();
    if (error) throw new AppError("unknown", `Job lookup failed: ${error.message}`);
    if (!data) throw new AppError("not_found", "Job not found");
    const job = data as ApplyJobRow;

    if (job.status !== "queued") {
      throw new AppError("invalid_input", "Only queued jobs can be cancelled");
    }

    const { data: updated, error: updateError } = await service
      .from("apply_jobs")
      .update({
        status: "cancelled",
        refunded: true,
        finished_at: new Date().toISOString(),
      })
      .eq("id", job.id)
      .eq("user_id", session.user.id)
      .eq("status", "queued")
      .select("*")
      .maybeSingle();
    if (updateError) throw new AppError("unknown", `Cancel failed: ${updateError.message}`);

    if (updated) {
      await grantCredits(session.user.id, job.cost, "refund", {
        reason: "job_cancelled",
        jobId: job.id,
      });
      await service
        .from("blueprints")
        .update({ status: "draft" })
        .eq("id", job.blueprint_id)
        .eq("user_id", session.user.id);
      await notify(session.user.id, {
        type: "job_cancelled",
        title: "Stavba zrušena",
        body: `Job byl zrušen před spuštěním a ${job.cost} kreditů se vrátilo na účet.`,
        href: `/dashboard/${job.guild_id}`,
      });
      await logAudit({
        actorUserId: session.user.id,
        action: "apply.cancel",
        guildId: job.guild_id,
        jobId: job.id,
        meta: { refunded: job.cost },
      });
    }

    return NextResponse.json({
      ok: true,
      status: updated ? "cancelled" : job.status,
      refunded: Boolean(updated),
    });
  } catch (error) {
    return errorResponse(error);
  }
}

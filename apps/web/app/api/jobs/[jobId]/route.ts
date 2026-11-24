import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/session";
import { errorResponse } from "@/lib/http";
import { assertGuildAccess } from "@/lib/guild-access";
import { getServiceClient } from "@/lib/supabase/service";
import { AppError } from "@/lib/errors";
import type { ApplyJobRow } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { jobId: string } },
) {
  try {
    const session = await requireApiUser();
    const { data, error } = await getServiceClient()
      .from("apply_jobs")
      .select("*")
      .eq("id", params.jobId)
      .eq("user_id", session.user.id)
      .maybeSingle();
    if (error) throw new AppError("unknown", `Job lookup failed: ${error.message}`);
    if (!data) throw new AppError("not_found", "Job not found");

    const job = data as ApplyJobRow;
    await assertGuildAccess(session.user.id, job.guild_id);
    return NextResponse.json(job);
  } catch (error) {
    return errorResponse(error);
  }
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { normalizeBlueprint } from "@ohnivo/shared";
import { requireApiUser } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit";
import { AppError } from "@/lib/errors";
import { assertGuildAccess } from "@/lib/guild-access";
import { assertSameOrigin, errorResponse, parseJson } from "@/lib/http";
import { getOwnedBlueprint } from "@/lib/jobs";
import { getServiceClient } from "@/lib/supabase/service";
import type { ApplyJobRow } from "@/lib/types";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  blueprint: z.unknown(),
});

export async function PATCH(
  request: Request,
  { params }: { params: { blueprintId: string } },
) {
  try {
    assertSameOrigin(request);
    const session = await requireApiUser();
    const body = await parseJson(request, (value) => bodySchema.parse(value));
    const blueprint = await getOwnedBlueprint(params.blueprintId, session.user.id);
    const access = await assertGuildAccess(session.user.id, blueprint.guild_id);

    const { data: activeJob } = await getServiceClient()
      .from("apply_jobs")
      .select("id")
      .eq("blueprint_id", blueprint.id)
      .in("status", ["queued", "running"])
      .maybeSingle();
    if (activeJob) throw new AppError("job_active", "An apply job is already running");

    const normalized = normalizeBlueprint(body.blueprint);
    const { data, error } = await getServiceClient()
      .from("blueprints")
      .update({
        title: normalized.blueprint.serverName,
        data: normalized.blueprint,
        issues: normalized.issues,
        removed_permissions: normalized.removedPermissions,
        revision: blueprint.revision + 1,
      })
      .eq("id", blueprint.id)
      .eq("user_id", session.user.id)
      .select("*")
      .single();
    if (error || !data) {
      throw new AppError("unknown", `Could not save blueprint: ${error?.message ?? "unknown"}`);
    }

    await logAudit({
      actorUserId: session.user.id,
      action: "blueprint.edit",
      guildId: access.guild.id,
      meta: { blueprintId: blueprint.id, revision: blueprint.revision + 1 },
    });

    return NextResponse.json({
      blueprint: normalized.blueprint,
      issues: normalized.issues,
      removedPermissions: normalized.removedPermissions,
      revision: (data as { revision: number }).revision,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function GET(
  _request: Request,
  { params }: { params: { blueprintId: string } },
) {
  try {
    const session = await requireApiUser();
    const blueprint = await getOwnedBlueprint(params.blueprintId, session.user.id);
    const { data: activeJob } = await getServiceClient()
      .from("apply_jobs")
      .select("*")
      .eq("blueprint_id", blueprint.id)
      .in("status", ["queued", "running"])
      .maybeSingle();
    return NextResponse.json({
      blueprint,
      activeJob: (activeJob as ApplyJobRow | null) ?? null,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

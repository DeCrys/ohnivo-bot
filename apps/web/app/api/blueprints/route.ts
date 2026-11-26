import { NextResponse } from "next/server";
import { z } from "zod";
import { createStarterBlueprint } from "@ohnivo/shared";
import { requireApiUser } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit";
import { AppError } from "@/lib/errors";
import { assertGuildAccess } from "@/lib/guild-access";
import { assertSameOrigin, errorResponse, parseJson } from "@/lib/http";
import { getServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  guildId: z.string().min(5).max(25),
});

/** Create an editable draft without spending AI credits. */
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const session = await requireApiUser();
    const body = await parseJson(request, (value) => bodySchema.parse(value));
    const access = await assertGuildAccess(session.user.id, body.guildId);

    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await getServiceClient()
      .from("blueprints")
      .select("id", { count: "exact", head: true })
      .eq("user_id", session.user.id)
      .eq("prompt", "")
      .gte("created_at", since);
    if ((count ?? 0) >= 20) {
      throw new AppError("rate_limited", "Too many drafts created recently");
    }

    const blueprint = createStarterBlueprint(access.guild.name);
    const { data, error } = await getServiceClient()
      .from("blueprints")
      .insert({
        user_id: session.user.id,
        guild_id: access.guild.id,
        title: blueprint.serverName,
        prompt: "",
        data: blueprint,
        issues: [],
        removed_permissions: [],
      })
      .select("id")
      .single();
    if (error || !data) {
      throw new Error(`Could not create blueprint: ${error?.message ?? "unknown"}`);
    }

    // Best effort: works before migration 0007 is applied too.
    await getServiceClient()
      .from("blueprints")
      .update({ source: "manual" })
      .eq("id", data.id);

    await logAudit({
      actorUserId: session.user.id,
      action: "blueprint.create_manual",
      guildId: access.guild.id,
      meta: { blueprintId: data.id },
    });

    return NextResponse.json({ blueprintId: data.id });
  } catch (error) {
    return errorResponse(error);
  }
}

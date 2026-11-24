import {
  buildApplyPlan,
  type ApplyMode,
  type ApplyProgressEntry,
  type ServerBlueprint,
} from "@ohnivo/shared";
import { AppError } from "./errors";
import { getServiceClient } from "./supabase/service";
import type { BlueprintRow, GuildRow } from "./types";

export function initialProgress(
  blueprint: ServerBlueprint,
  mode: ApplyMode,
): ApplyProgressEntry[] {
  return buildApplyPlan(blueprint, { mode }).steps.map((step) => ({
    key: step.key,
    kind: step.kind,
    label: step.label,
    status: "pending" as const,
  }));
}

export function applySummary(blueprint: ServerBlueprint, mode: ApplyMode) {
  const plan = buildApplyPlan(blueprint, { mode });
  return {
    roles: plan.summary.roles,
    categories: plan.summary.categories,
    channels: plan.summary.channels,
    overwrites: plan.summary.overwrites,
    messages: plan.summary.messages,
  };
}

export async function getOwnedBlueprint(
  blueprintId: string,
  userId: string,
): Promise<BlueprintRow> {
  const { data, error } = await getServiceClient()
    .from("blueprints")
    .select("*")
    .eq("id", blueprintId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new AppError("unknown", `Blueprint lookup failed: ${error.message}`);
  if (!data) throw new AppError("not_found", "Blueprint not found");
  return data as BlueprintRow;
}

/**
 * The bot must be a member before a job can be queued. We re-check Discord
 * when a bot token is configured, otherwise fall back to the cached flag.
 */
export async function requireBotPresent(
  guild: GuildRow,
  check: (guildId: string) => Promise<boolean | null>,
): Promise<boolean> {
  const live = await check(guild.id);
  if (live === null) return guild.bot_present;
  if (live !== guild.bot_present) {
    await getServiceClient()
      .from("guilds")
      .update({ bot_present: live, bot_present_checked_at: new Date().toISOString() })
      .eq("id", guild.id);
  }
  return live;
}

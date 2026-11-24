import { AppError } from "./errors";
import { getServiceClient } from "./supabase/service";
import type { GuildMemberRow, GuildRow } from "./types";

export interface GuildAccess {
  guild: GuildRow;
  member: GuildMemberRow;
}

const GUILD_ID_PATTERN = /^\d{5,25}$/;

export function isValidGuildId(guildId: string): boolean {
  return GUILD_ID_PATTERN.test(guildId);
}

/**
 * Server-side authorization. Never trust a guild ID from the client without
 * calling this (or relying on RLS through the user-scoped client).
 */
export async function assertGuildAccess(userId: string, guildId: string): Promise<GuildAccess> {
  if (!isValidGuildId(guildId)) throw new AppError("forbidden", "Invalid guild id");
  const service = getServiceClient();
  const { data: member, error } = await service
    .from("guild_members")
    .select("*")
    .eq("guild_id", guildId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new AppError("unknown", `Guild access check failed: ${error.message}`);
  if (!member) throw new AppError("forbidden", "You do not manage this guild");

  const { data: guild, error: guildError } = await service
    .from("guilds")
    .select("*")
    .eq("id", guildId)
    .maybeSingle();
  if (guildError) throw new AppError("unknown", `Guild lookup failed: ${guildError.message}`);
  if (!guild) throw new AppError("guild_not_found", "Guild not found");

  return { guild: guild as GuildRow, member: member as GuildMemberRow };
}

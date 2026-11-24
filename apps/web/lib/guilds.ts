import { getServiceClient } from "./supabase/service";
import type { GuildRow } from "./types";

/**
 * Explicitly scoped guild list. Even though the service role bypasses RLS, we
 * always join through guild_members for the current user. The user-scoped
 * client is used for reads that should also be protected by RLS.
 */
export async function getManagedGuilds(userId: string): Promise<GuildRow[]> {
  const service = getServiceClient();
  const { data: members, error } = await service
    .from("guild_members")
    .select("guild_id")
    .eq("user_id", userId);
  if (error) throw new Error(`Guild membership lookup failed: ${error.message}`);
  const ids = (members ?? []).map((row) => row.guild_id as string);
  if (ids.length === 0) return [];

  const { data: guilds, error: guildError } = await service
    .from("guilds")
    .select("*")
    .in("id", ids)
    .order("name", { ascending: true });
  if (guildError) throw new Error(`Guild lookup failed: ${guildError.message}`);
  return (guilds ?? []) as GuildRow[];
}

export async function getGuildById(guildId: string): Promise<GuildRow | null> {
  const { data } = await getServiceClient().from("guilds").select("*").eq("id", guildId).maybeSingle();
  return (data as GuildRow | null) ?? null;
}

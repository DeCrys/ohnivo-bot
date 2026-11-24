import type { Client, Guild } from "discord.js";
import { logger } from "./logger.js";
import { supabase } from "./supabase.js";

const stamp = () => new Date().toISOString();

function quoted(ids: string[]): string {
  return ids.map((id) => `"${id}"`).join(",");
}

/**
 * Keeps the cached bot_present flag honest. Discord is the source of truth,
 * but the web app must not need a Discord round trip on every page load.
 */
export async function syncPresence(client: Client): Promise<void> {
  const ids = [...client.guilds.cache.keys()];
  try {
    if (ids.length > 0) {
      const { error } = await supabase
        .from("guilds")
        .update({ bot_present: true, bot_present_checked_at: stamp() })
        .in("id", ids);
      if (error) logger.warn("Presence update (present) failed", error.message);

      const { error: absentError } = await supabase
        .from("guilds")
        .update({ bot_present: false, bot_present_checked_at: stamp() })
        .not("id", "in", `(${quoted(ids)})`);
      if (absentError) logger.warn("Presence update (absent) failed", absentError.message);
    } else {
      const { error } = await supabase
        .from("guilds")
        .update({ bot_present: false, bot_present_checked_at: stamp() });
      if (error) logger.warn("Presence update failed", error.message);
    }
  } catch (error) {
    logger.warn("Presence sync crashed", error);
  }
}

export async function markGuildPresent(guild: Guild): Promise<void> {
  const { error } = await supabase.from("guilds").upsert(
    {
      id: guild.id,
      name: guild.name,
      icon: guild.icon,
      bot_present: true,
      bot_present_checked_at: stamp(),
    },
    { onConflict: "id" },
  );
  if (error) logger.warn("Could not mark guild present", error.message);
}

export async function markGuildAbsent(guildId: string): Promise<void> {
  const { error } = await supabase
    .from("guilds")
    .update({ bot_present: false, bot_present_checked_at: stamp() })
    .eq("id", guildId);
  if (error) logger.warn("Could not mark guild absent", error.message);
}

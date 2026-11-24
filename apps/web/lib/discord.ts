import { buildBotInviteUrl } from "@ohnivo/shared";
import { AppError } from "./errors";
import { appUrl, env } from "./env";
import { getServiceClient } from "./supabase/service";

const DISCORD_API = "https://discord.com/api/v10";
export const MANAGE_GUILD_BIT = 1n << 5n;

export interface DiscordUser {
  id: string;
  username: string;
  global_name: string | null;
  avatar: string | null;
}

export interface DiscordGuild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
}

export interface DiscordTokenResponse {
  accessToken: string;
  refreshToken: string | null;
  expiresIn: number;
}

export function discordLoginUrl(state: string): string {
  const clientId = env.DISCORD_CLIENT_ID;
  if (!clientId) throw new AppError("config_missing", "DISCORD_CLIENT_ID is not configured");
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: `${appUrl()}/api/auth/callback`,
    scope: "identify guilds",
    state,
    prompt: "consent",
  });
  return `https://discord.com/oauth2/authorize?${params.toString()}`;
}

async function tokenRequest(body: URLSearchParams): Promise<DiscordTokenResponse> {
  const response = await fetch(`${DISCORD_API}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new AppError("unauthorized", `Discord token exchange failed (${response.status})`, text);
  }
  const data = (await response.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? null,
    expiresIn: data.expires_in,
  };
}

export async function exchangeCode(code: string): Promise<DiscordTokenResponse> {
  if (!env.DISCORD_CLIENT_ID || !env.DISCORD_CLIENT_SECRET) {
    throw new AppError("config_missing", "Discord OAuth is not configured");
  }
  return tokenRequest(
    new URLSearchParams({
      client_id: env.DISCORD_CLIENT_ID,
      client_secret: env.DISCORD_CLIENT_SECRET,
      grant_type: "authorization_code",
      code,
      redirect_uri: `${appUrl()}/api/auth/callback`,
    }),
  );
}

export async function refreshDiscordToken(refreshToken: string): Promise<DiscordTokenResponse> {
  if (!env.DISCORD_CLIENT_ID || !env.DISCORD_CLIENT_SECRET) {
    throw new AppError("config_missing", "Discord OAuth is not configured");
  }
  return tokenRequest(
    new URLSearchParams({
      client_id: env.DISCORD_CLIENT_ID,
      client_secret: env.DISCORD_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  );
}

async function discordGet<T>(path: string, accessToken: string): Promise<T> {
  const response = await fetch(`${DISCORD_API}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new AppError("unauthorized", `Discord API request failed (${response.status})`);
  }
  return (await response.json()) as T;
}

export async function fetchDiscordUser(accessToken: string): Promise<DiscordUser> {
  const user = await discordGet<{
    id: string;
    username: string;
    global_name?: string | null;
    avatar: string | null;
  }>("/users/@me", accessToken);
  return {
    id: user.id,
    username: user.username,
    global_name: user.global_name ?? null,
    avatar: user.avatar,
  };
}

export async function fetchDiscordGuilds(accessToken: string): Promise<DiscordGuild[]> {
  const guilds: DiscordGuild[] = [];
  let after = "0";
  for (let page = 0; page < 5; page += 1) {
    const batch = await discordGet<DiscordGuild[]>(
      `/users/@me/guilds?limit=200&after=${after}`,
      accessToken,
    );
    guilds.push(...batch);
    if (batch.length < 200) break;
    const last = batch[batch.length - 1];
    if (!last) break;
    after = last.id;
  }
  return guilds;
}

export function canManageGuild(guild: DiscordGuild): boolean {
  if (guild.owner) return true;
  try {
    return (BigInt(guild.permissions) & MANAGE_GUILD_BIT) === MANAGE_GUILD_BIT;
  } catch {
    return false;
  }
}

export function avatarUrl(discordId: string, avatar: string | null, size = 128): string {
  if (!avatar) {
    let index = 0;
    try {
      index = Number(BigInt(discordId) % 5n);
    } catch {
      index = 0;
    }
    return `https://cdn.discordapp.com/embed/avatars/${index}.png`;
  }
  const extension = avatar.startsWith("a_") ? "gif" : "png";
  return `https://cdn.discordapp.com/avatars/${discordId}/${avatar}.${extension}?size=${size}`;
}

export function guildIconUrl(guildId: string, icon: string | null, size = 128): string | null {
  if (!icon) return null;
  const extension = icon.startsWith("a_") ? "gif" : "png";
  return `https://cdn.discordapp.com/icons/${guildId}/${icon}.${extension}?size=${size}`;
}

export function getBotInviteUrl(guildId?: string): string | null {
  if (!env.DISCORD_CLIENT_ID) return null;
  return buildBotInviteUrl(env.DISCORD_CLIENT_ID, guildId);
}

/**
 * Asks Discord whether the bot is a member of the guild. Returns null when
 * the bot token is missing or Discord cannot be reached.
 */
export async function checkBotPresence(guildId: string): Promise<boolean | null> {
  if (!env.DISCORD_BOT_TOKEN) return null;
  try {
    const response = await fetch(`${DISCORD_API}/guilds/${guildId}`, {
      headers: { Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` },
      cache: "no-store",
    });
    if (response.ok) return true;
    if (response.status === 403 || response.status === 404) return false;
    return null;
  } catch (error) {
    console.warn("[discord] presence check failed", error);
    return null;
  }
}

/**
 * Caches the user's manageable guilds in Supabase. This is the only place
 * where guild membership is granted; API routes then verify against it.
 */
export async function syncUserGuilds(userId: string, accessToken: string): Promise<number> {
  const service = getServiceClient();
  const [discordUser, allGuilds] = await Promise.all([
    fetchDiscordUser(accessToken),
    fetchDiscordGuilds(accessToken),
  ]);
  const managed = allGuilds.filter(canManageGuild);

  if (managed.length > 0) {
    const guildRows = managed.map((guild) => ({
      id: guild.id,
      name: guild.name,
      icon: guild.icon,
      ...(guild.owner ? { owner_discord_id: discordUser.id } : {}),
      updated_at: new Date().toISOString(),
    }));
    const { error: guildError } = await service.from("guilds").upsert(guildRows, { onConflict: "id" });
    if (guildError) throw new AppError("unknown", `Guild sync failed: ${guildError.message}`);

    const memberRows = managed.map((guild) => ({
      guild_id: guild.id,
      user_id: userId,
      permissions: guild.permissions,
      is_owner: guild.owner,
      synced_at: new Date().toISOString(),
    }));
    const { error: memberError } = await service
      .from("guild_members")
      .upsert(memberRows, { onConflict: "guild_id,user_id" });
    if (memberError) throw new AppError("unknown", `Membership sync failed: ${memberError.message}`);

    const ids = managed.map((guild) => `"${guild.id}"`).join(",");
    const { error: staleError } = await service
      .from("guild_members")
      .delete()
      .eq("user_id", userId)
      .not("guild_id", "in", `(${ids})`);
    if (staleError) console.warn("[discord] stale membership cleanup failed", staleError.message);
  } else {
    const { error } = await service.from("guild_members").delete().eq("user_id", userId);
    if (error) console.warn("[discord] membership cleanup failed", error.message);
  }

  return managed.length;
}

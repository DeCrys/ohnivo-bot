/**
 * Discord permission catalogue and the whitelist enforced by Ohnivo.
 *
 * The AI is never trusted with permissions outside the whitelist. Anything
 * outside it is silently removed from the blueprint and reported to the user
 * in the preview.
 */

export const DISCORD_PERMISSIONS = {
  CREATE_INSTANT_INVITE: { bit: 1n, discordjs: "CreateInstantInvite" },
  KICK_MEMBERS: { bit: 2n, discordjs: "KickMembers" },
  BAN_MEMBERS: { bit: 4n, discordjs: "BanMembers" },
  ADMINISTRATOR: { bit: 8n, discordjs: "Administrator" },
  MANAGE_CHANNELS: { bit: 16n, discordjs: "ManageChannels" },
  MANAGE_GUILD: { bit: 32n, discordjs: "ManageGuild" },
  ADD_REACTIONS: { bit: 64n, discordjs: "AddReactions" },
  VIEW_AUDIT_LOG: { bit: 128n, discordjs: "ViewAuditLog" },
  PRIORITY_SPEAKER: { bit: 256n, discordjs: "PrioritySpeaker" },
  STREAM: { bit: 512n, discordjs: "Stream" },
  VIEW_CHANNEL: { bit: 1024n, discordjs: "ViewChannel" },
  SEND_MESSAGES: { bit: 2048n, discordjs: "SendMessages" },
  SEND_TTS_MESSAGES: { bit: 4096n, discordjs: "SendTTSMessages" },
  MANAGE_MESSAGES: { bit: 8192n, discordjs: "ManageMessages" },
  EMBED_LINKS: { bit: 16384n, discordjs: "EmbedLinks" },
  ATTACH_FILES: { bit: 32768n, discordjs: "AttachFiles" },
  READ_MESSAGE_HISTORY: { bit: 65536n, discordjs: "ReadMessageHistory" },
  MENTION_EVERYONE: { bit: 131072n, discordjs: "MentionEveryone" },
  USE_EXTERNAL_EMOJIS: { bit: 262144n, discordjs: "UseExternalEmojis" },
  VIEW_GUILD_INSIGHTS: { bit: 524288n, discordjs: "ViewGuildInsights" },
  CONNECT: { bit: 1048576n, discordjs: "Connect" },
  SPEAK: { bit: 2097152n, discordjs: "Speak" },
  MUTE_MEMBERS: { bit: 4194304n, discordjs: "MuteMembers" },
  DEAFEN_MEMBERS: { bit: 8388608n, discordjs: "DeafenMembers" },
  MOVE_MEMBERS: { bit: 16777216n, discordjs: "MoveMembers" },
  USE_VAD: { bit: 33554432n, discordjs: "UseVAD" },
  CHANGE_NICKNAME: { bit: 67108864n, discordjs: "ChangeNickname" },
  MANAGE_NICKNAMES: { bit: 134217728n, discordjs: "ManageNicknames" },
  MANAGE_ROLES: { bit: 268435456n, discordjs: "ManageRoles" },
  MANAGE_WEBHOOKS: { bit: 536870912n, discordjs: "ManageWebhooks" },
  MANAGE_GUILD_EXPRESSIONS: { bit: 1073741824n, discordjs: "ManageGuildExpressions" },
  USE_APPLICATION_COMMANDS: { bit: 2147483648n, discordjs: "UseApplicationCommands" },
  REQUEST_TO_SPEAK: { bit: 4294967296n, discordjs: "RequestToSpeak" },
  MANAGE_EVENTS: { bit: 8589934592n, discordjs: "ManageEvents" },
  MANAGE_THREADS: { bit: 17179869184n, discordjs: "ManageThreads" },
  CREATE_PUBLIC_THREADS: { bit: 34359738368n, discordjs: "CreatePublicThreads" },
  CREATE_PRIVATE_THREADS: { bit: 68719476736n, discordjs: "CreatePrivateThreads" },
  USE_EXTERNAL_STICKERS: { bit: 137438953472n, discordjs: "UseExternalStickers" },
  SEND_MESSAGES_IN_THREADS: { bit: 274877906944n, discordjs: "SendMessagesInThreads" },
  USE_EMBEDDED_ACTIVITIES: { bit: 549755813888n, discordjs: "UseEmbeddedActivities" },
  MODERATE_MEMBERS: { bit: 1099511627776n, discordjs: "ModerateMembers" },
  VIEW_CREATOR_MONETIZATION_ANALYTICS: {
    bit: 2199023255552n,
    discordjs: "ViewCreatorMonetizationAnalytics",
  },
  USE_SOUNDBOARD: { bit: 4398046511104n, discordjs: "UseSoundboard" },
  CREATE_GUILD_EXPRESSIONS: { bit: 8796093022208n, discordjs: "CreateGuildExpressions" },
  CREATE_EVENTS: { bit: 17592186044416n, discordjs: "CreateEvents" },
  SEND_VOICE_MESSAGES: { bit: 35184372088832n, discordjs: "SendVoiceMessages" },
  SEND_POLLS: { bit: 562949953421312n, discordjs: "SendPolls" },
} as const;

export type PermissionKey = keyof typeof DISCORD_PERMISSIONS;

/** Permissions a regular member role may receive. */
export const BASE_ROLE_PERMISSIONS: readonly PermissionKey[] = [
  "VIEW_CHANNEL",
  "SEND_MESSAGES",
  "EMBED_LINKS",
  "ATTACH_FILES",
  "READ_MESSAGE_HISTORY",
  "ADD_REACTIONS",
  "USE_EXTERNAL_EMOJIS",
  "USE_EXTERNAL_STICKERS",
  "USE_APPLICATION_COMMANDS",
  "SEND_MESSAGES_IN_THREADS",
  "CREATE_PUBLIC_THREADS",
  "CREATE_PRIVATE_THREADS",
  "CONNECT",
  "SPEAK",
  "STREAM",
  "USE_VAD",
  "REQUEST_TO_SPEAK",
  "PRIORITY_SPEAKER",
  "CHANGE_NICKNAME",
  "SEND_POLLS",
  "USE_SOUNDBOARD",
  "USE_EMBEDDED_ACTIVITIES",
  "CREATE_INSTANT_INVITE",
  "CREATE_EVENTS",
  "SEND_VOICE_MESSAGES",
];

/** Extra permissions reserved for staff-like roles (moderators, helpers...). */
export const STAFF_EXTRA_PERMISSIONS: readonly PermissionKey[] = [
  "MANAGE_MESSAGES",
  "KICK_MEMBERS",
  "BAN_MEMBERS",
  "MODERATE_MEMBERS",
  "MENTION_EVERYONE",
  "MANAGE_NICKNAMES",
  "MUTE_MEMBERS",
  "DEAFEN_MEMBERS",
  "MOVE_MEMBERS",
  "MANAGE_THREADS",
  "MANAGE_EVENTS",
  "MANAGE_GUILD_EXPRESSIONS",
  "CREATE_GUILD_EXPRESSIONS",
  "VIEW_AUDIT_LOG",
  "VIEW_GUILD_INSIGHTS",
  "VIEW_CREATOR_MONETIZATION_ANALYTICS",
];

/**
 * Never granted by the AI, not even to staff roles. These permissions can
 * effectively take over or destroy the server.
 */
export const HARD_BANNED_PERMISSIONS: readonly PermissionKey[] = [
  "ADMINISTRATOR",
  "MANAGE_GUILD",
  "MANAGE_WEBHOOKS",
];

export const ALLOWED_PERMISSIONS: readonly PermissionKey[] = [
  ...BASE_ROLE_PERMISSIONS,
  ...STAFF_EXTRA_PERMISSIONS,
];

const ALLOWED_SET = new Set<string>(ALLOWED_PERMISSIONS);
const BASE_SET = new Set<string>(BASE_ROLE_PERMISSIONS);
const HARD_BANNED_SET = new Set<string>(HARD_BANNED_PERMISSIONS);

const STAFF_NAME_PATTERN =
  /(staff|admin|moder|moder[áa]tor|veden[íi]|owner|manager|helper|support|t[ýy]m|team|vedouc[íi])/i;

export function isStaffRoleName(name: string): boolean {
  return STAFF_NAME_PATTERN.test(name);
}

const ALIASES: Record<string, PermissionKey> = (() => {
  const map: Record<string, PermissionKey> = {};
  for (const [key, value] of Object.entries(DISCORD_PERMISSIONS)) {
    map[key.replace(/_/g, "")] = key as PermissionKey;
    map[value.discordjs.toUpperCase()] = key as PermissionKey;
  }
  // Czech / human aliases occasionally produced by models.
  map["SPRAVOVATCHANELY"] = "MANAGE_CHANNELS";
  map["POSILATZPRAVY"] = "SEND_MESSAGES";
  map["ZOBRAZITCHANELY"] = "VIEW_CHANNEL";
  map["PRIHRATREAKCE"] = "ADD_REACTIONS";
  return map;
})();

/**
 * Normalises model output such as "View Channel", "viewChannel" or
 * "VIEW_CHANNEL" to a canonical permission key.
 */
export function normalizePermissionName(raw: string): PermissionKey | null {
  const compact = raw
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  if (!compact) return null;
  return ALIASES[compact] ?? null;
}

export interface PermissionVerdict {
  key: PermissionKey | null;
  allowed: boolean;
  reason: "ok" | "unknown" | "hard_banned" | "not_whitelisted" | "staff_only";
}

export function evaluatePermission(raw: string, staffRole: boolean): PermissionVerdict {
  const key = normalizePermissionName(raw);
  if (!key) return { key: null, allowed: false, reason: "unknown" };
  if (HARD_BANNED_SET.has(key)) return { key, allowed: false, reason: "hard_banned" };
  if (!ALLOWED_SET.has(key)) return { key, allowed: false, reason: "not_whitelisted" };
  if (!staffRole && !BASE_SET.has(key)) return { key, allowed: false, reason: "staff_only" };
  return { key, allowed: true, reason: "ok" };
}

export function permissionBits(keys: readonly string[]): bigint {
  let bits = 0n;
  for (const key of keys) {
    const entry = DISCORD_PERMISSIONS[key as PermissionKey];
    if (entry) bits |= entry.bit;
  }
  return bits;
}

export function toDiscordJsPermission(key: string): string | null {
  const entry = DISCORD_PERMISSIONS[key as PermissionKey];
  return entry ? entry.discordjs : null;
}

/** Minimal bot permissions requested on the install link. */
export const BOT_INSTALL_PERMISSIONS = [
  "MANAGE_CHANNELS",
  "MANAGE_ROLES",
  "VIEW_CHANNEL",
  "SEND_MESSAGES",
  "MANAGE_MESSAGES",
] as const;

export function botInstallPermissionBits(): string {
  return permissionBits(BOT_INSTALL_PERMISSIONS).toString();
}

export function buildBotInviteUrl(clientId: string, guildId?: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    scope: "bot applications.commands",
    permissions: botInstallPermissionBits(),
  });
  if (guildId) {
    params.set("guild_id", guildId);
    params.set("disable_guild_select", "true");
  }
  return `https://discord.com/oauth2/authorize?${params.toString()}`;
}

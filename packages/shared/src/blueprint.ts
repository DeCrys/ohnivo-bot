import { z } from "zod";
import { LIMITS } from "./limits.js";
import {
  evaluatePermission,
  isStaffRoleName,
  normalizePermissionName,
  type PermissionKey,
} from "./permissions.js";

export const CHANNEL_TYPES = ["text", "voice", "forum", "announcement"] as const;
export type ChannelType = (typeof CHANNEL_TYPES)[number];

const nameSchema = z.string().max(400).default("");
const shortString = z.string().max(200).default("");

export const permissionOverwriteSchema = z.object({
  role: shortString,
  allow: z.array(shortString).max(80).default([]),
  deny: z.array(shortString).max(80).default([]),
});

export const blueprintChannelSchema = z.object({
  name: nameSchema,
  type: z.enum(CHANNEL_TYPES).default("text"),
  topic: z.string().max(4000).optional().nullable(),
  nsfw: z.boolean().default(false),
  permissionOverwrites: z.array(permissionOverwriteSchema).max(60).default([]),
});

export const blueprintCategorySchema = z.object({
  name: nameSchema,
  emoji: z.string().max(64).optional().nullable(),
  channels: z.array(blueprintChannelSchema).max(120).default([]),
});

export const blueprintRoleSchema = z.object({
  name: nameSchema,
  color: z.string().max(32).default("#99AAB5"),
  hoist: z.boolean().default(false),
  mentionable: z.boolean().default(false),
  permissions: z.array(shortString).max(100).default([]),
});

export const blueprintWelcomeSchema = z.object({
  channel: shortString,
  message: z.string().max(6000).default(""),
});

export const blueprintSchema = z.object({
  serverName: z.string().max(400).default(""),
  categories: z.array(blueprintCategorySchema).max(60).default([]),
  roles: z.array(blueprintRoleSchema).max(200).default([]),
  welcome: blueprintWelcomeSchema.default({ channel: "", message: "" }),
  rules: z.array(z.string().max(2000)).max(60).default([]),
});

export type ServerBlueprint = z.infer<typeof blueprintSchema>;
export type BlueprintCategory = z.infer<typeof blueprintCategorySchema>;
export type BlueprintChannel = z.infer<typeof blueprintChannelSchema>;
export type BlueprintRole = z.infer<typeof blueprintRoleSchema>;
export type PermissionOverwrite = z.infer<typeof permissionOverwriteSchema>;

export type BlueprintIssueCode =
  | "server_name_default"
  | "name_truncated"
  | "invalid_color"
  | "removed_permission"
  | "unknown_permission"
  | "duplicate_role_skipped"
  | "empty_role_skipped"
  | "channel_name_slugified"
  | "too_many_roles"
  | "too_many_categories"
  | "too_many_channels_total"
  | "too_many_channels_in_category"
  | "duplicate_category_renamed"
  | "duplicate_channel_renamed"
  | "empty_channel_name"
  | "topic_removed_for_voice"
  | "topic_truncated"
  | "unknown_role_reference"
  | "welcome_channel_fallback"
  | "welcome_message_default"
  | "rules_trimmed"
  | "rule_too_long";

export interface BlueprintIssue {
  code: BlueprintIssueCode;
  path?: string;
  detail?: string;
}

export interface RemovedPermission {
  role: string;
  permission: string;
}

export interface NormalizedBlueprint {
  blueprint: ServerBlueprint;
  issues: BlueprintIssue[];
  removedPermissions: RemovedPermission[];
}

const CONTROL_CHARS = /[\u0000-\u001f\u007f]/g;

function cleanText(value: string, maxLength: number, fallback = ""): string {
  const text = value
    .replace(CONTROL_CHARS, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return fallback;
  return text.slice(0, maxLength).trim();
}

export function slugifyChannelName(raw: string): string {
  const ascii = raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^[-_]+|[-_]+$/g, "");
  return ascii.slice(0, LIMITS.maxNameLength);
}

export function normalizeBlueprint(raw: unknown): NormalizedBlueprint {
  const parsed = blueprintSchema.parse(raw);
  const issues: BlueprintIssue[] = [];
  const removedPermissions: RemovedPermission[] = [];

  let serverName = cleanText(parsed.serverName, LIMITS.maxServerNameLength);
  if (!serverName) {
    serverName = "Moje komunita";
    issues.push({ code: "server_name_default", path: "serverName" });
  }
  if (parsed.serverName.trim().length > LIMITS.maxNameLength) {
    issues.push({ code: "name_truncated", path: "serverName" });
  }

  // Roles -----------------------------------------------------------------
  const roles: BlueprintRole[] = [];
  const roleNames = new Set<string>();
  for (const [index, rawRole] of parsed.roles.entries()) {
    if (roles.length >= LIMITS.maxRoles) {
      issues.push({ code: "too_many_roles", path: `roles[${index}]` });
      break;
    }
    const name = cleanText(rawRole.name, LIMITS.maxNameLength);
    if (!name || name.toLowerCase() === "@everyone") {
      issues.push({ code: "empty_role_skipped", path: `roles[${index}]`, detail: name });
      continue;
    }
    if (roleNames.has(name.toLowerCase())) {
      issues.push({ code: "duplicate_role_skipped", path: `roles[${index}]`, detail: name });
      continue;
    }
    roleNames.add(name.toLowerCase());

    let color = rawRole.color.trim();
    if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
      if (color && color !== "#99AAB5") {
        issues.push({ code: "invalid_color", path: `roles[${index}].color`, detail: color });
      }
      color = "#99AAB5";
    }

    const staff = isStaffRoleName(name);
    const permissions: PermissionKey[] = [];
    const seen = new Set<string>();
    for (const rawPermission of rawRole.permissions) {
      const verdict = evaluatePermission(rawPermission, staff);
      if (verdict.key && seen.has(verdict.key)) continue;
      if (verdict.allowed && verdict.key) {
        seen.add(verdict.key);
        permissions.push(verdict.key);
      } else {
        if (verdict.reason === "unknown") {
          issues.push({
            code: "unknown_permission",
            path: `roles[${index}].permissions`,
            detail: rawPermission,
          });
        } else {
          issues.push({
            code: "removed_permission",
            path: `roles[${index}].permissions`,
            detail: `${name}:${verdict.key ?? rawPermission}`,
          });
          removedPermissions.push({
            role: name,
            permission: verdict.key ?? rawPermission,
          });
        }
      }
    }

    roles.push({
      name,
      color,
      hoist: Boolean(rawRole.hoist),
      mentionable: Boolean(rawRole.mentionable),
      permissions,
    });
  }

  const roleLookup = new Map<string, BlueprintRole>();
  for (const role of roles) roleLookup.set(role.name.toLowerCase(), role);

  // Categories and channels ------------------------------------------------
  const categories: BlueprintCategory[] = [];
  const categoryNames = new Set<string>();
  const channelNames = new Set<string>();
  let channelCount = 0;

  for (const [catIndex, rawCategory] of parsed.categories.entries()) {
    if (categories.length >= LIMITS.maxCategories) {
      issues.push({ code: "too_many_categories", path: `categories[${catIndex}]` });
      break;
    }
    let categoryName = cleanText(rawCategory.name, LIMITS.maxNameLength);
    if (!categoryName) categoryName = "Ostatní";
    if (categoryNames.has(categoryName.toLowerCase())) {
      let suffix = 2;
      const base = categoryName;
      while (categoryNames.has(`${base} ${suffix}`.toLowerCase())) suffix += 1;
      categoryName = `${base} ${suffix}`;
      issues.push({
        code: "duplicate_category_renamed",
        path: `categories[${catIndex}].name`,
        detail: categoryName,
      });
    }
    categoryNames.add(categoryName.toLowerCase());

    const channels: BlueprintChannel[] = [];
    for (const [channelIndex, rawChannel] of rawCategory.channels.entries()) {
      if (channelCount >= LIMITS.maxChannelsTotal) {
        issues.push({ code: "too_many_channels_total", path: `categories[${catIndex}].channels` });
        break;
      }
      if (channels.length >= LIMITS.maxChannelsPerCategory) {
        issues.push({
          code: "too_many_channels_in_category",
          path: `categories[${catIndex}].channels`,
        });
        break;
      }

      let channelName = slugifyChannelName(rawChannel.name);
      if (!channelName) {
        channelName = `kanal-${channelCount + 1}`;
        issues.push({
          code: "empty_channel_name",
          path: `categories[${catIndex}].channels[${channelIndex}].name`,
        });
      } else if (slugifyChannelName(rawChannel.name) !== rawChannel.name.trim().toLowerCase()) {
        if (rawChannel.name.trim().length <= LIMITS.maxNameLength) {
          issues.push({
            code: "channel_name_slugified",
            path: `categories[${catIndex}].channels[${channelIndex}].name`,
            detail: channelName,
          });
        }
      }
      if (channelNames.has(channelName)) {
        const base = channelName;
        let suffix = 2;
        while (channelNames.has(`${base}-${suffix}`)) suffix += 1;
        channelName = `${base}-${suffix}`;
        issues.push({
          code: "duplicate_channel_renamed",
          path: `categories[${catIndex}].channels[${channelIndex}].name`,
          detail: channelName,
        });
      }
      channelNames.add(channelName);

      const type = rawChannel.type;
      let topic = rawChannel.topic ? cleanText(rawChannel.topic, 4000) : undefined;
      if ((type === "voice") && topic) {
        topic = undefined;
        issues.push({
          code: "topic_removed_for_voice",
          path: `categories[${catIndex}].channels[${channelIndex}].topic`,
        });
      }
      if (topic && topic.length > LIMITS.maxTopicLength) {
        topic = topic.slice(0, LIMITS.maxTopicLength).trim();
        issues.push({
          code: "topic_truncated",
          path: `categories[${catIndex}].channels[${channelIndex}].topic`,
        });
      }

      const overwrites: PermissionOverwrite[] = [];
      for (const rawOverwrite of rawChannel.permissionOverwrites) {
        if (overwrites.length >= LIMITS.maxPermissionOverwritesPerChannel) break;
        const ref = cleanText(rawOverwrite.role, LIMITS.maxNameLength);
        const isEveryone = ref.toLowerCase() === "@everyone";
        const targetRole = isEveryone ? null : roleLookup.get(ref.toLowerCase());
        if (!isEveryone && !targetRole) {
          issues.push({
            code: "unknown_role_reference",
            path: `categories[${catIndex}].channels[${channelIndex}].permissionOverwrites`,
            detail: ref,
          });
          continue;
        }

        const allow = new Set<PermissionKey>();
        const deny = new Set<PermissionKey>();
        const staffTarget = isEveryone ? false : Boolean(targetRole && isStaffRoleName(targetRole.name));

        for (const rawPermission of rawOverwrite.allow) {
          const verdict = evaluatePermission(rawPermission, staffTarget);
          if (verdict.allowed && verdict.key) {
            allow.add(verdict.key);
          } else {
            const key = verdict.key ?? rawPermission;
            issues.push({
              code: "removed_permission",
              path: `categories[${catIndex}].channels[${channelIndex}].permissionOverwrites`,
              detail: `${ref}:${key}`,
            });
            removedPermissions.push({ role: ref || "@everyone", permission: String(key) });
          }
        }
        for (const rawPermission of rawOverwrite.deny) {
          const key = normalizePermissionName(rawPermission);
          if (key) deny.add(key);
          else {
            issues.push({
              code: "unknown_permission",
              path: `categories[${catIndex}].channels[${channelIndex}].permissionOverwrites`,
              detail: rawPermission,
            });
          }
        }

        if (allow.size === 0 && deny.size === 0) continue;
        overwrites.push({
          role: isEveryone ? "@everyone" : (targetRole?.name ?? ref),
          allow: [...allow],
          deny: [...deny],
        });
      }

      channels.push({
        name: channelName,
        type,
        ...(topic ? { topic } : {}),
        nsfw: type === "text" || type === "forum" ? Boolean(rawChannel.nsfw) : false,
        permissionOverwrites: overwrites,
      });
      channelCount += 1;
    }

    categories.push({
      name: categoryName,
      ...(rawCategory.emoji ? { emoji: rawCategory.emoji.slice(0, LIMITS.maxEmojiLength) } : {}),
      channels,
    });
  }

  // Welcome message -------------------------------------------------------
  const allChannels = categories.flatMap((category) =>
    category.channels.map((channel) => ({ ...channel, category: category.name })),
  );
  const textChannels = allChannels.filter(
    (channel) => channel.type === "text" || channel.type === "announcement",
  );
  let welcomeChannel = "";
  const requestedWelcome = slugifyChannelName(parsed.welcome.channel);
  if (requestedWelcome) {
    welcomeChannel = textChannels.find((channel) => channel.name === requestedWelcome)?.name ?? "";
  }
  if (!welcomeChannel && textChannels[0]) {
    welcomeChannel = textChannels[0].name;
    if (parsed.welcome.channel) {
      issues.push({
        code: "welcome_channel_fallback",
        path: "welcome.channel",
        detail: parsed.welcome.channel,
      });
    }
  }

  let welcomeMessage = parsed.welcome.message.replace(CONTROL_CHARS, "").trim();
  if (welcomeMessage.length > LIMITS.maxWelcomeMessageLength) {
    welcomeMessage = welcomeMessage.slice(0, LIMITS.maxWelcomeMessageLength).trim();
    issues.push({ code: "name_truncated", path: "welcome.message" });
  }
  if (!welcomeMessage) {
    issues.push({ code: "welcome_message_default", path: "welcome.message" });
  }

  // Rules -----------------------------------------------------------------
  const rules: string[] = [];
  const seenRules = new Set<string>();
  for (const rawRule of parsed.rules) {
    const rule = cleanText(rawRule, LIMITS.maxRuleLength);
    if (!rule) continue;
    if (seenRules.has(rule.toLowerCase())) continue;
    if (rawRule.length > LIMITS.maxRuleLength) {
      issues.push({ code: "rule_too_long", path: "rules" });
    }
    seenRules.add(rule.toLowerCase());
    rules.push(rule);
    if (rules.length >= LIMITS.maxRules) {
      if (parsed.rules.length > LIMITS.maxRules) {
        issues.push({ code: "rules_trimmed", path: "rules" });
      }
      break;
    }
  }

  return {
    blueprint: {
      serverName,
      categories,
      roles,
      welcome: { channel: welcomeChannel, message: welcomeMessage },
      rules,
    },
    issues,
    removedPermissions,
  };
}

export interface BlueprintStats {
  categories: number;
  textChannels: number;
  voiceChannels: number;
  forumChannels: number;
  announcementChannels: number;
  channels: number;
  roles: number;
  overwrites: number;
  rules: number;
}

export function blueprintStats(blueprint: ServerBlueprint): BlueprintStats {
  const channels = blueprint.categories.flatMap((category) => category.channels);
  return {
    categories: blueprint.categories.length,
    textChannels: channels.filter((channel) => channel.type === "text").length,
    voiceChannels: channels.filter((channel) => channel.type === "voice").length,
    forumChannels: channels.filter((channel) => channel.type === "forum").length,
    announcementChannels: channels.filter((channel) => channel.type === "announcement").length,
    channels: channels.length,
    roles: blueprint.roles.length,
    overwrites: channels.reduce(
      (total, channel) => total + channel.permissionOverwrites.length,
      0,
    ),
    rules: blueprint.rules.length,
  };
}

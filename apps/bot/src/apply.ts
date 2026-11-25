import {
  ALLOWED_PERMISSIONS,
  buildApplyPlan,
  buildBotInviteUrl,
  buildWelcomeMessage,
  normalizePermissionName,
  permissionBits,
  STAFF_EXTRA_PERMISSIONS,
  toDiscordJsPermission,
  withEmojiPrefix,
  type ApplyPlanStep,
  type BlueprintChannel,
  type ServerBlueprint,
} from "@ohnivo/shared";
import {
  ChannelType,
  PermissionFlagsBits,
  type Client,
  type Guild,
  type GuildBasedChannel,
  type NonThreadGuildBasedChannel,
  type Role,
} from "discord.js";
import { logger } from "./logger.js";
import {
  audit,
  getUserLocale,
  loadJobObjects,
  notifyUser,
  recordObject,
  recordJobObjects,
  refundJob,
  setBlueprintStatus,
  updateJob,
  type ClaimedJob,
  type JobObject,
} from "./queue.js";
import { withDiscordRetry } from "./retry.js";

const REASON = "Ohnivo apply";
const ALLOWED = new Set<string>(ALLOWED_PERMISSIONS);
const STAFF_ONLY = new Set<string>(STAFF_EXTRA_PERMISSIONS);

/** Permissions without which no build can run at all. */
const REQUIRED_BOT_PERMISSIONS: ReadonlyArray<{ cs: string; en: string; flag: bigint }> = [
  { cs: "Spravovat kanály", en: "Manage Channels", flag: PermissionFlagsBits.ManageChannels },
  { cs: "Spravovat role", en: "Manage Roles", flag: PermissionFlagsBits.ManageRoles },
];

interface ApplyContext {
  guild: Guild;
  blueprint: ServerBlueprint;
  mode: ClaimedJob["mode"];
  objects: Map<string, JobObject>;
  locale: "cs" | "en";
  destructivePhaseStarted: boolean;
  omittedStaffPermissions: Set<string>;
}

interface StepOutcome {
  status: "done" | "skipped" | "warning";
  discordId?: string;
  error?: string;
  objectKind?: string;
  objectKey?: string;
  reused?: boolean;
  omittedPermissions?: string[];
}

function errorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return String(error);
}

function discordChannelType(type: BlueprintChannel["type"]): ChannelType {
  if (type === "voice") return ChannelType.GuildVoice;
  if (type === "forum") return ChannelType.GuildForum;
  if (type === "announcement") return ChannelType.GuildAnnouncement;
  return ChannelType.GuildText;
}

function channelTypeMatches(channel: GuildBasedChannel, type: BlueprintChannel["type"]): boolean {
  if (type === "voice") return channel.type === ChannelType.GuildVoice;
  if (type === "forum") return channel.type === ChannelType.GuildForum;
  if (type === "announcement") {
    return (
      channel.type === ChannelType.GuildAnnouncement || channel.type === ChannelType.GuildText
    );
  }
  return channel.type === ChannelType.GuildText;
}

async function findRoleByObject(
  guild: Guild,
  objects: Map<string, JobObject>,
  roleKey: string,
  roleName: string,
): Promise<Role | null> {
  const stored = objects.get(roleKey);
  if (stored) {
    const role = await guild.roles.fetch(stored.discordId).catch(() => null);
    if (role) return role;
  }
  return guild.roles.cache.find((role) => role.name.toLowerCase() === roleName.toLowerCase()) ?? null;
}

async function executeRole(context: ApplyContext, step: ApplyPlanStep): Promise<StepOutcome> {
  const role = context.blueprint.roles[step.roleIndex ?? -1];
  if (!role) throw new Error(`Missing role for step ${step.key}`);

  const stored = context.objects.get(step.key);
  if (stored) {
    const existing = await context.guild.roles.fetch(stored.discordId).catch(() => null);
    if (existing) {
      return {
        status: stored.reused ? "skipped" : "done",
        discordId: existing.id,
      };
    }
  }

  if (context.mode === "merge") {
    const existing = context.guild.roles.cache.find(
      (candidate) => candidate.name.toLowerCase() === role.name.toLowerCase(),
    );
    if (existing) {
      return {
        status: "skipped",
        discordId: existing.id,
        objectKind: "role",
        objectKey: step.key,
        reused: true,
      };
    }
  }

  const botMember = context.guild.members.me ?? (await context.guild.members.fetchMe());
  const removedPermissions: string[] = [];
  const permissions = role.permissions.filter((raw) => {
    const key = normalizePermissionName(raw);
    if (!key || !STAFF_ONLY.has(key)) return true;
    // PermissionsBitField#has() honours ADMINISTRATOR, unlike a raw bitfield
    // comparison. A bot with Administrator can grant everything.
    const requiredBits = permissionBits([key]);
    if (requiredBits !== 0n && botMember.permissions.has(requiredBits)) return true;
    removedPermissions.push(key);
    return false;
  });
  if (removedPermissions.length > 0) {
    for (const key of removedPermissions) context.omittedStaffPermissions.add(key);
  }

  const created = await withDiscordRetry(`create role ${role.name}`, () =>
    context.guild.roles.create({
      name: role.name,
      colors: { primaryColor: role.color as `#${string}` },
      hoist: role.hoist,
      mentionable: role.mentionable,
      permissions: permissionBits(permissions),
      reason: REASON,
    }),
  );
  return {
    status: removedPermissions.length > 0 ? "warning" : "done",
    error:
      removedPermissions.length > 0
        ? context.locale === "en"
          ? `Skipped staff permissions the bot does not have: ${removedPermissions.join(", ")}. Grant them to the bot and retry to keep them.`
          : `Vynechána oprávnění staff role, která bot nemá: ${removedPermissions.join(", ")}. Pokud je chceš zachovat, povol je botovi a spusť stavbu znovu.`
        : undefined,
    omittedPermissions: removedPermissions.length > 0 ? removedPermissions : undefined,
    discordId: created.id,
    objectKind: "role",
    objectKey: step.key,
    reused: false,
  };
}

async function executeCategory(context: ApplyContext, step: ApplyPlanStep): Promise<StepOutcome> {
  const category = context.blueprint.categories[step.categoryIndex ?? -1];
  if (!category) throw new Error(`Missing category for step ${step.key}`);
  const displayName = withEmojiPrefix(category.name, category.emoji, " ");

  const stored = context.objects.get(step.key);
  if (stored) {
    const existing = await context.guild.channels.fetch(stored.discordId).catch(() => null);
    if (existing) {
      return { status: stored.reused ? "skipped" : "done", discordId: existing.id };
    }
  }

  if (context.mode === "merge") {
    const existing = context.guild.channels.cache.find(
      (channel) =>
        channel.type === ChannelType.GuildCategory &&
        [displayName, category.name].some(
          (name) => channel.name.toLowerCase() === name.toLowerCase(),
        ),
    );
    if (existing) {
      return {
        status: "skipped",
        discordId: existing.id,
        objectKind: "category",
        objectKey: step.key,
        reused: true,
      };
    }
  }

  const created = await withDiscordRetry(`create category ${category.name}`, () =>
    context.guild.channels.create({
      name: displayName,
      type: ChannelType.GuildCategory,
      reason: REASON,
    }),
  );
  return {
    status: "done",
    discordId: created.id,
    objectKind: "category",
    objectKey: step.key,
    reused: false,
  };
}

async function executeChannel(context: ApplyContext, step: ApplyPlanStep): Promise<StepOutcome> {
  const category = context.blueprint.categories[step.categoryIndex ?? -1];
  const channel = category?.channels[step.channelIndex ?? -1];
  if (!category || !channel) throw new Error(`Missing channel for step ${step.key}`);
  const displayName = withEmojiPrefix(channel.name, channel.emoji, "│");

  const parentId = step.categoryKey
    ? context.objects.get(step.categoryKey)?.discordId
    : undefined;

  const stored = context.objects.get(step.key);
  if (stored) {
    const existing = await context.guild.channels.fetch(stored.discordId).catch(() => null);
    if (existing) {
      return { status: stored.reused ? "skipped" : "done", discordId: existing.id };
    }
  }

  if (context.mode === "merge") {
    const existing = context.guild.channels.cache.find(
      (candidate) =>
        [displayName, channel.name].some(
          (name) => candidate.name.toLowerCase() === name.toLowerCase(),
        ) &&
        channelTypeMatches(candidate, channel.type) &&
        (!parentId || candidate.parentId === parentId),
    );
    if (existing) {
      return {
        status: "skipped",
        discordId: existing.id,
        objectKind: "channel",
        objectKey: step.key,
        reused: true,
      };
    }
  }

  const mapped = discordChannelType(channel.type);
  const options: Record<string, unknown> = {
    name: displayName,
    type: mapped,
    parent: parentId,
    reason: REASON,
  };
  if (channel.topic && channel.type !== "voice") options.topic = channel.topic;
  if (channel.nsfw && (mapped === ChannelType.GuildText || mapped === ChannelType.GuildForum)) {
    options.nsfw = true;
  }

  let usedAnnouncementFallback = false;
  const created = await withDiscordRetry<GuildBasedChannel>(
    `create channel ${channel.name}`,
    async () => {
      try {
        return (await context.guild.channels.create(options as never)) as GuildBasedChannel;
      } catch (error) {
        if (mapped === ChannelType.GuildAnnouncement) {
          usedAnnouncementFallback = true;
          return (await context.guild.channels.create({
            ...options,
            type: ChannelType.GuildText,
          } as never)) as GuildBasedChannel;
        }
        throw error;
      }
    },
  );

  if (!created) throw new Error(`Channel ${channel.name} was not created`);
  return {
    status: usedAnnouncementFallback ? "warning" : "done",
    error: usedAnnouncementFallback
      ? context.locale === "en"
        ? "This server is not a Community server, so the announcement channel was created as a text channel."
        : "Tento server není komunitní, proto byl kanál oznámení vytvořen jako textový kanál."
      : undefined,
    discordId: created.id,
    objectKind: "channel",
    objectKey: step.key,
    reused: false,
  };
}

async function executeOverwrites(
  context: ApplyContext,
  step: ApplyPlanStep,
): Promise<StepOutcome> {
  const blueprintChannel =
    context.blueprint.categories[step.categoryIndex ?? -1]?.channels[step.channelIndex ?? -1];
  if (!blueprintChannel) throw new Error(`Missing channel for overwrites ${step.key}`);

  const stored = step.channelKey ? context.objects.get(step.channelKey) : undefined;
  if (!stored) throw new Error(`Channel for overwrites is not ready (${step.key})`);
  const channel = await withDiscordRetry(`fetch channel ${stored.discordId}`, () =>
    context.guild.channels.fetch(stored.discordId),
  );
  if (!channel) throw new Error(`Channel not found for overwrites (${step.key})`);
  if (!("permissionOverwrites" in channel)) {
    return { status: "skipped" };
  }

  let missingRoles = 0;
  for (const overwrite of blueprintChannel.permissionOverwrites) {
    let target: Role;
    if (overwrite.role.toLowerCase() === "@everyone") {
      target = context.guild.roles.everyone;
    } else {
      const roleIndex = context.blueprint.roles.findIndex(
        (role) => role.name.toLowerCase() === overwrite.role.toLowerCase(),
      );
      const role =
        roleIndex >= 0
          ? await findRoleByObject(context.guild, context.objects, `role:${roleIndex}`, overwrite.role)
          : context.guild.roles.cache.find(
              (candidate) => candidate.name.toLowerCase() === overwrite.role.toLowerCase(),
            ) ?? null;
      if (!role) {
        missingRoles += 1;
        continue;
      }
      target = role;
    }

    const options: Record<string, boolean> = {};
    for (const raw of overwrite.allow) {
      const key = normalizePermissionName(raw);
      if (!key || !ALLOWED.has(key)) continue;
      const discord = toDiscordJsPermission(key);
      if (discord) options[discord] = true;
    }
    for (const raw of overwrite.deny) {
      const key = normalizePermissionName(raw);
      if (!key) continue;
      const discord = toDiscordJsPermission(key);
      if (discord) options[discord] = false;
    }
    if (Object.keys(options).length === 0) continue;

    await withDiscordRetry(`set overwrites on ${stored.discordId}`, () =>
      channel.permissionOverwrites.edit(target, options),
    );
  }

  return missingRoles > 0
    ? {
        status: "warning",
        error:
          context.locale === "en"
            ? `${missingRoles} permission overwrite target(s) could not be found.`
            : `Nepodařilo se najít ${missingRoles} cílových rolí pro přepsání oprávnění.`,
      }
    : { status: "done" };
}

async function executeWelcome(
  context: ApplyContext,
  step: ApplyPlanStep,
): Promise<StepOutcome> {
  const storedMessage = context.objects.get("message:welcome");
  if (storedMessage) return { status: "skipped", discordId: storedMessage.discordId };

  const storedChannel = step.channelKey ? context.objects.get(step.channelKey) : undefined;
  if (!storedChannel) throw new Error("Welcome channel is not ready");

  const channel = await withDiscordRetry(`fetch welcome channel ${storedChannel.discordId}`, () =>
    context.guild.channels.fetch(storedChannel.discordId),
  );
  if (!channel || !channel.isTextBased()) throw new Error("Welcome channel is not text based");

  const message = buildWelcomeMessage(context.locale, {
    serverName: context.blueprint.serverName,
    ownerDiscordId: context.guild.ownerId,
    rules: context.blueprint.rules,
    blueprint: context.blueprint,
  });
  const sent = await withDiscordRetry("send welcome message", () => channel.send(message));
  return {
    status: "done",
    discordId: sent.id,
    objectKind: "message",
    objectKey: "message:welcome",
    reused: false,
  };
}

interface ReplacementTargets {
  channelsToDelete: NonThreadGuildBasedChannel[];
  rolesToDelete: Role[];
  blockers: string[];
}

function joinNames(names: string[], max = 5): string {
  const shown = names.slice(0, max).join(", ");
  return names.length > max ? `${shown}, …` : shown;
}

/**
 * Collects everything replace mode would delete and the reasons Discord may
 * refuse. Used both as a preflight (before anything is created) and right
 * before the destructive phase.
 */
async function collectReplacementTargets(context: ApplyContext): Promise<ReplacementTargets> {
  const snapshotChannels = [...context.objects.values()].filter(
    (object) => object.kind === "cleanup_channel",
  );
  const snapshotRoles = [...context.objects.values()].filter(
    (object) => object.kind === "cleanup_role",
  );
  const createdIds = new Set(
    [...context.objects.values()]
      .filter(
        (object) =>
          !object.reused &&
          (object.kind === "role" || object.kind === "category" || object.kind === "channel"),
      )
      .map((object) => object.discordId),
  );

  const [channels, roles, botMember] = await Promise.all([
    context.guild.channels.fetch(),
    context.guild.roles.fetch(),
    context.guild.members.me
      ? Promise.resolve(context.guild.members.me)
      : context.guild.members.fetchMe(),
  ]);
  const channelsToDelete = snapshotChannels
    .map((object) => channels.get(object.discordId))
    .filter((channel): channel is NonThreadGuildBasedChannel => Boolean(channel))
    .filter((channel) => !createdIds.has(channel.id))
    .sort((left, right) => {
      const leftCategory = left.type === ChannelType.GuildCategory ? 1 : 0;
      const rightCategory = right.type === ChannelType.GuildCategory ? 1 : 0;
      return leftCategory - rightCategory;
    });

  const snapshotRoleIds = new Set(snapshotRoles.map((object) => object.discordId));
  const rolesToDelete = [...snapshotRoleIds]
    .map((id) => roles.get(id))
    .filter((role): role is Role => Boolean(role))
    .filter((role) => role.id !== context.guild.id && !role.managed && !createdIds.has(role.id));
  const inaccessibleChannels = channelsToDelete.filter(
    (channel) => !botMember.permissionsIn(channel).has(PermissionFlagsBits.ManageChannels),
  );
  const rolesAboveBot = rolesToDelete.filter(
    (role) => role.comparePositionTo(botMember.roles.highest) >= 0,
  );
  const missingManageRoles =
    rolesToDelete.length > 0 && !botMember.permissions.has(PermissionFlagsBits.ManageRoles);

  const blockers = [
    ...(inaccessibleChannels.length > 0
      ? [
          context.locale === "en"
            ? `${inaccessibleChannels.length} channels deny Manage Channels (${joinNames(
                inaccessibleChannels.map((channel) => channel.name),
              )})`
            : `${inaccessibleChannels.length} kanálů nepovoluje oprávnění Spravovat kanály (${joinNames(
                inaccessibleChannels.map((channel) => channel.name),
              )})`,
        ]
      : []),
    ...(missingManageRoles
      ? [
          context.locale === "en"
            ? "the bot is missing Manage Roles"
            : "botovi chybí oprávnění Spravovat role",
        ]
      : []),
    ...(rolesAboveBot.length > 0
      ? [
          context.locale === "en"
            ? `${rolesAboveBot.length} roles are at or above the bot's highest role (${joinNames(
                rolesAboveBot.map((role) => role.name),
              )})`
            : `${rolesAboveBot.length} rolí je na stejné nebo vyšší pozici než nejvyšší role bota (${joinNames(
                rolesAboveBot.map((role) => role.name),
              )})`,
        ]
      : []),
  ];

  return { channelsToDelete, rolesToDelete, blockers };
}

function replacementBlockerMessage(locale: "cs" | "en", blockers: string[]): string {
  return locale === "en"
    ? `Replacement stopped before deleting anything: ${blockers.join("; ")}. In Discord open Server Settings → Roles and drag the Ohnivo role above the listed roles, then retry. Administrator does not bypass role hierarchy.`
    : `Nahrazení bylo zastaveno před smazáním: ${blockers.join("; ")}. V Discordu otevři Nastavení serveru → Role a přetáhni roli Ohnivo nad uvedené role, potom akci spusť znovu. Administrator hierarchii rolí neobejde.`;
}

async function executeCleanup(context: ApplyContext): Promise<StepOutcome> {
  const omittedPermissions = [...context.omittedStaffPermissions];

  const { channelsToDelete, rolesToDelete, blockers } = await collectReplacementTargets(context);
  if (blockers.length > 0) {
    throw new Error(replacementBlockerMessage(context.locale, blockers));
  }

  let deletedChannels = 0;
  let deletedRoles = 0;
  let failedChannels = 0;
  let failedRoles = 0;
  const failedChannelNames: string[] = [];
  const failedRoleNames: string[] = [];
  if (channelsToDelete.length > 0 || rolesToDelete.length > 0) {
    context.destructivePhaseStarted = true;
  }

  for (const channel of channelsToDelete) {
    try {
      await withDiscordRetry<void>(`delete existing channel ${channel.id}`, async () => {
        await channel.delete(REASON);
      });
      deletedChannels += 1;
    } catch (error) {
      failedChannels += 1;
      failedChannelNames.push(channel.name);
      logger.warn("Could not delete an existing channel during replacement", {
        channelId: channel.id,
        error: errorMessage(error),
      });
    }
  }

  for (const role of rolesToDelete) {
    try {
      await withDiscordRetry(`delete existing role ${role.id}`, () => role.delete(REASON));
      deletedRoles += 1;
    } catch (error) {
      failedRoles += 1;
      failedRoleNames.push(role.name);
      logger.warn("Could not delete an existing role during replacement", {
        roleId: role.id,
        error: errorMessage(error),
      });
    }
  }

  if (failedChannels > 0 || failedRoles > 0) {
    const failedNames = [...failedChannelNames, ...failedRoleNames].slice(0, 5).join(", ");
    throw new Error(
      context.locale === "en"
        ? `Old structure cleanup was incomplete: removed ${deletedChannels} channels and ${deletedRoles} roles, but ${failedChannels} channels and ${failedRoles} roles could not be deleted${failedNames ? ` (${failedNames})` : ""}. The new structure was kept; finish cleanup manually.`
        : `Úklid původní struktury není úplný: smazáno kanálů ${deletedChannels} a rolí ${deletedRoles}, ale nešlo smazat ${failedChannels} kanálů a ${failedRoles} rolí${failedNames ? ` (${failedNames})` : ""}. Nová struktura zůstala zachována; zbytek odstraň ručně.`,
    );
  }

  const details =
    context.locale === "en"
      ? `Removed ${deletedChannels} existing channels and ${deletedRoles} roles.`
      : `Odstraněno původních kanálů: ${deletedChannels}, rolí: ${deletedRoles}.`;

  if (omittedPermissions.length > 0) {
    return {
      status: "warning",
      error:
        context.locale === "en"
          ? `${details} These staff permissions could not be granted because the bot lacks them, so they were skipped: ${omittedPermissions.join(", ")}. Re-invite the bot with the required permissions (or Administrator) and add them to the roles manually.`
          : `${details} Tato oprávnění staff rolím nešla přidělit, protože je bot sám nemá, a proto byla vynechána: ${omittedPermissions.join(", ")}. Pozvi bota znovu s potřebnými oprávněními (nebo Administratora) a doplň je rolím ručně.`,
    };
  }

  return {
    status: "done",
    error: details,
  };
}

async function executeStep(context: ApplyContext, step: ApplyPlanStep): Promise<StepOutcome> {
  switch (step.kind) {
    case "role":
      return executeRole(context, step);
    case "category":
      return executeCategory(context, step);
    case "channel":
      return executeChannel(context, step);
    case "overwrite":
      return executeOverwrites(context, step);
    case "welcome":
      return executeWelcome(context, step);
    case "cleanup":
      return executeCleanup(context);
    default:
      return { status: "skipped" };
  }
}

async function rollbackCreatedObjects(
  guild: Guild,
  objects: Map<string, JobObject>,
): Promise<number> {
  const created = [...objects.values()].filter(
    (object) =>
      !object.reused && (object.kind === "role" || object.kind === "channel" || object.kind === "category"),
  );
  let failures = 0;
  for (const object of created.reverse()) {
    try {
      if (object.kind === "role") {
        const role = await guild.roles.fetch(object.discordId).catch(() => null);
        if (role) {
          await withDiscordRetry(`rollback role ${object.objectKey}`, () => role.delete(REASON));
        }
      } else {
        const channel = await guild.channels.fetch(object.discordId).catch(() => null);
        if (channel) {
          await withDiscordRetry(`rollback ${object.kind} ${object.objectKey}`, () =>
            (channel as { delete: (reason?: string) => Promise<unknown> }).delete(REASON),
          );
        }
      }
    } catch (error) {
      failures += 1;
      logger.warn("Rollback failed for object", {
        key: object.objectKey,
        error: errorMessage(error),
      });
    }
  }
  return failures;
}

async function snapshotReplacementTargets(
  guild: Guild,
  jobId: string,
  objects: Map<string, JobObject>,
): Promise<void> {
  if (objects.has("cleanup:snapshot:complete")) return;

  const [channels, roles] = await Promise.all([guild.channels.fetch(), guild.roles.fetch()]);
  const snapshot: JobObject[] = [
    ...[...channels.values()]
      .filter((channel): channel is NonThreadGuildBasedChannel => Boolean(channel))
      .map((channel) => ({
        objectKey: `cleanup:channel:${channel.id}`,
        kind: "cleanup_channel",
        discordId: channel.id,
        reused: true,
      })),
    ...[...roles.values()].map((role) => ({
      objectKey: `cleanup:role:${role.id}`,
      kind: "cleanup_role",
      discordId: role.id,
      reused: true,
    })),
    {
      objectKey: "cleanup:snapshot:complete",
      kind: "cleanup_snapshot",
      discordId: "complete",
      reused: true,
    },
  ];

  await recordJobObjects(jobId, snapshot);
  for (const object of snapshot) objects.set(object.objectKey, object);
}

/**
 * Executes one claimed job end to end. The blueprint snapshot is immutable,
 * completed steps are skipped on resume, and only objects created by this job
 * are ever removed during rollback.
 */
export async function runJob(client: Client, job: ClaimedJob): Promise<void> {
  logger.info(`Running job ${job.id} for guild ${job.guild_id}`, {
    mode: job.mode,
    attempt: job.attempts,
  });

  const guild = await client.guilds.fetch(job.guild_id).catch(() => null);
  const locale = await getUserLocale(job.user_id);
  const now = new Date().toISOString();

  if (!guild) {
    await updateJob(job.id, {
      status: "failed",
      error: "guild_missing",
      finished_at: now,
    });
    await setBlueprintStatus(job.blueprint_id, "draft");
    const refunded = await refundJob(job, "guild_missing");
    await notifyUser(job.user_id, {
      type: "apply_failed",
      title: locale === "en" ? "Build failed" : "Stavba selhala",
      body:
        locale === "en"
          ? `The bot is no longer on the server, so the build could not start. ${refunded ? "Credits were refunded." : "The credit refund failed; contact support and provide the build ID."}`
          : `Bot už na serveru není, stavbu proto nešlo spustit. ${refunded ? "Kredity byly vráceny." : "Vrácení kreditů se nepodařilo; kontaktuj podporu a uveď ID stavby."}`,
      href: `/dashboard/${job.guild_id}`,
    });
    return;
  }

  const me = guild.members.me ?? (await guild.members.fetchMe());
  const missingPermissions = REQUIRED_BOT_PERMISSIONS.filter(
    (permission) => !me.permissions.has(permission.flag),
  );
  if (missingPermissions.length > 0) {
    const names = missingPermissions.map((permission) =>
      locale === "en" ? permission.en : permission.cs,
    );
    const inviteUrl = client.user ? buildBotInviteUrl(client.user.id, guild.id) : null;
    const message =
      locale === "en"
        ? `The bot is missing these permissions on the server: ${names.join(", ")}.${
            inviteUrl
              ? ` Re-invite it here: ${inviteUrl}`
              : " Re-invite it with the required permissions."
          }`
        : `Botovi na serveru chybí tato oprávnění: ${names.join(", ")}.${
            inviteUrl
              ? ` Pozvi ho znovu tady: ${inviteUrl}`
              : " Pozvi ho znovu s potřebnými oprávněními."
          }`;
    logger.warn(`Job ${job.id} blocked: bot permissions missing`, names.join(", "));
    await updateJob(job.id, {
      status: "failed",
      error: message.slice(0, 1000),
      finished_at: now,
    });
    await setBlueprintStatus(job.blueprint_id, "draft");
    const refunded = await refundJob(job, "bot_permissions");
    await notifyUser(job.user_id, {
      type: "apply_failed",
      title: locale === "en" ? "Build failed" : "Stavba selhala",
      body: `${message} ${
        locale === "en"
          ? refunded
            ? "Credits were refunded."
            : "The credit refund failed; contact support and provide the build ID."
          : refunded
            ? "Kredity byly vráceny."
            : "Vrácení kreditů se nepodařilo; kontaktuj podporu a uveď ID stavby."
      }`,
      href: `/dashboard/${job.guild_id}/apply/${job.id}`,
    });
    await audit({
      actorUserId: job.user_id,
      guildId: job.guild_id,
      jobId: job.id,
      action: "apply.failed",
      meta: { reason: "bot_permissions", missing: names },
    });
    return;
  }

  const plan = buildApplyPlan(job.blueprint_snapshot, { mode: job.mode });
  const objects = await loadJobObjects(job.id);
  const existingProgress = new Map(
    (Array.isArray(job.progress) ? job.progress : []).map((entry) => [entry.key, entry]),
  );
  const progress = plan.steps.map((step) => {
    const stored = existingProgress.get(step.key);
    return stored ?? { key: step.key, kind: step.kind, label: step.label, status: "pending" as const };
  });
  if (
    job.mode === "replace" &&
    !objects.has("cleanup:snapshot:complete") &&
    progress.some((entry) => entry.status !== "pending")
  ) {
    throw new Error(
      `Cannot safely resume replacement job ${job.id}: the original structure snapshot is missing`,
    );
  }

  const context: ApplyContext = {
    guild,
    blueprint: job.blueprint_snapshot,
    mode: job.mode,
    objects,
    locale,
    destructivePhaseStarted: false,
    omittedStaffPermissions: new Set(
      progress.flatMap((entry) => entry.omittedPermissions ?? []),
    ),
  };

  const persist = async () => {
    await updateJob(job.id, { progress, status: "running" });
  };

  try {
    if (context.mode === "replace") {
      await snapshotReplacementTargets(guild, job.id, objects);
      // Fail before creating anything when Discord would refuse the cleanup.
      const preflight = await collectReplacementTargets(context);
      if (preflight.blockers.length > 0) {
        throw new Error(replacementBlockerMessage(locale, preflight.blockers));
      }
    }
    await persist();
    for (let index = 0; index < plan.steps.length; index += 1) {
      const step = plan.steps[index];
      const entry = progress[index];
      if (!step || !entry) continue;
      if (entry.status === "done" || entry.status === "skipped" || entry.status === "warning") {
        continue;
      }

      entry.status = "running";
      await persist();

      try {
        const outcome = await executeStep(context, step);
        entry.status = outcome.status;
        if (outcome.discordId) entry.discordId = outcome.discordId;
        if (outcome.error) entry.error = outcome.error;
        if (outcome.omittedPermissions) {
          entry.omittedPermissions = outcome.omittedPermissions;
        }

        if (outcome.objectKey && outcome.discordId) {
          const object: JobObject = {
            objectKey: outcome.objectKey,
            kind: outcome.objectKind ?? step.kind,
            discordId: outcome.discordId,
            reused: Boolean(outcome.reused),
          };
          objects.set(object.objectKey, object);
          await recordObject(job.id, object);
        }
      } catch (error) {
        entry.status = "failed";
        entry.error = errorMessage(error).slice(0, 500);
        await persist();
        throw error;
      }

      await persist();
    }

    await updateJob(job.id, {
      status: "completed",
      progress,
      error: null,
      finished_at: new Date().toISOString(),
    });
    await setBlueprintStatus(job.blueprint_id, "applied");
    const omittedStaffPermissions = [
      ...new Set(progress.flatMap((entry) => entry.omittedPermissions ?? [])),
    ];
    const completedBody =
      locale === "en"
        ? `The build on ${guild.name} finished. Open Discord and get started.`
        : `Stavba na serveru ${guild.name} doběhla. Otevři Discord a rozjeď to.`;
    await notifyUser(job.user_id, {
      type: "apply_completed",
      title: locale === "en" ? "Your server is ready" : "Server je hotový",
      body:
        omittedStaffPermissions.length > 0
          ? `${completedBody} ${
              locale === "en"
                ? `These staff permissions were skipped because the bot lacks them: ${omittedStaffPermissions.join(", ")}. Re-invite the bot with them and add them to the roles manually.`
                : `Tato oprávnění staff rolím chybí, protože je bot sám nemá: ${omittedStaffPermissions.join(", ")}. Pozvi bota znovu s nimi a doplň je rolím ručně.`
            }`
          : completedBody,
      href: `/dashboard/${job.guild_id}/apply/${job.id}`,
    });
    await audit({
      actorUserId: job.user_id,
      guildId: job.guild_id,
      jobId: job.id,
      action: "apply.completed",
      meta: {
        steps: plan.steps.length,
        mode: job.mode,
        replacementSummary: progress.find((entry) => entry.kind === "cleanup")?.error ?? null,
      },
    });
    logger.info(`Job ${job.id} completed`);
  } catch (error) {
    const message = errorMessage(error).slice(0, 1000);
    logger.error(`Job ${job.id} failed`, message);
    const rollbackFailures = context.destructivePhaseStarted
      ? 0
      : await rollbackCreatedObjects(guild, objects);
    const status = context.destructivePhaseStarted
      ? "failed"
      : [...objects.values()].some((object) => !object.reused)
        ? rollbackFailures > 0
          ? "failed"
          : "rolled_back"
        : "failed";
    const refunded = context.destructivePhaseStarted
      ? false
      : await refundJob(job, "apply_failed");

    await updateJob(job.id, {
      status,
      progress,
      error: rollbackFailures > 0 ? `${message} (rollback failures: ${rollbackFailures})` : message,
      finished_at: new Date().toISOString(),
    });
    if (!context.destructivePhaseStarted) {
      await setBlueprintStatus(job.blueprint_id, "draft");
    } else {
      await setBlueprintStatus(job.blueprint_id, "applied");
    }
    await notifyUser(job.user_id, {
      type: "apply_failed",
      title: locale === "en" ? "Build failed" : "Stavba selhala",
      body: context.destructivePhaseStarted
        ? locale === "en"
          ? `The new structure on ${guild.name} was created, but removing the old structure did not finish. The new objects were kept; review the server and finish cleanup manually. No automatic credit refund was issued because cleanup had started.`
          : `Nová struktura na serveru ${guild.name} vznikla, ale úklid původní struktury se nedokončil. Nové objekty zůstaly; zkontroluj server a dokonči úklid ručně. Kredity se automaticky nevrátily, protože úklid už začal.`
        : locale === "en"
          ? `The build on ${guild.name} failed. ${
              refunded
                ? "Credits were refunded and created objects were rolled back."
                : "Created objects were rolled back where possible, but the credit refund failed. Contact support and provide the build ID."
            } Reason: ${message}`
          : `Stavba na serveru ${guild.name} selhala. ${
              refunded
                ? "Kredity jsme vrátili a vytvořené objekty uklidili."
                : "Vytvořené objekty jsme uklidili, kde to šlo, ale vrácení kreditů se nepodařilo. Kontaktuj podporu a uveď ID stavby."
            } Důvod: ${message}`,
      href: `/dashboard/${job.guild_id}/apply/${job.id}`,
    });
    await audit({
      actorUserId: job.user_id,
      guildId: job.guild_id,
      jobId: job.id,
      action: "apply.failed",
      meta: {
        error: message,
        rollbackFailures,
        status,
        destructivePhaseStarted: context.destructivePhaseStarted,
        refunded,
      },
    });
  }
}

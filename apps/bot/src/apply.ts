import {
  ALLOWED_PERMISSIONS,
  buildApplyPlan,
  buildWelcomeMessage,
  normalizePermissionName,
  permissionBits,
  toDiscordJsPermission,
  type ApplyPlanStep,
  type BlueprintChannel,
  type ServerBlueprint,
} from "@ohnivo/shared";
import {
  ChannelType,
  type Client,
  type Guild,
  type GuildBasedChannel,
  type Role,
} from "discord.js";
import { logger } from "./logger.js";
import {
  audit,
  getGuildLocale,
  loadJobObjects,
  notifyUser,
  recordObject,
  refundJob,
  setBlueprintStatus,
  updateJob,
  type ClaimedJob,
  type JobObject,
} from "./queue.js";
import { withDiscordRetry } from "./retry.js";

const REASON = "Ohnivo apply";
const ALLOWED = new Set<string>(ALLOWED_PERMISSIONS);

interface ApplyContext {
  guild: Guild;
  blueprint: ServerBlueprint;
  mode: ClaimedJob["mode"];
  objects: Map<string, JobObject>;
  locale: "cs" | "en";
}

interface StepOutcome {
  status: "done" | "skipped" | "warning";
  discordId?: string;
  error?: string;
  objectKind?: string;
  objectKey?: string;
  reused?: boolean;
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

  const created = await withDiscordRetry(`create role ${role.name}`, () =>
    context.guild.roles.create({
      name: role.name,
      colors: { primaryColor: role.color as `#${string}` },
      hoist: role.hoist,
      mentionable: role.mentionable,
      permissions: permissionBits(role.permissions),
      reason: REASON,
    }),
  );
  return {
    status: "done",
    discordId: created.id,
    objectKind: "role",
    objectKey: step.key,
    reused: false,
  };
}

async function executeCategory(context: ApplyContext, step: ApplyPlanStep): Promise<StepOutcome> {
  const category = context.blueprint.categories[step.categoryIndex ?? -1];
  if (!category) throw new Error(`Missing category for step ${step.key}`);

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
        channel.name.toLowerCase() === category.name.toLowerCase(),
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
      name: category.name,
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
        candidate.name.toLowerCase() === channel.name.toLowerCase() &&
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
    name: channel.name,
    type: mapped,
    parent: parentId,
    reason: REASON,
  };
  if (channel.topic && channel.type !== "voice") options.topic = channel.topic;
  if (channel.nsfw && (mapped === ChannelType.GuildText || mapped === ChannelType.GuildForum)) {
    options.nsfw = true;
  }

  let fallbackNote: string | undefined;
  const created = await withDiscordRetry<GuildBasedChannel>(
    `create channel ${channel.name}`,
    async () => {
      try {
        return (await context.guild.channels.create(options as never)) as GuildBasedChannel;
      } catch (error) {
        if (mapped === ChannelType.GuildAnnouncement) {
          fallbackNote =
            "Announcement channels need a community server; created a text channel instead.";
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
    status: fallbackNote ? "warning" : "done",
    error: fallbackNote,
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
        error: `${missingRoles} overwrite target(s) were missing.`,
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
  const locale = await getGuildLocale(job.guild_id);
  const now = new Date().toISOString();

  if (!guild) {
    await updateJob(job.id, {
      status: "failed",
      error: "guild_missing",
      finished_at: now,
    });
    await setBlueprintStatus(job.blueprint_id, "draft");
    await refundJob(job, "guild_missing");
    await notifyUser(job.user_id, {
      type: "apply_failed",
      title: locale === "en" ? "Build failed" : "Stavba selhala",
      body:
        locale === "en"
          ? "The bot is no longer on the server, so the build could not start."
          : "Bot už na serveru není, stavbu proto nešlo spustit.",
      href: `/dashboard/${job.guild_id}`,
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

  const context: ApplyContext = {
    guild,
    blueprint: job.blueprint_snapshot,
    mode: job.mode,
    objects,
    locale,
  };

  const persist = async () => {
    await updateJob(job.id, { progress, status: "running" });
  };

  try {
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
    await notifyUser(job.user_id, {
      type: "apply_completed",
      title: locale === "en" ? "Your server is ready" : "Server je hotový",
      body:
        locale === "en"
          ? `The build on ${guild.name} finished. Open Discord and get started.`
          : `Stavba na serveru ${guild.name} doběhla. Otevři Discord a rozjeď to.`,
      href: `/dashboard/${job.guild_id}/apply/${job.id}`,
    });
    await audit({
      actorUserId: job.user_id,
      guildId: job.guild_id,
      jobId: job.id,
      action: "apply.completed",
      meta: { steps: plan.steps.length, mode: job.mode },
    });
    logger.info(`Job ${job.id} completed`);
  } catch (error) {
    const message = errorMessage(error).slice(0, 1000);
    logger.error(`Job ${job.id} failed`, message);
    const rollbackFailures = await rollbackCreatedObjects(guild, objects);
    const status = [...objects.values()].some((object) => !object.reused)
      ? rollbackFailures > 0
        ? "failed"
        : "rolled_back"
      : "failed";

    await updateJob(job.id, {
      status,
      progress,
      error: rollbackFailures > 0 ? `${message} (rollback failures: ${rollbackFailures})` : message,
      finished_at: new Date().toISOString(),
    });
    await setBlueprintStatus(job.blueprint_id, "draft");
    await refundJob(job, "apply_failed");
    await notifyUser(job.user_id, {
      type: "apply_failed",
      title: locale === "en" ? "Build failed" : "Stavba selhala",
      body:
        locale === "en"
          ? `The build on ${guild.name} failed. Credits were refunded and created objects were rolled back.`
          : `Stavba na serveru ${guild.name} selhala. Kredity jsme vrátili a vytvořené objekty uklidili.`,
      href: `/dashboard/${job.guild_id}/apply/${job.id}`,
    });
    await audit({
      actorUserId: job.user_id,
      guildId: job.guild_id,
      jobId: job.id,
      action: "apply.failed",
      meta: { error: message, rollbackFailures, status },
    });
  }
}

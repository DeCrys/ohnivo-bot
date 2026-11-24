import type { ServerBlueprint } from "./blueprint.js";

export type ApplyMode = "merge" | "append";

export type ApplyStepKind = "role" | "category" | "channel" | "overwrite" | "welcome";

export interface ApplyPlanStep {
  key: string;
  kind: ApplyStepKind;
  /** Raw object name (never localized). */
  label: string;
  roleIndex?: number;
  categoryIndex?: number;
  channelIndex?: number;
  categoryKey?: string;
  channelKey?: string;
  channelType?: string;
}

export interface ApplyPlan {
  mode: ApplyMode;
  steps: ApplyPlanStep[];
  summary: {
    roles: number;
    categories: number;
    channels: number;
    overwrites: number;
    messages: number;
    totalSteps: number;
  };
}

/**
 * Produces the deterministic, ordered operation list used by the bot:
 * roles -> categories -> channels -> overwrites -> welcome message.
 *
 * Keys are stable for a given blueprint revision and are used for
 * idempotency/resume (created Discord IDs are stored under these keys).
 */
export function buildApplyPlan(
  blueprint: ServerBlueprint,
  options: { mode: ApplyMode } = { mode: "merge" },
): ApplyPlan {
  const steps: ApplyPlanStep[] = [];

  blueprint.roles.forEach((role, index) => {
    steps.push({ key: `role:${index}`, kind: "role", label: role.name, roleIndex: index });
  });

  blueprint.categories.forEach((category, categoryIndex) => {
    const categoryKey = `cat:${categoryIndex}`;
    steps.push({
      key: categoryKey,
      kind: "category",
      label: category.name,
      categoryIndex,
    });
    category.channels.forEach((channel, channelIndex) => {
      steps.push({
        key: `ch:${categoryIndex}:${channelIndex}`,
        kind: "channel",
        label: channel.name,
        categoryIndex,
        channelIndex,
        categoryKey,
        channelType: channel.type,
      });
    });
  });

  blueprint.categories.forEach((category, categoryIndex) => {
    category.channels.forEach((channel, channelIndex) => {
      if (channel.permissionOverwrites.length === 0) return;
      steps.push({
        key: `ow:${categoryIndex}:${channelIndex}`,
        kind: "overwrite",
        label: channel.name,
        categoryIndex,
        channelIndex,
        categoryKey: `cat:${categoryIndex}`,
        channelKey: `ch:${categoryIndex}:${channelIndex}`,
      });
    });
  });

  const welcomeChannel = findWelcomeChannel(blueprint);
  if (welcomeChannel) {
    steps.push({
      key: "welcome",
      kind: "welcome",
      label: welcomeChannel.channel.name,
      categoryIndex: welcomeChannel.categoryIndex,
      channelIndex: welcomeChannel.channelIndex,
      categoryKey: `cat:${welcomeChannel.categoryIndex}`,
      channelKey: `ch:${welcomeChannel.categoryIndex}:${welcomeChannel.channelIndex}`,
    });
  }

  return {
    mode: options.mode,
    steps,
    summary: {
      roles: blueprint.roles.length,
      categories: blueprint.categories.length,
      channels: blueprint.categories.reduce((total, category) => total + category.channels.length, 0),
      overwrites: blueprint.categories.reduce(
        (total, category) =>
          total +
          category.channels.reduce(
            (count, channel) => count + channel.permissionOverwrites.length,
            0,
          ),
        0,
      ),
      messages: welcomeChannel ? 1 : 0,
      totalSteps: steps.length,
    },
  };
}

export function findWelcomeChannel(blueprint: ServerBlueprint): {
  categoryIndex: number;
  channelIndex: number;
  channel: ServerBlueprint["categories"][number]["channels"][number];
} | null {
  const candidates: Array<{
    categoryIndex: number;
    channelIndex: number;
    channel: ServerBlueprint["categories"][number]["channels"][number];
  }> = [];
  blueprint.categories.forEach((category, categoryIndex) => {
    category.channels.forEach((channel, channelIndex) => {
      if (channel.type === "text" || channel.type === "announcement") {
        candidates.push({ categoryIndex, channelIndex, channel });
      }
    });
  });
  if (candidates.length === 0) return null;
  const requested = blueprint.welcome.channel.trim();
  return candidates.find((candidate) => candidate.channel.name === requested) ?? candidates[0] ?? null;
}

import { describe, expect, it } from "vitest";
import {
  blueprintSchema,
  blueprintStats,
  normalizeBlueprint,
  slugifyChannelName,
} from "../src/blueprint.js";

function minimalBlueprint(overrides: Record<string, unknown> = {}) {
  return {
    serverName: "Testovací server",
    categories: [
      {
        name: "Obecné",
        channels: [
          { name: "pravidla", type: "text", topic: "Pravidla" },
          { name: "obecný chat", type: "text" },
          { name: "hlasovka", type: "voice" },
        ],
      },
    ],
    roles: [
      { name: "Člen", color: "#5865F2", permissions: ["ViewChannel", "SendMessages"] },
    ],
    welcome: { channel: "pravidla", message: "Vítej!" },
    rules: ["Buď slušný.", "Žádný spam."],
    ...overrides,
  };
}

describe("slugifyChannelName", () => {
  it("creates Discord friendly names", () => {
    expect(slugifyChannelName("Obecný chat")).toBe("obecny-chat");
    expect(slugifyChannelName("  Novinky   a oznámení ")).toBe("novinky-a-oznameni");
    expect(slugifyChannelName("***")).toBe("");
  });
});

describe("blueprint validation", () => {
  it("parses a valid blueprint and fills defaults", () => {
    const parsed = blueprintSchema.parse(minimalBlueprint());
    expect(parsed.categories[0]?.channels[0]?.permissionOverwrites).toEqual([]);
    expect(parsed.roles[0]?.hoist).toBe(false);
  });

  it("normalises channel names and keeps them unique", () => {
    const raw = minimalBlueprint({
      categories: [
        {
          name: "A",
          channels: [
            { name: "Obecný chat", type: "text" },
            { name: "obecny chat", type: "text" },
          ],
        },
      ],
    });
    const { blueprint, issues } = normalizeBlueprint(raw);
    expect(blueprint.categories[0]?.channels.map((channel) => channel.name)).toEqual([
      "obecny-chat",
      "obecny-chat-2",
    ]);
    expect(issues.some((issue) => issue.code === "channel_name_slugified")).toBe(true);
    expect(issues.some((issue) => issue.code === "duplicate_channel_renamed")).toBe(true);
  });

  it("enforces the global channel limit", () => {
    const categories = Array.from({ length: 5 }, (_, categoryIndex) => ({
      name: `Kategorie ${categoryIndex}`,
      channels: Array.from({ length: 50 }, (_, channelIndex) => ({
        name: `kanal-${categoryIndex}-${channelIndex}`,
        type: "text",
      })),
    }));
    const { blueprint, issues } = normalizeBlueprint(
      minimalBlueprint({ categories, welcome: { channel: "kanal-0-0", message: "Ahoj" } }),
    );
    expect(blueprintStats(blueprint).channels).toBe(200);
    expect(issues.some((issue) => issue.code === "too_many_channels_total")).toBe(true);
  });

  it("enforces the per-category channel limit", () => {
    const channels = Array.from({ length: 60 }, (_, index) => ({
      name: `kanal-${index}`,
      type: "text",
    }));
    const { blueprint, issues } = normalizeBlueprint(
      minimalBlueprint({ categories: [{ name: "Velká", channels }] }),
    );
    expect(blueprint.categories[0]?.channels).toHaveLength(50);
    expect(issues.some((issue) => issue.code === "too_many_channels_in_category")).toBe(true);
  });

  it("enforces role limit and removes duplicates", () => {
    const roles = Array.from({ length: 140 }, (_, index) => ({
      name: `Role ${index}`,
      permissions: [],
    }));
    roles.push({ name: "Role 0", permissions: [] });
    const { blueprint, issues } = normalizeBlueprint(minimalBlueprint({ roles }));
    expect(blueprint.roles).toHaveLength(100);
    expect(issues.some((issue) => issue.code === "too_many_roles")).toBe(true);
  });

  it("falls back to the first text channel when welcome channel is unknown", () => {
    const { blueprint, issues } = normalizeBlueprint(
      minimalBlueprint({ welcome: { channel: "neexistuje", message: "" } }),
    );
    expect(blueprint.welcome.channel).toBe("pravidla");
    expect(issues.some((issue) => issue.code === "welcome_message_default")).toBe(true);
  });

  it("drops overwrites that reference unknown roles", () => {
    const raw = minimalBlueprint({
      categories: [
        {
          name: "A",
          channels: [
            {
              name: "tajne",
              type: "text",
              permissionOverwrites: [
                { role: "Neexistuje", deny: ["ViewChannel"] },
                { role: "Člen", allow: ["ViewChannel"] },
              ],
            },
          ],
        },
      ],
    });
    const { blueprint, issues } = normalizeBlueprint(raw);
    const overwrites = blueprint.categories[0]?.channels[0]?.permissionOverwrites ?? [];
    expect(overwrites).toHaveLength(1);
    expect(overwrites[0]?.role).toBe("Člen");
    expect(issues.some((issue) => issue.code === "unknown_role_reference")).toBe(true);
  });
});

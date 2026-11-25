import { describe, expect, it } from "vitest";
import { buildApplyPlan } from "../src/apply-plan.js";
import { normalizeBlueprint } from "../src/blueprint.js";

const { blueprint } = normalizeBlueprint({
  serverName: "Plán",
  categories: [
    {
      name: "Start",
      channels: [
        { name: "pravidla", type: "text" },
        {
          name: "oznámení",
          type: "announcement",
          permissionOverwrites: [{ role: "Člen", deny: ["SendMessages"] }],
        },
      ],
    },
    {
      name: "Hlas",
      channels: [{ name: "obecná-hlasovka", type: "voice" }],
    },
  ],
  roles: [
    { name: "Člen", permissions: ["ViewChannel"] },
    { name: "Moderátor", permissions: ["ManageMessages"] },
  ],
  welcome: { channel: "pravidla", message: "Ahoj" },
  rules: [],
});

describe("apply planner", () => {
  it("orders roles, categories, channels, overwrites and welcome", () => {
    const plan = buildApplyPlan(blueprint);
    const kinds = plan.steps.map((step) => step.kind);
    expect(kinds[0]).toBe("role");
    expect(kinds[1]).toBe("role");
    expect(kinds[2]).toBe("category");
    expect(kinds.lastIndexOf("channel")).toBeGreaterThan(kinds.lastIndexOf("category"));
    expect(kinds.indexOf("overwrite")).toBeGreaterThan(kinds.lastIndexOf("channel"));
    expect(kinds.at(-1)).toBe("welcome");
  });

  it("uses deterministic idempotency keys", () => {
    const plan = buildApplyPlan(blueprint);
    expect(plan.steps.map((step) => step.key)).toEqual([
      "role:0",
      "role:1",
      "cat:0",
      "ch:0:0",
      "ch:0:1",
      "cat:1",
      "ch:1:0",
      "ow:0:1",
      "welcome",
    ]);
  });

  it("links the welcome step to the correct channel", () => {
    const plan = buildApplyPlan(blueprint);
    const welcome = plan.steps.at(-1);
    expect(welcome?.channelKey).toBe("ch:0:0");
  });

  it("counts the summary", () => {
    const plan = buildApplyPlan(blueprint, { mode: "append" });
    expect(plan.summary).toMatchObject({
      roles: 2,
      categories: 2,
      channels: 3,
      overwrites: 1,
      messages: 1,
    });
    expect(plan.mode).toBe("append");
  });

  it("adds cleanup last only for replace mode", () => {
    const plan = buildApplyPlan(blueprint, { mode: "replace" });
    expect(plan.steps.at(-1)).toMatchObject({
      key: "cleanup:existing",
      kind: "cleanup",
    });
    expect(buildApplyPlan(blueprint, { mode: "append" }).steps).not.toContainEqual(
      expect.objectContaining({ kind: "cleanup" }),
    );
  });
});

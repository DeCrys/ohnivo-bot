import { describe, expect, it } from "vitest";
import { isManualBlueprint } from "./blueprint-source";

function draft(overrides: { source?: "ai" | "manual" | null; prompt?: string }) {
  return { source: "ai" as const, prompt: "Popis komunity", ...overrides };
}

describe("isManualBlueprint", () => {
  it("recognises the stored source", () => {
    expect(isManualBlueprint(draft({ source: "manual", prompt: "" }))).toBe(true);
    expect(isManualBlueprint(draft({ source: "ai", prompt: "" }))).toBe(false);
  });

  it("falls back to the empty prompt before migration 0007", () => {
    expect(isManualBlueprint(draft({ source: undefined, prompt: "" }))).toBe(true);
    expect(isManualBlueprint(draft({ source: undefined, prompt: "Popis" }))).toBe(false);
  });
});

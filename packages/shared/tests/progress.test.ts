import { describe, expect, it } from "vitest";
import { progressCounts } from "../src/progress.js";

describe("apply progress counts", () => {
  it("counts warning steps as completed while tracking warnings separately", () => {
    const counts = progressCounts([
      { key: "role", kind: "role", label: "Helper", status: "done" },
      {
        key: "cleanup",
        kind: "cleanup",
        label: "existing structure",
        status: "warning",
        error: "Some roles could not be removed",
      },
      { key: "channel", kind: "channel", label: "general", status: "pending" },
    ]);

    expect(counts).toEqual({ total: 3, done: 2, failed: 0, warnings: 1 });
  });
});

import { describe, expect, it } from "vitest";
import { generationAccess } from "./usage-limits";

const now = new Date("2026-11-26T10:00:00.000Z");
const user = { id: "user-1", discord_id: "123", is_admin: false, plan: "free" };

describe("generationAccess", () => {
  it("blocks the free plan and points to the next month", () => {
    const access = generationAccess(user, 0, now);
    expect(access.planRequired).toBe(true);
    expect(access.allowed).toBe(false);
    expect(access.limit).toBe(0);
    expect(access.resetsAt).toBe("2026-12-01T00:00:00.000Z");
  });

  it("allows generations within the paid quota", () => {
    const access = generationAccess({ ...user, plan: "starter" }, 9, now);
    expect(access.planRequired).toBe(false);
    expect(access.allowed).toBe(true);
    expect(access.limit).toBe(10);
  });

  it("blocks once the paid quota is exhausted", () => {
    const access = generationAccess({ ...user, plan: "starter" }, 10, now);
    expect(access.allowed).toBe(false);
    expect(access.used).toBe(10);
  });
});

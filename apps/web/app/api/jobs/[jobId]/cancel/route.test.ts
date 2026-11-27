import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const mocks = vi.hoisted(() => ({
  applyQueue: [] as Array<{ data: unknown; error: unknown }>,
  applyUpdates: [] as Array<Record<string, unknown>>,
  blueprintUpdates: [] as Array<Record<string, unknown>>,
  grantCredits: vi.fn(async () => {}),
  notify: vi.fn(async () => {}),
  logAudit: vi.fn(async () => {}),
}));

vi.mock("next/server", () => ({
  NextResponse: { json: (body: unknown) => ({ json: async () => body }) },
}));
vi.mock("@/lib/auth/session", () => ({
  requireApiUser: vi.fn(async () => ({ user: { id: "user-1" } })),
}));
vi.mock("@/lib/credits", () => ({ grantCredits: mocks.grantCredits }));
vi.mock("@/lib/notifications", () => ({ notify: mocks.notify }));
vi.mock("@/lib/audit", () => ({ logAudit: mocks.logAudit }));
vi.mock("@/lib/http", () => ({
  assertSameOrigin: vi.fn(),
  errorResponse: vi.fn((error: unknown) => ({ error })),
}));
vi.mock("@/lib/supabase/service", () => ({
  getServiceClient: () => ({
    from: (table: string) => {
      const builder = {
        select: () => builder,
        eq: () => builder,
        maybeSingle: async () => {
          if (table === "apply_jobs") {
            return mocks.applyQueue.shift() ?? { data: null, error: null };
          }
          if (table === "users") return { data: { locale: "en" }, error: null };
          return { data: null, error: null };
        },
        update: (values: Record<string, unknown>) => {
          (table === "apply_jobs" ? mocks.applyUpdates : mocks.blueprintUpdates).push(values);
          return builder;
        },
      };
      return builder;
    },
  }),
}));

const job = {
  id: "job-1",
  user_id: "user-1",
  guild_id: "guild-1",
  blueprint_id: "bp-1",
  status: "queued",
  cost: 0,
};

const request = () =>
  new Request("http://localhost/api/jobs/job-1/cancel", { method: "POST" });
const context = { params: { jobId: "job-1" } };

function queueJob(cost: number) {
  mocks.applyQueue.length = 0;
  mocks.applyQueue.push(
    { data: { ...job, cost }, error: null },
    {
      data: { ...job, cost, status: "cancelled", refunded: cost > 0 },
      error: null,
    },
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.applyUpdates.length = 0;
  mocks.blueprintUpdates.length = 0;
  queueJob(0);
});

describe("cancel apply job", () => {
  it("does not refund credits for a free build", async () => {
    const response = await POST(request(), context);

    expect(await response.json()).toEqual({ ok: true, status: "cancelled", refunded: false });
    expect(mocks.applyUpdates[0]).toMatchObject({ status: "cancelled", refunded: false });
    expect(mocks.blueprintUpdates[0]).toMatchObject({ status: "draft" });
    expect(mocks.grantCredits).not.toHaveBeenCalled();
    expect(mocks.notify).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({
        type: "job_cancelled",
        title: "Build cancelled",
        body: "The job was cancelled before it started. No changes were made.",
      }),
    );
    expect(mocks.logAudit).toHaveBeenCalledWith(
      expect.objectContaining({ meta: { refunded: 0 } }),
    );
  });

  it("still refunds legacy paid builds", async () => {
    queueJob(30);

    const response = await POST(request(), context);

    expect(await response.json()).toEqual({ ok: true, status: "cancelled", refunded: true });
    expect(mocks.applyUpdates[0]).toMatchObject({ status: "cancelled", refunded: true });
    expect(mocks.grantCredits).toHaveBeenCalledWith("user-1", 30, "refund", {
      reason: "job_cancelled",
      jobId: "job-1",
    });
    expect(mocks.notify).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({
        body: "The job was cancelled before it started. 30 credits were refunded.",
      }),
    );
    expect(mocks.logAudit).toHaveBeenCalledWith(
      expect.objectContaining({ meta: { refunded: 30 } }),
    );
  });
});

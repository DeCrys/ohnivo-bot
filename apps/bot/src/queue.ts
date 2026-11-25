import type { ApplyMode, ApplyProgressEntry, ServerBlueprint } from "@ohnivo/shared";
import { supabase } from "./supabase.js";
import { logger } from "./logger.js";

export interface ClaimedJob {
  id: string;
  user_id: string;
  guild_id: string;
  blueprint_id: string;
  blueprint_revision: number;
  blueprint_snapshot: ServerBlueprint;
  mode: ApplyMode;
  status: string;
  progress: ApplyProgressEntry[];
  cost: number;
  refunded: boolean;
  attempts: number;
}

export interface JobObject {
  objectKey: string;
  kind: string;
  discordId: string;
  reused: boolean;
}

export async function claimJob(worker: string): Promise<ClaimedJob | null> {
  const { data, error } = await supabase.rpc("claim_apply_job", { p_worker: worker });
  if (error) {
    logger.error("Could not claim job", error.message);
    return null;
  }
  const row = Array.isArray(data) ? data[0] : data;
  return (row as ClaimedJob | null) ?? null;
}

export async function updateJob(
  jobId: string,
  patch: Record<string, unknown>,
): Promise<void> {
  const { error } = await supabase.from("apply_jobs").update(patch).eq("id", jobId);
  if (error) logger.error(`Job update failed (${jobId})`, error.message);
}

export async function loadJobObjects(jobId: string): Promise<Map<string, JobObject>> {
  const { data, error } = await supabase
    .from("apply_job_objects")
    .select("object_key, kind, discord_id, reused")
    .eq("job_id", jobId);
  if (error) {
    throw new Error(`Could not load job objects (${jobId}): ${error.message}`);
  }
  const map = new Map<string, JobObject>();
  for (const row of data ?? []) {
    map.set(row.object_key as string, {
      objectKey: row.object_key as string,
      kind: row.kind as string,
      discordId: row.discord_id as string,
      reused: Boolean(row.reused),
    });
  }
  return map;
}

export async function recordObject(
  jobId: string,
  object: JobObject,
): Promise<void> {
  const { error } = await supabase.from("apply_job_objects").upsert(
    {
      job_id: jobId,
      object_key: object.objectKey,
      kind: object.kind,
      discord_id: object.discordId,
      reused: object.reused,
    },
    { onConflict: "job_id,object_key" },
  );
  if (error) throw new Error(`Could not persist job object (${jobId}): ${error.message}`);
}

export async function recordJobObjects(
  jobId: string,
  objects: JobObject[],
): Promise<void> {
  if (objects.length === 0) return;
  const { error } = await supabase.from("apply_job_objects").upsert(
    objects.map((object) => ({
      job_id: jobId,
      object_key: object.objectKey,
      kind: object.kind,
      discord_id: object.discordId,
      reused: object.reused,
    })),
    { onConflict: "job_id,object_key" },
  );
  if (error) throw new Error(`Could not persist replacement snapshot: ${error.message}`);
}

export async function setBlueprintStatus(blueprintId: string, status: string): Promise<void> {
  const { error } = await supabase.from("blueprints").update({ status }).eq("id", blueprintId);
  if (error) logger.warn("Could not update blueprint status", error.message);
}

export async function refundJob(job: ClaimedJob, reason: string): Promise<boolean> {
  if (job.cost <= 0) return false;
  const { data, error } = await supabase.rpc("refund_apply_job", {
    p_job: job.id,
    p_reason: reason,
  });
  if (error) {
    logger.error(`Apply-job refund failed (${job.id})`, error.message);
    return false;
  }
  if (data !== true) {
    logger.warn(`Apply-job refund was not applied (${job.id})`, {
      reason,
      cost: job.cost,
    });
  }
  return data === true;
}

export async function notifyUser(
  userId: string,
  input: { type: string; title: string; body: string; href?: string },
): Promise<void> {
  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    type: input.type,
    title: input.title,
    body: input.body,
    href: input.href ?? null,
  });
  if (error) logger.warn("Notification insert failed", error.message);
}

export async function audit(input: {
  actorUserId: string;
  guildId: string;
  jobId: string;
  action: string;
  meta?: Record<string, unknown>;
}): Promise<void> {
  const { error } = await supabase.from("audit_log").insert({
    actor_user_id: input.actorUserId,
    guild_id: input.guildId,
    job_id: input.jobId,
    action: input.action,
    meta: input.meta ?? {},
  });
  if (error) logger.warn("Audit insert failed", error.message);
}

export async function getUserLocale(userId: string): Promise<"cs" | "en"> {
  const { data, error } = await supabase
    .from("users")
    .select("locale")
    .eq("id", userId)
    .maybeSingle();
  if (error) {
    logger.warn(`Could not load user locale (${userId}); using Czech`, error.message);
    return "cs";
  }
  return data?.locale === "en" ? "en" : "cs";
}

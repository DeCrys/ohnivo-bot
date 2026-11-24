import { getServiceClient } from "./supabase/service";

interface AuditInput {
  actorUserId: string;
  action: string;
  guildId?: string | null;
  jobId?: string | null;
  meta?: Record<string, unknown>;
}

/**
 * Best-effort audit trail. Never let a logging failure break a user action,
 * but always write through the service role so RLS cannot drop entries.
 */
export async function logAudit(input: AuditInput): Promise<void> {
  const { error } = await getServiceClient()
    .from("audit_log")
    .insert({
      actor_user_id: input.actorUserId,
      action: input.action,
      guild_id: input.guildId ?? null,
      job_id: input.jobId ?? null,
      meta: input.meta ?? {},
    });
  if (error) console.error("[audit] insert failed", error.message);
}

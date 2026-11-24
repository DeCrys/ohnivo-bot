export type ApplyProgressStatus = "pending" | "running" | "done" | "skipped" | "failed" | "warning";

export interface ApplyProgressEntry {
  key: string;
  kind: "role" | "category" | "channel" | "overwrite" | "welcome";
  label: string;
  status: ApplyProgressStatus;
  discordId?: string;
  error?: string;
}

export type ApplyJobStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "cancelled"
  | "rolled_back";

export const ACTIVE_JOB_STATUSES: readonly ApplyJobStatus[] = ["queued", "running"];

export function isActiveJobStatus(status: string): boolean {
  return ACTIVE_JOB_STATUSES.includes(status as ApplyJobStatus);
}

export function progressCounts(progress: readonly ApplyProgressEntry[]) {
  return {
    total: progress.length,
    done: progress.filter((entry) => entry.status === "done" || entry.status === "skipped").length,
    failed: progress.filter((entry) => entry.status === "failed").length,
    warnings: progress.filter((entry) => entry.status === "warning").length,
  };
}

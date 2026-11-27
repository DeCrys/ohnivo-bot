"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@supabase/supabase-js";
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  Loader2,
  MinusCircle,
  XCircle,
} from "lucide-react";
import type { ApplyJobStatus, ApplyProgressEntry } from "@ohnivo/shared";
import { progressCounts } from "@ohnivo/shared";
import { Badge } from "@/components/ui/primitives";
import { Mascot } from "@/components/brand/mascot";
import { RoleHierarchyGuide } from "@/components/ai/role-hierarchy-guide";
import { Button, buttonClasses } from "@/components/ui/button";
import {
  isStaffPermissionFailure,
  parseOmittedStaffPermissions,
  parseReplacementBlockers,
} from "@/lib/apply-errors";
import { cn, formatDateTime } from "@/lib/utils";

interface JobView {
  id: string;
  mode: "merge" | "append" | "replace";
  status: ApplyJobStatus;
  progress: ApplyProgressEntry[];
  summary: Record<string, number>;
  error: string | null;
  refunded: boolean;
  cost: number;
  created_at: string;
  finished_at: string | null;
}

interface ApplyProgressProps {
  job: JobView;
  guildId: string;
  realtime: { url: string; anonKey: string; token: string | null } | null;
}

const STATUS_STYLES: Record<string, string> = {
  done: "text-spark-200",
  skipped: "text-chalk-500",
  running: "text-ember-400",
  failed: "text-red-400",
  warning: "text-amber-400",
  pending: "text-chalk-500",
};

export function ApplyProgress({ job: initialJob, guildId, realtime }: ApplyProgressProps) {
  const t = useTranslations("ai.apply");
  const tf = useTranslations("ai.apply.failure");
  const tc = useTranslations("common");
  const router = useRouter();
  const [job, setJob] = useState<JobView>(initialJob);
  const [cancelling, setCancelling] = useState(false);

  const active = job.status === "queued" || job.status === "running";
  const cleanupProgress = job.progress.find((entry) => entry.kind === "cleanup");
  const refundWasExpected =
    job.status === "rolled_back" ||
    job.status === "cancelled" ||
    (job.status === "failed" &&
      (job.mode !== "replace" || !cleanupProgress || cleanupProgress.status === "pending"));
  const counts = progressCounts(job.progress);
  const percent = counts.total === 0 ? 0 : Math.round((counts.done / counts.total) * 100);

  useEffect(() => {
    if (!realtime) return;
    const client = createClient(realtime.url, realtime.anonKey, {
      auth: { persistSession: false },
    });
    if (realtime.token) client.realtime.setAuth(realtime.token);
    const channel = client
      .channel(`apply-job-${initialJob.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "apply_jobs", filter: `id=eq.${initialJob.id}` },
        (payload) => {
          const next = payload.new as unknown as JobView;
          if (next?.id) setJob(next);
        },
      )
      .subscribe();
    return () => {
      void client.removeChannel(channel);
    };
  }, [realtime, initialJob.id]);

  useEffect(() => {
    if (!active) return;
    const timer = setInterval(async () => {
      try {
        const response = await fetch(`/api/jobs/${initialJob.id}`);
        if (!response.ok) return;
        const data = (await response.json()) as JobView;
        setJob(data);
      } catch {
        // polling is a safety net; ignore transient failures
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [active, initialJob.id]);

  useEffect(() => {
    if (!active && initialJob.status !== job.status) {
      router.refresh();
    }
  }, [active, initialJob.status, job.status, router]);

  async function cancel() {
    setCancelling(true);
    try {
      const response = await fetch(`/api/jobs/${initialJob.id}/cancel`, { method: "POST" });
      if (response.ok) {
        const result = (await response.json()) as { refunded?: boolean };
        setJob((current) => ({
          ...current,
          status: "cancelled",
          refunded: result.refunded ?? false,
        }));
        router.refresh();
      }
    } finally {
      setCancelling(false);
    }
  }

  const statusLabel = useMemo(() => {
    if (job.status === "completed") return t("completedTitle");
    if (job.status === "failed") return t("failedTitle");
    if (job.status === "rolled_back") return t("rolledBackTitle");
    if (job.status === "cancelled") return t("cancelledTitle");
    if (job.status === "running") return t("runningHint");
    return t("queuedHint");
  }, [job.status, t]);

  // Bot errors are written in the guild locale. Re-render the known preflight
  // blockers in the dashboard locale so an English UI never shows Czech text.
  const localizedError = useMemo(() => {
    if (job.error === "guild_missing") return tf("guildMissing");
    if (isStaffPermissionFailure(job.error)) {
      const permissions = [
        ...new Set(
          job.progress.flatMap(
            (entry) =>
              entry.omittedPermissions ?? parseOmittedStaffPermissions(entry.error) ?? [],
          ),
        ),
      ];
      return permissions.length > 0
        ? tf("staffPermissionsFailure", { permissions: permissions.join(", ") })
        : tf("staffPermissionsFailureGeneric");
    }
    const blockers = parseReplacementBlockers(job.error);
    if (!blockers) return null;
    const parts = blockers.map((blocker) => {
      if (blocker.kind === "hierarchy") {
        return tf("hierarchy", { count: blocker.count, names: blocker.names });
      }
      if (blocker.kind === "channels") {
        return tf("channels", { count: blocker.count, names: blocker.names });
      }
      return tf("manageRoles");
    });
    return `${tf("intro", { blockers: parts.join("; ") })} ${tf("outro")}`;
  }, [job.error, tf]);

  const terminal = !active;

  return (
    <div className="space-y-5">
      <div className="surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  job.status === "completed"
                    ? "success"
                    : job.status === "failed" || job.status === "rolled_back"
                      ? "danger"
                      : job.status === "running"
                        ? "info"
                        : "default"
                }
              >
                {tc(`jobStatus.${job.status}`)}
              </Badge>
              {active ? <span className="text-[11px] text-chalk-500">{t("live")}</span> : null}
            </div>
            <p className="mt-2 text-sm text-chalk-300">{statusLabel}</p>
            <p className="mt-1 text-[11px] text-chalk-500">
              {t("createdAt")}: {formatDateTime(job.created_at)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-semibold text-chalk">{percent}%</p>
            <p className="text-[11px] text-chalk-500">
              {counts.done} / {counts.total} {t("steps")}
            </p>
          </div>
        </div>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-void-700">
          <div
            className="h-full rounded-pill bg-spark-300 transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
        {job.status === "queued" ? (
          <Button
            variant="secondary"
            size="sm"
            className="mt-4"
            onClick={cancel}
            disabled={cancelling}
          >
            {cancelling ? t("cancelling") : t("cancel")}
          </Button>
        ) : null}
      </div>

      {terminal ? (
        <div className="surface p-5">
          {job.status === "completed" ? (
            <div className="flex flex-col items-center text-center">
              <Mascot className="h-24 w-24" withSparkles={false} />
              <h2 className="mt-2 text-[18px] font-medium text-white">{t("completedTitle")}</h2>
              <p className="mt-1 max-w-md text-sm text-chalk-400">{t("completedBody")}</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <a
                  href={`https://discord.com/channels/${guildId}`}
                  target="_blank"
                  rel="noreferrer"
                  className={buttonClasses("primary", "md")}
                >
                  {t("openDiscord")}
                </a>
                <Link href={`/dashboard/${guildId}`} className={buttonClasses("secondary", "md")}>
                  {t("back")}
                </Link>
              </div>
            </div>
          ) : job.status === "failed" || job.status === "rolled_back" ? (
            <div className="text-center">
              <AlertTriangle className="mx-auto h-8 w-8 text-red-400" />
              <h2 className="mt-2 text-[18px] font-medium text-white">
                {job.status === "rolled_back" ? t("rolledBackTitle") : t("failedTitle")}
              </h2>
              <p className="mt-1 text-sm text-chalk-400">
                {job.status === "rolled_back" ? t("rolledBackBody") : t("failedBody")}
              </p>
              {job.refunded && job.cost > 0 ? (
                <p className="mt-2 text-xs text-emerald-300">{t("refunded")}</p>
              ) : null}
              {refundWasExpected && !job.refunded && job.cost > 0 ? (
                <p className="mt-2 text-xs text-red-300">{t("refundFailed")}</p>
              ) : null}
              {job.error ? (
                <p
                  className={cn(
                    "mx-auto mt-3 max-w-xl rounded-inner border border-red-500/20 bg-red-500/5 px-4 py-3 text-[12px] leading-relaxed text-red-200/80",
                    !localizedError && "font-code",
                  )}
                >
                  {localizedError ?? job.error}
                </p>
              ) : null}
              {isRoleHierarchyError(job.error) ? (
                <RoleHierarchyGuide guildId={guildId} className="mx-auto mt-4 max-w-xl" />
              ) : null}
              <div className="mt-4 flex justify-center gap-2">
                <Link href={`/dashboard/${guildId}`} className={buttonClasses("secondary", "md")}>
                  {t("back")}
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <XCircle className="mx-auto h-8 w-8 text-chalk-500" />
              <h2 className="mt-2 text-[18px] font-medium text-white">{t("cancelledTitle")}</h2>
              <p className="mt-1 text-sm text-chalk-400">{t("cancelledBody")}</p>
              <Link href={`/dashboard/${guildId}`} className={buttonClasses("secondary", "md", "mt-4")}>
                {t("back")}
              </Link>
            </div>
          )}
        </div>
      ) : null}

      <div className="surface p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[16px] font-medium text-white">{t("progress")}</h2>
          <span className="text-[11px] text-chalk-500">
            {job.summary.channels ?? 0} {t("channel")} · {job.summary.roles ?? 0} {t("role")}
          </span>
        </div>
        <ul className="list-fade space-y-1">
          {job.progress.map((entry) => {
            const omittedPermissions =
              entry.omittedPermissions ?? parseOmittedStaffPermissions(entry.error);
            const errorText =
              entry.status === "failed" || entry.status === "warning"
                ? omittedPermissions && omittedPermissions.length > 0
                  ? tf("staffPermissionsSkipped", {
                      permissions: omittedPermissions.join(", "),
                    })
                  : entry.error ?? ""
                : "";
            return (
              <li
                key={entry.key}
                className={cn(
                  "flex items-center gap-2 rounded-inner bg-white/[0.03] px-3 py-2 text-[12px]",
                  entry.status === "running" && "bg-ember-500/5",
                )}
              >
                <StatusIcon status={entry.status} />
                <span className="w-20 shrink-0 text-[12px] text-chalk-500">
                  {kindLabel(entry.kind, t)}
                </span>
                <span
                  className={cn(
                    "flex-1 truncate",
                    entry.status === "done" ? "text-chalk-300" : "text-chalk-400",
                  )}
                >
                  {entry.label}
                </span>
                <span
                  title={errorText || undefined}
                  className="max-w-[45%] truncate text-right text-[11px] text-chalk-500"
                >
                  {errorText}
                </span>
              </li>
            );
          })}
        </ul>
        {counts.total === 0 ? (
          <p className="text-xs text-chalk-500">{tc("loading")}</p>
        ) : null}
      </div>
    </div>
  );
}

function StatusIcon({ status }: { status: string }) {
  if (status === "done") return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />;
  if (status === "running") return <Loader2 className="h-3.5 w-3.5 animate-spin text-ember-400" />;
  if (status === "failed") return <XCircle className="h-3.5 w-3.5 text-red-400" />;
  if (status === "warning") return <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />;
  if (status === "skipped") return <MinusCircle className="h-3.5 w-3.5 text-chalk-500" />;
  return <Circle className={cn("h-3.5 w-3.5", STATUS_STYLES.pending)} />;
}

function kindLabel(kind: string, t: (key: string) => string): string {
  if (kind === "role") return t("role");
  if (kind === "category") return t("category");
  if (kind === "channel") return t("channel");
  if (kind === "overwrite") return t("overwrite");
  if (kind === "cleanup") return t("cleanup");
  return t("welcome");
}

/** The bot reports hierarchy blockers in Czech or English free text. */
function isRoleHierarchyError(error: string | null): boolean {
  if (!error) return false;
  return /hierarchii rolí|role hierarchy|nejvyšší role bota|bot's highest role/i.test(error);
}

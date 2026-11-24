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
import { Button, buttonClasses } from "@/components/ui/button";
import { cn, formatDateTime } from "@/lib/utils";

interface JobView {
  id: string;
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
  done: "text-emerald-400",
  skipped: "text-spark-100/30",
  running: "text-ember-400",
  failed: "text-red-400",
  warning: "text-amber-400",
  pending: "text-spark-100/25",
};

export function ApplyProgress({ job: initialJob, guildId, realtime }: ApplyProgressProps) {
  const t = useTranslations("ai.apply");
  const tc = useTranslations("common");
  const router = useRouter();
  const [job, setJob] = useState<JobView>(initialJob);
  const [cancelling, setCancelling] = useState(false);

  const active = job.status === "queued" || job.status === "running";
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

  async function cancel() {
    setCancelling(true);
    try {
      const response = await fetch(`/api/jobs/${initialJob.id}/cancel`, { method: "POST" });
      if (response.ok) {
        setJob((current) => ({ ...current, status: "cancelled", refunded: true }));
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
                {job.status}
              </Badge>
              {active ? <span className="text-[10px] text-spark-100/35">{t("live")}</span> : null}
            </div>
            <p className="mt-2 text-sm text-spark-100/70">{statusLabel}</p>
            <p className="mt-1 text-[11px] text-spark-100/35">
              {t("createdAt")}: {formatDateTime(job.created_at)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-semibold text-white">{percent}%</p>
            <p className="text-[11px] text-spark-100/40">
              {counts.done} / {counts.total} {t("steps")}
            </p>
          </div>
        </div>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-ink-700">
          <div
            className="h-full rounded-full bg-gradient-to-r from-spark-500 to-ember-400 transition-all duration-500"
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
              <h2 className="mt-2 text-lg font-semibold text-white">{t("completedTitle")}</h2>
              <p className="mt-1 max-w-md text-sm text-spark-100/60">{t("completedBody")}</p>
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
              <h2 className="mt-2 text-lg font-semibold text-white">
                {job.status === "rolled_back" ? t("rolledBackTitle") : t("failedTitle")}
              </h2>
              <p className="mt-1 text-sm text-spark-100/60">
                {job.status === "rolled_back" ? t("rolledBackBody") : t("failedBody")}
              </p>
              {job.refunded ? <p className="mt-2 text-xs text-emerald-300">{t("refunded")}</p> : null}
              {job.error ? (
                <p className="mx-auto mt-3 max-w-xl rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 font-mono text-[11px] text-red-200/80">
                  {job.error}
                </p>
              ) : null}
              <div className="mt-4 flex justify-center gap-2">
                <Link href={`/dashboard/${guildId}`} className={buttonClasses("secondary", "md")}>
                  {t("back")}
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <XCircle className="mx-auto h-8 w-8 text-spark-100/40" />
              <h2 className="mt-2 text-lg font-semibold text-white">{t("cancelledTitle")}</h2>
              <p className="mt-1 text-sm text-spark-100/60">{t("cancelledBody")}</p>
              <Link href={`/dashboard/${guildId}`} className={buttonClasses("secondary", "md", "mt-4")}>
                {t("back")}
              </Link>
            </div>
          )}
        </div>
      ) : null}

      <div className="surface p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">{t("progress")}</h2>
          <span className="text-[11px] text-spark-100/35">
            {job.summary.channels ?? 0} {t("channel")} · {job.summary.roles ?? 0} {t("role")}
          </span>
        </div>
        <ul className="space-y-0.5">
          {job.progress.map((entry) => (
            <li
              key={entry.key}
              className={cn(
                "flex items-center gap-2 rounded-md px-2 py-1.5 text-xs",
                entry.status === "running" && "bg-ember-500/5",
              )}
            >
              <StatusIcon status={entry.status} />
              <span className="w-16 shrink-0 text-[10px] uppercase tracking-wide text-spark-100/30">
                {kindLabel(entry.kind, t)}
              </span>
              <span
                className={cn(
                  "flex-1 truncate",
                  entry.status === "done" ? "text-spark-100/70" : "text-spark-100/50",
                )}
              >
                {entry.label}
              </span>
              <span className="text-[10px] text-spark-100/25">
                {entry.status === "failed" ? entry.error ?? "" : ""}
              </span>
            </li>
          ))}
        </ul>
        {counts.total === 0 ? (
          <p className="text-xs text-spark-100/40">{tc("loading")}</p>
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
  if (status === "skipped") return <MinusCircle className="h-3.5 w-3.5 text-spark-100/30" />;
  return <Circle className={cn("h-3.5 w-3.5", STATUS_STYLES.pending)} />;
}

function kindLabel(kind: string, t: (key: string) => string): string {
  if (kind === "role") return t("role");
  if (kind === "category") return t("category");
  if (kind === "channel") return t("channel");
  if (kind === "overwrite") return t("overwrite");
  return t("welcome");
}

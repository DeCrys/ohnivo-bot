"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Coins, Play, X } from "lucide-react";
import type { ApplyMode } from "@ohnivo/shared";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

interface ReadyPanelProps {
  guildId: string;
  blueprintId: string;
  cost: number;
  balance: number;
  canUseAi: boolean;
  botPresent: boolean;
}

export function ReadyPanel({
  guildId,
  blueprintId,
  cost,
  balance,
  canUseAi,
  botPresent,
}: ReadyPanelProps) {
  const t = useTranslations("ai.ready");
  const te = useTranslations("ai.errors");
  const router = useRouter();
  const [mode, setMode] = useState<ApplyMode>("merge");
  const [seconds, setSeconds] = useState<number | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submitting = useRef(false);

  const enough = balance >= cost;
  const blocked = !canUseAi || !enough || !botPresent || pending;

  useEffect(() => {
    if (seconds === null) return;
    if (seconds <= 0) {
      setSeconds(null);
      void submit();
      return;
    }
    const timer = setTimeout(() => setSeconds((value) => (value === null ? null : value - 1)), 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds]);

  async function submit() {
    if (submitting.current) return;
    submitting.current = true;
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/blueprints/${blueprintId}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      const data = (await response.json()) as { jobId?: string; error?: { code: string } };
      if (!response.ok || !data.jobId) {
        try {
          setError(te(data.error?.code ?? "unknown"));
        } catch {
          setError(te("unknown"));
        }
        setPending(false);
        submitting.current = false;
        return;
      }
      router.push(`/dashboard/${guildId}/apply/${data.jobId}`);
    } catch {
      setError(te("unknown"));
      setPending(false);
      submitting.current = false;
    }
  }

  return (
    <div className="space-y-4">
      <div className="surface p-4">
        <h2 className="text-sm font-semibold text-white">{t("modeTitle")}</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {(["merge", "append"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setMode(value)}
              className={cn(
                "rounded-xl border px-4 py-3 text-left transition-colors",
                mode === value
                  ? "border-spark-500/60 bg-spark-500/10"
                  : "border-line bg-ink-900/50 hover:border-spark-500/30",
              )}
            >
              <p className="text-xs font-medium text-white">
                {value === "merge" ? t("modeMerge") : t("modeAppend")}
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-spark-100/50">
                {value === "merge" ? t("modeMergeBody") : t("modeAppendBody")}
              </p>
            </button>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-spark-100/40">{t("modeHint")}</p>
      </div>

      <div className="surface flex flex-wrap items-center justify-between gap-4 p-4">
        <div className="flex items-center gap-6 text-sm">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-spark-100/40">{t("price")}</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-lg font-semibold text-white">
              <Coins className="h-4 w-4 text-spark-300" /> {cost}
            </p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-spark-100/40">{t("balance")}</p>
            <p className="mt-0.5 text-lg font-semibold text-spark-100/80">{balance}</p>
          </div>
        </div>

        {seconds !== null ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-spark-200">{t("countdown", { seconds })}</span>
            <Button variant="secondary" size="sm" onClick={() => setSeconds(null)}>
              <X className="h-3.5 w-3.5" /> {t("cancelCountdown")}
            </Button>
          </div>
        ) : (
          <Button
            size="lg"
            onClick={() => setSeconds(10)}
            disabled={blocked}
            title={blocked ? t("applyBlocked") : undefined}
          >
            <Play className="h-4 w-4" /> {pending ? t("starting") : t("start")}
          </Button>
        )}
      </div>

      {!botPresent ? <Alert variant="warning">{t("botMissing")}</Alert> : null}
      {!enough ? (
        <Alert variant="warning" title={t("notEnough")}>
          {t("notEnoughBody", { cost, balance })}
        </Alert>
      ) : null}
      {error ? <Alert variant="danger">{error}</Alert> : null}
      <p className="text-[11px] leading-relaxed text-spark-100/40">{t("stepsNote")}</p>
    </div>
  );
}

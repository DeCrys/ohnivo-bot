"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Play, X } from "lucide-react";
import type { ApplyMode } from "@ohnivo/shared";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/primitives";
import { Input, Label } from "@/components/ui/field";
import { cn } from "@/lib/utils";

interface ReadyPanelProps {
  guildId: string;
  blueprintId: string;
  botPresent: boolean;
}

export function ReadyPanel({ guildId, blueprintId, botPresent }: ReadyPanelProps) {
  const t = useTranslations("ai.ready");
  const te = useTranslations("ai.errors");
  const router = useRouter();
  const [mode, setMode] = useState<ApplyMode>("append");
  const [seconds, setSeconds] = useState<number | null>(null);
  const [confirmingReplace, setConfirmingReplace] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submitting = useRef(false);

  const blocked = !botPresent || pending;

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
        body: JSON.stringify({
          mode,
          confirmReplace: mode === "replace" ? t("replaceConfirmPhrase") : undefined,
        }),
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
      <div className="surface p-6">
        <h2 className="text-[16px] font-medium text-white">{t("modeTitle")}</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {(["replace", "append"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setMode(value);
                setConfirmingReplace(false);
                setConfirmationText("");
                setError(null);
              }}
              disabled={pending || seconds !== null || confirmingReplace}
              className={cn(
                "rounded-inner border px-4 py-4 text-left transition-colors",
                mode === value
                  ? "border-wire bg-spark-500/[0.12]"
                  : "border-wire bg-void-800 hover:border-white/[0.12]",
                "disabled:cursor-not-allowed disabled:opacity-60",
              )}
            >
              <p className="text-[13px] font-medium text-white">
                {value === "replace" ? t("modeReplace") : t("modeAppend")}
              </p>
              <p className="mt-1 text-[12px] leading-relaxed text-chalk-400">
                {value === "replace" ? t("modeReplaceBody") : t("modeAppendBody")}
              </p>
            </button>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-chalk-500">{t("modeHint")}</p>
      </div>

      {confirmingReplace ? (
        <div className="space-y-3 rounded-inner border border-red-500/20 bg-red-500/[0.05] p-5">
          <Alert variant="danger" title={t("replaceConfirmTitle")}>
            {t("replaceConfirmBody")}
          </Alert>
          <div>
            <Label htmlFor="replace-confirmation">{t("replaceConfirmLabel")}</Label>
            <Input
              id="replace-confirmation"
              value={confirmationText}
              onChange={(event) => setConfirmationText(event.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="danger"
              disabled={
                blocked ||
                confirmationText.trim().toUpperCase() !== t("replaceConfirmPhrase").toUpperCase()
              }
              onClick={() => {
                setConfirmingReplace(false);
                setSeconds(10);
              }}
            >
              {t("replaceConfirmAction")}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setConfirmingReplace(false);
                setConfirmationText("");
              }}
            >
              {t("replaceCancel")}
            </Button>
          </div>
        </div>
      ) : null}

      <div className="surface flex flex-wrap items-center justify-between gap-4 p-6">
        <div className="text-sm">
          <p className="text-[12px] text-chalk-500">{t("price")}</p>
          <p className="mt-0.5 text-[18px] font-medium text-white">{t("freePrice")}</p>
          <p className="mt-1 text-[12px] leading-relaxed text-chalk-500">{t("freeNote")}</p>
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
            onClick={() => {
              if (mode === "replace") {
                setConfirmingReplace(true);
                setConfirmationText("");
              } else {
                setSeconds(10);
              }
            }}
            disabled={blocked}
            title={blocked ? t("applyBlocked") : undefined}
          >
            <Play className="h-4 w-4" /> {pending ? t("starting") : t("start")}
          </Button>
        )}
      </div>

      {!botPresent ? <Alert variant="warning">{t("botMissing")}</Alert> : null}
      {error ? <Alert variant="danger">{error}</Alert> : null}
      <p className="text-[11px] leading-relaxed text-chalk-500">{t("stepsNote")}</p>
    </div>
  );
}

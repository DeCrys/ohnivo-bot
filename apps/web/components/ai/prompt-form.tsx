"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/primitives";
import { Textarea } from "@/components/ui/field";

interface PromptFormProps {
  guildId: string;
  cost: number;
  balance: number;
  canUseAi: boolean;
  demo: boolean;
}

export function PromptForm({ guildId, cost, balance, canUseAi, demo }: PromptFormProps) {
  const t = useTranslations("ai.new");
  const te = useTranslations("ai.errors");
  const tc = useTranslations("common");
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("ohnivo.prompt");
      if (stored) setPrompt(stored);
    } catch {
      // ignore unavailable storage
    }
  }, []);

  const enoughCredits = balance >= cost;
  const disabled = pending || !canUseAi || !enoughCredits || prompt.trim().length < 3;

  async function submit() {
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guildId, prompt }),
      });
      const data = (await response.json()) as {
        blueprintId?: string;
        error?: { code: string };
      };
      if (!response.ok || !data.blueprintId) {
        const code = data.error?.code ?? "unknown";
        try {
          setError(te(code));
        } catch {
          setError(te("unknown"));
        }
        return;
      }
      try {
        sessionStorage.removeItem("ohnivo.prompt");
      } catch {
        // ignore
      }
      router.push(`/dashboard/${guildId}/ai/${data.blueprintId}`);
    } catch {
      setError(te("unknown"));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      {demo ? <Alert variant="info">{t("demo")}</Alert> : null}

      {!canUseAi ? (
        <Alert variant="warning" title={t("planRequired")}>
          {t("planRequiredBody")}
        </Alert>
      ) : !enoughCredits ? (
        <Alert variant="warning" title={t("creditsRequired")}>
          {t("creditsRequiredBody", { cost, balance })}
        </Alert>
      ) : null}

      <div className="surface p-4">
        <Textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          rows={7}
          maxLength={1200}
          placeholder={t("placeholder")}
          disabled={!canUseAi}
        />
        <div className="mt-2 flex items-center justify-between text-xs text-spark-100/40">
          <span>{prompt.length} / 1200</span>
          <span>
            {t("cost")}: <strong className="text-spark-200">{cost}</strong> {tc("credits")}
          </span>
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-spark-100/45">
          {t("examples")}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {(["example1", "example2", "example3", "example4"] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setPrompt(t(key))}
              className="rounded-full border border-line/70 px-2.5 py-1 text-[11px] text-spark-100/55 transition-colors hover:border-spark-500/50 hover:text-spark-100"
            >
              {t(key)}
            </button>
          ))}
        </div>
      </div>

      {error ? <Alert variant="danger">{error}</Alert> : null}

      <div className="flex items-center gap-3">
        <Button onClick={submit} disabled={disabled} size="lg">
          <Sparkles className="h-4 w-4" />
          {pending ? t("generating") : t("generate")}
        </Button>
        <span className="text-xs text-spark-100/40">
          {t("cost")}: {cost} · {balance} {tc("credits")}
        </span>
      </div>

      <div className="surface-muted p-4 text-xs leading-relaxed text-spark-100/50">
        <p className="mb-1.5 font-medium text-spark-100/80">{t("tips")}</p>
        <ul className="list-inside list-disc space-y-1">
          <li>{t("tip1")}</li>
          <li>{t("tip2")}</li>
          <li>{t("tip3")}</li>
        </ul>
      </div>
    </div>
  );
}

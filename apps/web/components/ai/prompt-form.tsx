"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Sparkles } from "lucide-react";
import { Button, buttonClasses } from "@/components/ui/button";
import { Alert } from "@/components/ui/primitives";
import { Textarea } from "@/components/ui/field";
import type { GenerationAccess } from "@/lib/usage-limits";

interface PromptFormProps {
  guildId: string;
  quota: GenerationAccess;
  demo: boolean;
}

export function PromptForm({ guildId, quota, demo }: PromptFormProps) {
  const t = useTranslations("ai.new");
  const te = useTranslations("ai.errors");
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

  const disabled = pending || !quota.allowed || prompt.trim().length < 3;

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

      {!quota.allowed && !quota.planRequired ? (
        <Alert variant="warning" title={t("quotaRequired")}>
          <p>{t("quotaRequiredBody", { used: quota.used, limit: quota.limit })}</p>
          <Link href="/dashboard/billing" className={buttonClasses("primary", "sm", "mt-3")}>
            {t("viewPlans")}
          </Link>
        </Alert>
      ) : null}

      <div className="panel p-6">
        <Textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          rows={7}
          maxLength={1200}
          placeholder={t("placeholder")}
          disabled={!quota.allowed}
        />
        <div className="mt-3 flex items-center justify-between text-[12px] text-chalk-500">
          <span className="tabular-nums">{prompt.length} / 1200</span>
          <span>
            {t("quota")}:{" "}
            <strong className="tabular-nums text-spark-200">
              {quota.used} / {quota.limit}
            </strong>
          </span>
        </div>
      </div>

      <div>
        <p className="mono-label mb-3">{t("examples")}</p>
        <div className="flex flex-wrap gap-1.5">
          {(["example1", "example2", "example3", "example4"] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setPrompt(t(key))}
              className="focus-ring inline-flex min-h-[44px] items-center rounded-pill border border-wire px-4 text-[13px] leading-none text-chalk-300 transition-colors duration-150 hover:bg-white/[0.05] hover:text-chalk motion-reduce:transition-none"
            >
              {t(key)}
            </button>
          ))}
        </div>
      </div>

      {error ? <Alert variant="danger">{error}</Alert> : null}

      <div>
        <Button onClick={submit} disabled={disabled} size="lg">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          {pending ? t("generating") : t("generate")}
        </Button>
        <p className="mt-2 text-[12px] leading-relaxed text-chalk-500">{t("generateNote")}</p>
      </div>

      <div className="surface-muted p-4 text-[13px] leading-relaxed text-chalk-400">
        <p className="mono-label mb-3">{t("tips")}</p>
        <ul className="list-inside list-disc space-y-1">
          <li>{t("tip1")}</li>
          <li>{t("tip2")}</li>
          <li>{t("tip3")}</li>
        </ul>
      </div>
    </div>
  );
}

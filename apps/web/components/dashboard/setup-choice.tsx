"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowRight, Blocks, Sparkles } from "lucide-react";
import { buttonClasses, Button } from "@/components/ui/button";
import { Alert, Badge, Card } from "@/components/ui/primitives";

export function SetupChoice({ guildId }: { guildId: string }) {
  const t = useTranslations("dashboard.setup");
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startManual() {
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/blueprints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guildId }),
      });
      const data = (await response.json()) as { blueprintId?: string };
      if (!response.ok || !data.blueprintId) {
        setError(t("createFailed"));
        setPending(false);
        return;
      }
      router.push(`/dashboard/${guildId}/ai/${data.blueprintId}`);
    } catch {
      setError(t("createFailed"));
      setPending(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="flex h-full flex-col">
          <div className="flex items-start justify-between gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-inner bg-spark-500/10">
              <Sparkles className="h-4 w-4 text-spark-300" aria-hidden="true" />
            </span>
            <Badge variant="success">{t("withPlan")}</Badge>
          </div>
          <h2 className="display mt-7 text-[20px] leading-snug text-white">{t("aiTitle")}</h2>
          <p className="mt-3 max-w-[46ch] flex-1 text-[15px] leading-[1.55] text-chalk-400">
            {t("aiBody")}
          </p>
          <Link
            href={`/dashboard/${guildId}/ai/new`}
            className={buttonClasses("primary", "lg", "mt-8 w-full")}
          >
            {t("aiCta")} <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Card>

        <Card className="flex h-full flex-col">
          <div className="flex items-start justify-between gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-inner bg-white/[0.04]">
              <Blocks className="h-4 w-4 text-chalk-300" aria-hidden="true" />
            </span>
            <Badge>{t("free")}</Badge>
          </div>
          <h2 className="display mt-7 text-[20px] leading-snug text-white">{t("manualTitle")}</h2>
          <p className="mt-3 max-w-[46ch] flex-1 text-[15px] leading-[1.55] text-chalk-400">
            {t("manualBody")}
          </p>
          <Button
            variant="secondary"
            size="lg"
            className="mt-8 w-full"
            onClick={startManual}
            disabled={pending}
          >
            {pending ? t("creating") : t("manualCta")}
            {!pending ? <ArrowRight className="h-4 w-4" aria-hidden="true" /> : null}
          </Button>
        </Card>
      </div>

      {error ? <Alert variant="danger">{error}</Alert> : null}
      <p className="text-[13px] leading-relaxed text-chalk-500">{t("note")}</p>
    </div>
  );
}

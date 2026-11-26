"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Coins, Loader2 } from "lucide-react";
import { CREDIT_PACKS } from "@ohnivo/shared";
import { buttonClasses } from "@/components/ui/button";

export function CreditPackPicker({ stripeReady }: { stripeReady: boolean }) {
  const t = useTranslations("ai.billing");
  const locale = useLocale();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currency = locale === "en" ? "CZK" : "Kč";
  const number = new Intl.NumberFormat(locale);

  async function checkout(packId: string) {
    setPending(packId);
    setError(null);
    try {
      const response = await fetch("/api/stripe/credits/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pack: packId }),
      });
      const data = (await response.json()) as { url?: string; error?: { code?: string } };
      if (!response.ok || !data.url) {
        setError(data.error?.code === "stripe_missing" ? t("stripeMissing") : t("error"));
        return;
      }
      window.location.href = data.url;
    } catch {
      setError(t("error"));
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="space-y-3">
      {error ? <p className="text-[13px] text-red-300">{error}</p> : null}
      <div className="grid gap-3 sm:grid-cols-3">
        {CREDIT_PACKS.map((pack) => (
          <div key={pack.id} className="surface flex flex-col p-5">
            <p className="flex items-center gap-2 text-[13px] text-chalk-400">
              <Coins className="h-4 w-4 text-spark-300" aria-hidden="true" />
              {t("packCredits", { count: pack.credits })}
            </p>
            <p className="mt-4 text-[24px] font-medium leading-none tracking-display text-white">
              {number.format(pack.priceCzk)} {currency}
            </p>
            <button
              type="button"
              onClick={() => checkout(pack.id)}
              disabled={!stripeReady || pending !== null}
              className={buttonClasses("secondary", "sm", "mt-5 w-full")}
            >
              {pending === pack.id ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : null}
              {pending === pack.id ? t("buying") : t("buyPack")}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

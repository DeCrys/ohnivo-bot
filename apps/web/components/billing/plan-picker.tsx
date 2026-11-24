"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { PLANS, PLAN_ORDER, type BillingInterval, type PlanId } from "@ohnivo/shared";
import { buttonClasses } from "@/components/ui/button";
import { Badge } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

const FEATURES: Record<PlanId, [string, string, string]> = {
  free: ["freeFeature1", "freeFeature2", "freeFeature3"],
  starter: ["starterFeature1", "starterFeature2", "starterFeature3"],
  premium: ["premiumFeature1", "premiumFeature2", "premiumFeature3"],
  pro: ["proFeature1", "proFeature2", "proFeature3"],
};

export function PlanPicker({
  currentPlan,
  initialInterval = "month",
  stripeReady,
}: {
  currentPlan: PlanId;
  initialInterval?: BillingInterval;
  stripeReady: boolean;
}) {
  const t = useTranslations("marketing.pricing");
  const tb = useTranslations("ai.billing");
  const [interval, setInterval] = useState<BillingInterval>(initialInterval);
  const [pending, setPending] = useState<PlanId | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function checkout(plan: PlanId) {
    if (plan === "free") return;
    setPending(plan);
    setError(null);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, interval }),
      });
      const data = (await response.json()) as { url?: string; error?: { code: string } };
      if (!response.ok || !data.url) {
        setError(data.error?.code === "stripe_missing" ? tb("stripeMissing") : tb("error"));
        return;
      }
      window.location.href = data.url;
    } catch {
      setError(tb("error"));
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <div className="inline-flex items-center rounded-full border border-line bg-ink-900 p-1">
          {(["month", "year"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setInterval(value)}
              className={cn(
                "rounded-full px-4 py-1.5 text-xs font-medium transition-colors",
                interval === value ? "bg-spark-500 text-white" : "text-spark-100/60 hover:text-white",
              )}
            >
              {value === "month" ? t("monthly") : t("yearly")}
              {value === "year" ? (
                <span className="ml-1.5 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] text-emerald-300">
                  {t("save")}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      {error ? <p className="text-center text-xs text-red-300">{error}</p> : null}

      <div className="grid gap-3 lg:grid-cols-4">
        {PLAN_ORDER.map((planId) => {
          const plan = PLANS[planId];
          const price =
            planId === "free" ? 0 : interval === "month" ? plan.priceMonthCzk : plan.priceYearCzk;
          const current = currentPlan === planId;
          return (
            <div
              key={planId}
              className={cn(
                "surface relative flex flex-col p-4",
                plan.recommended && "border-spark-500/50",
                current && "border-emerald-500/40",
              )}
            >
              {plan.recommended ? (
                <Badge variant="soon" className="absolute -top-2.5 left-4">
                  {t("popular")}
                </Badge>
              ) : null}
              <h3 className="text-sm font-semibold capitalize text-white">
                {planId === "free" ? t("freeName") : planId}
              </h3>
              <p className="mt-2 text-2xl font-semibold text-white">
                {price === 0 ? t("freePrice") : `${price.toLocaleString("cs-CZ")} Kč`}
              </p>
              <p className="mt-0.5 text-[11px] text-spark-100/40">
                {price > 0 ? (interval === "month" ? t("perMonth") : t("perYear")) : "—"}
              </p>
              <p className="mt-2 text-[11px] text-spark-300">
                {plan.monthlyCredits > 0
                  ? `${plan.monthlyCredits.toLocaleString("cs-CZ")} ${t("creditsSuffix")}`
                  : t("freeFeature2")}
              </p>
              <ul className="mt-3 flex-1 space-y-1.5">
                {FEATURES[planId].map((key) => (
                  <li key={key} className="flex gap-1.5 text-[11px] text-spark-100/60">
                    <Check className="mt-0.5 h-3 w-3 shrink-0 text-emerald-400" />
                    {t(key)}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => checkout(planId)}
                disabled={current || pending !== null || (planId !== "free" && !stripeReady)}
                className={buttonClasses(
                  plan.recommended && !current ? "primary" : "secondary",
                  "sm",
                  "mt-4 w-full",
                )}
              >
                {pending === planId ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                {current ? t("current") : planId === "free" ? t("freeName") : t("choose")}
              </button>
            </div>
          );
        })}
      </div>
      <p className="text-center text-[11px] text-spark-100/40">{t("vat")}</p>
    </div>
  );
}

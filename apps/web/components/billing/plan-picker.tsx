"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
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
  highlightPlan,
  stripeReady,
}: {
  currentPlan: PlanId;
  initialInterval?: BillingInterval;
  highlightPlan?: PlanId;
  stripeReady: boolean;
}) {
  const t = useTranslations("marketing.pricing");
  const tb = useTranslations("ai.billing");
  const locale = useLocale();
  const [interval, setInterval] = useState<BillingInterval>(initialInterval);
  const [pending, setPending] = useState<PlanId | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currency = locale === "en" ? "CZK" : "Kč";
  const number = new Intl.NumberFormat(locale);

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
      const data = (await response.json()) as { url?: string; error?: { code?: string } };
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
    <div className="space-y-5">
      <div className="flex justify-center">
        <div className="inline-flex items-center rounded-pill border border-wire bg-void-900 p-1">
          {(["month", "year"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setInterval(value)}
              aria-pressed={interval === value}
              className={cn(
                "focus-ring inline-flex min-h-[40px] items-center gap-2 rounded-pill px-4 text-[13px] font-medium leading-none transition-colors duration-150 motion-reduce:transition-none",
                interval === value
                  ? "bg-void-700 text-white"
                  : "text-chalk-400 hover:text-white motion-reduce:transition-none",
              )}
            >
              {value === "month" ? t("monthly") : t("yearly")}
              {value === "year" ? (
                <span className="rounded-pill border border-wire bg-spark-300/10 px-2 py-0.5 text-[11px] text-spark-200">
                  {t("save")}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      {error ? <p className="text-center text-[13px] text-red-300">{error}</p> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {PLAN_ORDER.map((planId) => {
          const plan = PLANS[planId];
          const price =
            planId === "free" ? 0 : interval === "month" ? plan.priceMonthCzk : plan.priceYearCzk;
          const current = planId === currentPlan;
          const featured = plan.recommended || current || highlightPlan === planId;
          return (
            <div
              key={planId}
              className={cn(
                "surface relative flex flex-col p-6 sm:p-7",
                featured && "border-wire shadow-glow",
              )}
            >
              {plan.recommended ? (
                <Badge variant="success" className="absolute right-5 top-5">
                  {t("popular")}
                </Badge>
              ) : null}
              <h3 className="pr-20 text-[18px] font-medium leading-snug text-white">
                {planId === "free" ? t("freeName") : planId}
              </h3>
              <p className="mt-5 text-[28px] font-medium leading-none tracking-display text-white">
                {price === 0 ? t("freePrice") : `${number.format(price)} ${currency}`}
              </p>
              <p className="mt-2 text-[13px] text-chalk-500">
                {price > 0 ? (interval === "month" ? t("perMonth") : t("perYear")) : "—"}
              </p>
              <p className="mt-3 text-[13px] text-spark-200">
                {plan.monthlyGenerations > 0
                  ? t("generationsPerMonth", { count: plan.monthlyGenerations })
                  : t("freeFeature2")}
              </p>
              <p className="mt-1 text-[13px] text-chalk-500">
                {plan.monthlyCredits > 0
                  ? `${number.format(plan.monthlyCredits)} ${t("creditsSuffix")}`
                  : null}
              </p>
              <ul className="mt-5 flex-1 space-y-2.5">
                {FEATURES[planId].map((key) => (
                  <li
                    key={key}
                    className="flex items-start gap-2.5 text-[13px] leading-relaxed text-chalk-400"
                  >
                    <span
                      className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-pill bg-spark-300"
                      aria-hidden="true"
                    />
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
                  "mt-6 w-full",
                )}
              >
                {pending === planId ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                ) : null}
                {current ? t("current") : planId === "free" ? t("freeName") : t("choose")}
              </button>
            </div>
          );
        })}
      </div>
      <p className="text-center text-[12px] text-chalk-500">{t("vat")}</p>
    </div>
  );
}

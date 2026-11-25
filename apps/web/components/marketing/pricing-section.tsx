"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Sparkles } from "lucide-react";
import { PLANS, PLAN_ORDER, type PlanId } from "@ohnivo/shared";
import { buttonClasses } from "@/components/ui/button";
import { Badge, SectionTitle } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

type Interval = "month" | "year";

const FEATURES: Record<PlanId, [string, string, string]> = {
  free: ["freeFeature1", "freeFeature2", "freeFeature3"],
  starter: ["starterFeature1", "starterFeature2", "starterFeature3"],
  premium: ["premiumFeature1", "premiumFeature2", "premiumFeature3"],
  pro: ["proFeature1", "proFeature2", "proFeature3"],
};

export function PricingSection() {
  const t = useTranslations("marketing.pricing");
  const [interval, setInterval] = useState<Interval>("month");

  return (
    <section id="cenik" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
      <SectionTitle eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} align="center" />

      <div className="mt-8 flex justify-center">
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

      <div className="mt-10 grid gap-4 lg:grid-cols-4">
        {PLAN_ORDER.map((planId) => {
          const plan = PLANS[planId];
          const price = planId === "free" ? 0 : interval === "month" ? plan.priceMonthCzk : plan.priceYearCzk;
          return (
            <div
              key={planId}
              className={cn(
                "surface relative flex flex-col p-5",
                plan.recommended && "border-spark-500/50 shadow-glow",
              )}
            >
              {plan.recommended ? (
                <Badge variant="soon" className="absolute -top-2.5 left-5">
                  {t("popular")}
                </Badge>
              ) : null}
              <h3 className="text-lg font-semibold capitalize text-white">
                {planId === "free" ? t("freeName") : planId}
              </h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-semibold text-white">
                  {price === 0 ? t("freePrice") : `${price.toLocaleString("cs-CZ")} Kč`}
                </span>
                {price > 0 ? (
                  <span className="text-xs text-spark-100/45">
                    {interval === "month" ? t("perMonth") : t("perYear")}
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-xs text-spark-300">
                {plan.monthlyCredits > 0
                  ? `${plan.monthlyCredits.toLocaleString("cs-CZ")} ${t("creditsSuffix")}`
                  : t("freeFeature2")}
              </p>
              <ul className="mt-5 flex-1 space-y-2.5">
                {FEATURES[planId].map((key) => (
                  <li key={key} className="flex gap-2 text-sm text-spark-100/65">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                    {t(key)}
                  </li>
                ))}
              </ul>
              <Link
                href={`/dashboard/billing?plan=${planId}&interval=${interval}`}
                className={buttonClasses(
                  plan.recommended ? "primary" : "secondary",
                  "md",
                  "mt-6 w-full",
                )}
              >
                {planId === "free" ? t("loginToChoose") : t("choose")}
              </Link>
            </div>
          );
        })}
      </div>
      <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs text-spark-100/40">
        <Sparkles className="h-3 w-3" /> {t("vat")}
      </p>
      <div className="mt-4 flex justify-center">
        <Link
          href="/pricing"
          className="text-xs font-medium text-spark-300 underline decoration-spark-300/30 underline-offset-4 transition-colors hover:text-spark-200"
        >
          {t("detailCta")}
        </Link>
      </div>
    </section>
  );
}

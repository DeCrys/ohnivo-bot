"use client";

import Link from "next/link";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { CREDIT_COSTS, PLANS, type BillingInterval, type PlanId } from "@ohnivo/shared";
import { buttonClasses } from "@/components/ui/button";
import { Badge } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

const PAID_PLANS: PlanId[] = ["starter", "premium", "pro"];

const LEAD_KEY: Record<PlanId, string> = {
  free: "freeLead",
  starter: "starterLead",
  premium: "premiumLead",
  pro: "proLead",
};

/** What every paid plan includes - the plans differ only in credit volume. */
const PAID_FEATURES = ["includedAi", "includedGraphics", "includedLiveBuild"] as const;

function formatCzk(value: number, locale: string): string {
  const formatted = value.toLocaleString(locale === "cs" ? "cs-CZ" : "en-US");
  return locale === "cs" ? `${formatted} Kč` : `${formatted} CZK`;
}

export function PricingPlans() {
  const t = useTranslations("marketing.pricingPage");
  const tp = useTranslations("marketing.pricing");
  const locale = useLocale();
  const [interval, setInterval] = useState<BillingInterval>("month");
  const topCredits = PLANS.pro.monthlyCredits;

  return (
    <section id="plans" className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:pb-24">
      <div className="surface-muted flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-white">{t("freeTitle")}</h3>
            <Badge variant="default">{tp("freePrice")}</Badge>
          </div>
          <p className="mt-1 max-w-xl text-sm text-spark-100/60">{t("freeLead")}</p>
        </div>
        <Link href="/login" className={buttonClasses("secondary", "md", "shrink-0")}>
          {t("freeCta")}
        </Link>
      </div>

      <div className="mt-10 flex flex-col items-center gap-3">
        <div
          role="group"
          aria-label={t("billingLabel")}
          className="inline-flex items-center rounded-full border border-line bg-ink-900 p-1"
        >
          {(["month", "year"] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={interval === value}
              onClick={() => setInterval(value)}
              className={cn(
                "rounded-full px-4 py-1.5 text-xs font-medium transition-colors",
                interval === value ? "bg-spark-500 text-white" : "text-spark-100/60 hover:text-white",
              )}
            >
              {value === "month" ? t("monthly") : t("yearly")}
              {value === "year" ? (
                <span className="ml-1.5 rounded-full bg-ember-500/15 px-1.5 py-0.5 text-[10px] text-ember-400">
                  {t("yearlyBadge")}
                </span>
              ) : null}
            </button>
          ))}
        </div>
        <p className="text-xs text-spark-100/40">{t("conversionHint")}</p>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        {PAID_PLANS.map((planId) => {
          const plan = PLANS[planId];
          const price = interval === "month" ? plan.priceMonthCzk : plan.priceYearCzk;
          const drafts = Math.floor(plan.monthlyCredits / CREDIT_COSTS.generate);
          const yearlySaving = plan.priceMonthCzk * 12 - plan.priceYearCzk;
          const featured = Boolean(plan.recommended);

          return (
            <div
              key={planId}
              className={cn(
                "surface relative flex flex-col p-6",
                featured && "border-spark-500/60 shadow-glow",
              )}
            >
              {featured ? (
                <Badge variant="soon" className="absolute -top-2.5 left-6">
                  {t("recommended")}
                </Badge>
              ) : null}

              <h3 className="text-lg font-semibold capitalize text-white">{planId}</h3>
              <p className="mt-1 text-sm text-spark-100/55">{t(LEAD_KEY[planId])}</p>

              <div className="mt-6 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="text-4xl font-semibold tabular-nums tracking-tight text-white">
                  {formatCzk(price, locale)}
                </span>
                <span className="text-xs text-spark-100/45">
                  {interval === "month" ? t("perMonth") : t("perYear")}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-spark-100/35">{t("priceNote")}</p>
              {interval === "year" ? (
                <p className="mt-2 text-xs text-emerald-300">
                  {t("yearlySaving", { amount: formatCzk(yearlySaving, locale) })}
                </p>
              ) : null}

              <div className="mt-6 border-t border-line/60 pt-5">
                <p className="text-sm font-medium text-spark-100">
                  {t("creditsPerMonth", { count: plan.monthlyCredits })}
                </p>
                <p className="mt-0.5 text-xs text-spark-100/50">
                  {t("draftsCount", { count: drafts })}
                </p>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-ink-700" aria-hidden="true">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-spark-500 to-ember-500 transition-[width] duration-300 ease-out motion-reduce:transition-none"
                    style={{ width: `${Math.round((plan.monthlyCredits / topCredits) * 100)}%` }}
                  />
                </div>
              </div>

              <ul className="mt-5 flex-1 space-y-2.5">
                {PAID_FEATURES.map((key) => (
                  <li key={key} className="flex gap-2 text-sm text-spark-100/65">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
                    {t(key)}
                  </li>
                ))}
                <li className="flex gap-2 text-sm text-spark-100/65">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
                  {t("rowSubscription")}
                </li>
              </ul>

              <Link
                href={`/dashboard/billing?plan=${planId}&interval=${interval}`}
                className={buttonClasses(featured ? "primary" : "secondary", "md", "mt-6 w-full")}
              >
                {t("choose")}
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}

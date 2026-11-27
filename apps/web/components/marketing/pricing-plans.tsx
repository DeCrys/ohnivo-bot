"use client";

import Link from "next/link";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { PLANS, type BillingInterval, type PlanId } from "@ohnivo/shared";
import { ArrowRight, Section } from "@/components/marketing/ui";
import { cn } from "@/lib/utils";

const PAID_PLANS: PlanId[] = ["starter", "premium", "pro"];

const LEAD_KEY: Record<PlanId, string> = {
  free: "freeLead",
  starter: "starterLead",
  premium: "premiumLead",
  pro: "proLead",
};

/** What every paid plan includes - plans differ in monthly generation quota and credit volume. */
const PAID_FEATURES = ["includedAi", "includedGraphics", "includedLiveBuild"] as const;

function formatCzk(value: number, locale: string): string {
  const formatted = value.toLocaleString(locale === "cs" ? "cs-CZ" : "en-US");
  return locale === "cs" ? `${formatted} Kč` : `${formatted} CZK`;
}

function billingHref(plan: PlanId, interval: BillingInterval): string {
  const target = `/dashboard/billing?plan=${plan}&interval=${interval}`;
  return `/login?next=${encodeURIComponent(target)}`;
}

export function PricingPlans() {
  const t = useTranslations("marketing.pricingPage");
  const locale = useLocale();
  const [interval, setInterval] = useState<BillingInterval>("month");
  const topCredits = PLANS.pro.monthlyCredits;

  return (
    <Section id="plans">
      <div className="pad flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <h2 className="tag">{t("freeTitle")}</h2>
          <p className="text-[15px] leading-relaxed text-chalk-2">{t("freeLead")}</p>
        </div>
        <Link
          href="/login"
          className="focus-ring inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-control text-[13px] text-white transition-colors hover:text-spark-200 motion-reduce:transition-none"
        >
          <span className="link-rule py-1">{t("freeCta")}</span>
          <ArrowRight />
        </Link>
      </div>

      <div className="pad flex flex-wrap items-center justify-between gap-4 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <div
            role="group"
            aria-label={t("billingLabel")}
            className="inline-flex items-center rounded-pill border border-wire bg-void-900 p-1"
          >
            {(["month", "year"] as const).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={interval === value}
                onClick={() => setInterval(value)}
                className={cn(
                  "focus-ring inline-flex h-10 min-w-[44px] items-center justify-center rounded-pill px-4 text-[13px] font-medium leading-none transition-colors duration-150 motion-reduce:transition-none",
                  interval === value ? "bg-void-700 text-white" : "text-chalk-400 hover:text-white",
                )}
              >
                {value === "month" ? t("monthly") : t("yearly")}
              </button>
            ))}
          </div>
          {interval === "year" ? <span className="tag-accent">{t("yearlyBadge")}</span> : null}
        </div>
        <p className="text-[13px] leading-relaxed text-chalk-500">{t("conversionHint")}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {PAID_PLANS.map((planId) => {
          const plan = PLANS[planId];
          const price = interval === "month" ? plan.priceMonthCzk : plan.priceYearCzk;
          const drafts = plan.monthlyGenerations;
          const yearlySaving = plan.priceMonthCzk * 12 - plan.priceYearCzk;
          const featured = Boolean(plan.recommended);

          return (
            <div
              key={planId}
              className={cn(
                "surface flex flex-col p-6 sm:p-8",
                featured && "border-wire shadow-glow",
              )}
            >
              <div className="flex min-h-[28px] items-center justify-between gap-2">
                <h3 className="text-[18px] font-medium leading-snug text-white">{planId}</h3>
                {featured ? <span className="tag-accent">{t("recommended")}</span> : null}
              </div>

              <p className="mt-8 text-[40px] font-medium leading-none tracking-display text-white">
                {formatCzk(price, locale)}
              </p>
              <p className="mt-3 text-[13px] text-chalk-500">
                {interval === "month" ? t("perMonth") : t("perYear")} · {t("priceNote")}
              </p>
              {interval === "year" ? (
                <p className="mt-2 text-[13px] text-spark-200">
                  {t("yearlySaving", { amount: formatCzk(yearlySaving, locale) })}
                </p>
              ) : null}

              <p className="mt-6 text-[15px] leading-relaxed text-chalk-400">
                {t(LEAD_KEY[planId])}
              </p>

              <div className="mt-7">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <p className="text-[15px] text-white">
                    {t("creditsPerMonth", { count: plan.monthlyCredits })}
                  </p>
                  <p className="text-[13px] text-chalk-400">
                    {t("draftsCount", { count: drafts })}
                  </p>
                </div>
                <div
                  className="mt-4 h-1.5 w-full overflow-hidden rounded-pill bg-white/5"
                  aria-hidden="true"
                >
                  <div
                    className={cn(
                      "h-full rounded-pill transition-[width] duration-300 ease-out motion-reduce:transition-none",
                      featured ? "bg-spark-300" : "bg-chalk-400",
                    )}
                    style={{ width: `${Math.round((plan.monthlyCredits / topCredits) * 100)}%` }}
                  />
                </div>
              </div>

              <ul className="mt-6 flex-1 space-y-2.5">
                {[...PAID_FEATURES, "rowSubscription" as const].map((key) => (
                  <li key={key} className="flex gap-2.5 text-[14px] leading-relaxed text-chalk-400">
                    <span
                      className={cn(
                        "mt-[9px] h-1.5 w-1.5 shrink-0 rounded-pill",
                        featured ? "bg-spark-300" : "bg-wire-strong",
                      )}
                      aria-hidden="true"
                    />
                    {t(key)}
                  </li>
                ))}
              </ul>

              <Link
                href={billingHref(planId, interval)}
                className={cn(
                  "focus-ring mt-8 inline-flex h-12 items-center justify-center",
                  featured ? "btn-hatch" : "btn-wire w-full",
                )}
              >
                {t("choose")}
              </Link>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

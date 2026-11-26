"use client";

import Link from "next/link";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CREDIT_COSTS, PLANS, type BillingInterval, type PlanId } from "@ohnivo/shared";
import { ArrowUpRight } from "@/components/marketing/ui";
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
    <section id="plans" className="shell scroll-mt-24 pb-16 lg:pb-24">
      <div className="flex flex-col gap-4 border border-graphite/15 bg-paper-sand/50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <h3 className="display text-2xl text-graphite">{t("freeTitle")}</h3>
          <p className="font-mono text-[11px] uppercase tracking-label text-graphite/50">
            {t("freeLead")}
          </p>
        </div>
        <Link
          href="/login"
          className="link-rule shrink-0 font-mono text-[11px] uppercase tracking-label text-graphite hover:text-spark-600"
        >
          {t("freeCta")} →
        </Link>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-b border-graphite/15 pb-4">
        <div role="group" aria-label={t("billingLabel")} className="flex items-center gap-5">
          {(["month", "year"] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={interval === value}
              onClick={() => setInterval(value)}
              className={cn(
                "focus-ring font-mono text-[11px] uppercase tracking-label transition-colors",
                interval === value
                  ? "text-graphite underline decoration-1 underline-offset-[6px]"
                  : "text-graphite/60 hover:text-graphite",
              )}
            >
              {value === "month" ? t("monthly") : t("yearly")}
            </button>
          ))}
          {interval === "year" ? (
            <span className="bg-acid px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-label text-graphite">
              {t("yearlyBadge")}
            </span>
          ) : null}
        </div>
        <p className="font-mono text-[11px] uppercase tracking-label text-graphite/60">
          {t("conversionHint")}
        </p>
      </div>

      <div className="grid gap-px border-x border-b border-graphite/15 bg-graphite/15 lg:grid-cols-3">
        {PAID_PLANS.map((planId) => {
          const plan = PLANS[planId];
          const price = interval === "month" ? plan.priceMonthCzk : plan.priceYearCzk;
          const drafts = Math.floor(plan.monthlyCredits / CREDIT_COSTS.generate);
          const yearlySaving = plan.priceMonthCzk * 12 - plan.priceYearCzk;
          const featured = Boolean(plan.recommended);

          return (
            <div
              key={planId}
              className={cn("flex flex-col bg-paper p-5 lg:p-7", featured && "bg-lilac/35")}
            >
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="font-mono text-[11px] uppercase tracking-label text-graphite/70">
                  {planId}
                </h3>
                {featured ? (
                  <span className="bg-graphite px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-label text-paper">
                    {t("recommended")}
                  </span>
                ) : null}
              </div>

              <p className="display mt-6 text-[clamp(2.4rem,4vw,3.2rem)] leading-none text-graphite">
                {formatCzk(price, locale)}
              </p>
              <p className="mt-2 font-mono text-[11px] uppercase tracking-label text-graphite/60">
                {interval === "month" ? t("perMonth") : t("perYear")} · {t("priceNote")}
              </p>
              {interval === "year" ? (
                <p className="mt-1 font-mono text-[11px] text-graphite-500">
                  {t("yearlySaving", { amount: formatCzk(yearlySaving, locale) })}
                </p>
              ) : null}

              <p className="mt-5 text-[15px] leading-relaxed text-graphite-500">
                {t(LEAD_KEY[planId])}
              </p>

              <div className="mt-6 border-t border-graphite/15 pt-4">
                <p className="text-[14px] font-medium text-graphite">
                  {t("creditsPerMonth", { count: plan.monthlyCredits })}
                </p>
                <p className="mt-0.5 font-mono text-[11px] text-graphite-500">
                  {t("draftsCount", { count: drafts })}
                </p>
                <div className="mt-3 h-px w-full bg-graphite/20" aria-hidden="true">
                  <div
                    className="h-px bg-graphite transition-[width] duration-300 ease-out motion-reduce:transition-none"
                    style={{ width: `${Math.round((plan.monthlyCredits / topCredits) * 100)}%` }}
                  />
                </div>
              </div>

              <ul className="mt-5 flex-1 space-y-2">
                {PAID_FEATURES.map((key) => (
                  <li key={key} className="flex gap-2 text-[13px] leading-relaxed text-graphite-500">
                    <span className="mt-[7px] h-px w-3 shrink-0 bg-graphite/40" aria-hidden="true" />
                    {t(key)}
                  </li>
                ))}
                <li className="flex gap-2 text-[13px] leading-relaxed text-graphite-500">
                  <span className="mt-[7px] h-px w-3 shrink-0 bg-graphite/40" aria-hidden="true" />
                  {t("rowSubscription")}
                </li>
              </ul>

              <Link
                href={billingHref(planId, interval)}
                className={cn(
                  "focus-ring group mt-6 inline-flex h-12 items-center justify-between gap-2 border px-4 font-mono text-[11px] uppercase tracking-label transition-colors",
                  featured
                    ? "border-graphite bg-graphite text-paper hover:bg-spark-600"
                    : "border-graphite/30 text-graphite hover:border-graphite hover:bg-graphite hover:text-paper",
                )}
              >
                {t("choose")}
                <ArrowUpRight className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transition-none" />
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}

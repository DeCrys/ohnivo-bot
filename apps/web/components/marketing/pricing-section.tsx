"use client";

import Link from "next/link";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { PLANS, PLAN_ORDER, type BillingInterval, type PlanId } from "@ohnivo/shared";
import { SectionHeader } from "@/components/marketing/ui";
import { cn } from "@/lib/utils";

const FEATURES: Record<PlanId, [string, string, string]> = {
  free: ["freeFeature1", "freeFeature2", "freeFeature3"],
  starter: ["starterFeature1", "starterFeature2", "starterFeature3"],
  premium: ["premiumFeature1", "premiumFeature2", "premiumFeature3"],
  pro: ["proFeature1", "proFeature2", "proFeature3"],
};

function formatCzk(value: number, locale: string): string {
  const formatted = value.toLocaleString(locale === "cs" ? "cs-CZ" : "en-US");
  return locale === "cs" ? `${formatted} Kč` : `${formatted} CZK`;
}

/** Unauthenticated CTA keeps the chosen plan and interval through the login redirect. */
function billingHref(plan: PlanId, interval: BillingInterval): string {
  const target = `/dashboard/billing?plan=${plan}&interval=${interval}`;
  return `/login?next=${encodeURIComponent(target)}`;
}

export function PricingSection() {
  const t = useTranslations("marketing.pricing");
  const tp = useTranslations("marketing.pricingPage");
  const locale = useLocale();
  const [interval, setInterval] = useState<BillingInterval>("month");

  return (
    <section id="cenik" className="border-t border-graphite/15 bg-paper-deep/50">
      <div className="shell scroll-mt-24 py-16 lg:py-24">
        <SectionHeader
          index="04"
          label={t("eyebrow")}
          title={t("title")}
          lead={t("subtitle")}
        />

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-b border-graphite/15 pb-4">
          <div role="group" aria-label={tp("billingLabel")} className="flex items-center gap-5">
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
          </div>
          <p className="font-mono text-[11px] uppercase tracking-label text-graphite/60">
            {interval === "year" ? t("save") : t("creditsSuffix")}
          </p>
        </div>

        <div className="grid gap-px border-x border-b border-graphite/15 bg-graphite/15 sm:grid-cols-2 lg:grid-cols-4">
          {PLAN_ORDER.map((planId) => {
            const plan = PLANS[planId];
            const free = planId === "free";
            const featured = Boolean(plan.recommended);
            const price = interval === "month" ? plan.priceMonthCzk : plan.priceYearCzk;

            return (
              <div
                key={planId}
                className={cn(
                  "flex flex-col bg-paper p-5 lg:p-6",
                  featured && "bg-lilac/35",
                )}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="font-mono text-[11px] uppercase tracking-label text-graphite/70">
                    {free ? t("freeName") : planId}
                  </h3>
                  {featured ? (
                    <span className="bg-graphite px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-label text-paper">
                      {t("popular")}
                    </span>
                  ) : null}
                </div>

                <p className="display mt-6 text-[2.6rem] leading-none text-graphite">
                  {free ? t("freePrice") : formatCzk(price, locale)}
                </p>
                <p className="mt-2 font-mono text-[11px] uppercase tracking-label text-graphite/60">
                  {free ? t("freeNote") : interval === "month" ? tp("perMonth") : tp("perYear")}
                </p>

                <p className="mt-6 border-t border-graphite/15 pt-4 text-[13px] leading-relaxed text-graphite-500">
                  {free
                    ? t("freeParagraph")
                    : tp("creditsPerMonth", { count: plan.monthlyCredits })}
                </p>

                <ul className="mt-4 flex-1 space-y-2">
                  {FEATURES[planId].map((key) => (
                    <li key={key} className="flex gap-2 text-[13px] leading-relaxed text-graphite-500">
                      <span className="mt-[7px] h-px w-3 shrink-0 bg-graphite/40" aria-hidden="true" />
                      {t(key)}
                    </li>
                  ))}
                </ul>

                <Link
                  href={free ? "/login" : billingHref(planId, interval)}
                  className={cn(
                    "focus-ring mt-6 inline-flex h-11 items-center justify-between gap-2 border px-3 font-mono text-[11px] uppercase tracking-label transition-colors",
                    featured
                      ? "border-graphite bg-graphite text-paper hover:bg-spark-600"
                      : "border-graphite/30 text-graphite hover:border-graphite hover:bg-graphite hover:text-paper",
                  )}
                >
                  {t("choose")}
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="font-mono text-[11px] leading-relaxed text-graphite-500">{t("vat")}</p>
          <Link
            href="/pricing"
            className="link-rule font-mono text-[11px] uppercase tracking-label text-graphite-500 hover:text-graphite"
          >
            {t("detailCta")} →
          </Link>
        </div>
      </div>
    </section>
  );
}

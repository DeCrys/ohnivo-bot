"use client";

import Link from "next/link";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { PLANS, PLAN_ORDER, type BillingInterval, type PlanId } from "@ohnivo/shared";
import { ArrowRight, Section, SectionHeader } from "@/components/marketing/ui";
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
    <Section id="cenik">
      <SectionHeader index="03" label={t("eyebrow")} title={t("title")} lead={t("subtitle")} />

      <div className="pad flex flex-wrap items-center justify-between gap-4 py-4">
        <div
          role="group"
          aria-label={tp("billingLabel")}
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
        {interval === "year" ? (
          <p className="text-[13px] text-spark-200">{t("save")}</p>
        ) : (
          <p className="text-[13px] leading-relaxed text-chalk-400">{tp("conversionHint")}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PLAN_ORDER.map((planId) => {
          const plan = PLANS[planId];
          const free = planId === "free";
          const featured = Boolean(plan.recommended);
          const price = interval === "month" ? plan.priceMonthCzk : plan.priceYearCzk;

          return (
            <div
              key={planId}
              className={cn(
                "surface flex flex-col p-6 sm:p-8",
                featured && "border-wire shadow-glow",
              )}
            >
              <div className="flex min-h-[28px] items-center justify-between gap-2">
                <h3 className="text-[18px] font-medium leading-snug text-white">
                  {free ? t("freeName") : planId}
                </h3>
                {featured ? <span className="tag-accent">{t("popular")}</span> : null}
              </div>

              <p className="mt-8 text-[40px] font-medium leading-none tracking-display text-white">
                {free ? t("freePrice") : formatCzk(price, locale)}
              </p>
              <p className="mt-3 text-[13px] text-chalk-500">
                {free ? t("freeNote") : interval === "month" ? tp("perMonth") : tp("perYear")}
              </p>

              <p className="mt-6 text-[15px] leading-relaxed text-chalk-2">
                {free ? t("freeParagraph") : tp("creditsPerMonth", { count: plan.monthlyCredits })}
              </p>

              <ul className="mt-5 flex-1 space-y-2.5">
                {FEATURES[planId].map((key) => (
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
                href={free ? "/login" : billingHref(planId, interval)}
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

      <div className="pad flex flex-wrap items-center justify-between gap-x-6 gap-y-1 py-3">
        <p className="text-[12px] leading-relaxed text-chalk-500">{t("vat")}</p>
        <Link
          href="/pricing"
          className="focus-ring inline-flex min-h-[44px] items-center gap-2 rounded-control text-[13px] text-chalk-2 transition-colors hover:text-white motion-reduce:transition-none"
        >
          <span className="link-rule py-1">{t("detailCta")}</span>
          <ArrowRight />
        </Link>
      </div>
    </Section>
  );
}

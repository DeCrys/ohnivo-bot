import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { CREDIT_COSTS } from "@ohnivo/shared";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { PricingPlans } from "@/components/marketing/pricing-plans";
import { PricingLedger } from "@/components/marketing/pricing-ledger";
import { PricingFaq } from "@/components/marketing/pricing-faq";
import { ArrowUpRight } from "@/components/marketing/ui";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("marketing.pricingPage");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: { canonical: "/pricing" },
  };
}

export default async function PricingPage() {
  const t = await getTranslations("marketing.pricingPage");

  const costs = [
    { label: t("costGenerate"), value: CREDIT_COSTS.generate },
    { label: t("costRefine"), value: CREDIT_COSTS.refine },
    { label: t("costApply"), value: CREDIT_COSTS.apply },
  ];

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>
        <section className="shell">
          <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-graphite/15 py-4">
            <p className="mono-label text-graphite/70">{t("heroEyebrow")}</p>
            <p className="mono-label text-graphite/60">{t("heroNote")}</p>
          </div>

          <div className="grid gap-10 pb-14 pt-10 lg:grid-cols-[minmax(0,1fr)_25rem] lg:gap-16 lg:pb-16 lg:pt-14">
            <h1 className="display max-w-[20ch] text-balance text-[clamp(2.4rem,5.6vw,4.8rem)] leading-[0.98] text-graphite">
              {t("heroTitle")}
            </h1>
            <div className="flex flex-col justify-end">
              <p className="max-w-sm text-[17px] leading-relaxed text-graphite-500">
                {t("heroSubtitle")}
              </p>
              <Link
                href="/login"
                className="focus-ring group mt-7 inline-flex h-12 w-fit items-center gap-3 bg-graphite px-5 font-mono text-[11px] uppercase tracking-label text-paper transition-colors hover:bg-spark-600"
              >
                {t("heroCta")}
                <ArrowUpRight className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transition-none" />
              </Link>
            </div>
          </div>

          <div className="grid border-y border-graphite/15 sm:grid-cols-3">
            {costs.map((cost, index) => (
              <div
                key={cost.label}
                className={
                  index === 0
                    ? "py-5 sm:pr-6"
                    : "border-t border-graphite/15 py-5 sm:border-l sm:border-t-0 sm:pl-6"
                }
              >
                <p className="mono-label text-graphite/60">{cost.label}</p>
                <p className="display mt-3 text-[2rem] leading-none text-graphite">
                  {cost.value}
                  <span className="ml-2 font-mono text-[11px] uppercase tracking-label text-graphite/60">
                    {t("creditsUnit")}
                  </span>
                </p>
              </div>
            ))}
          </div>
        </section>

        <div className="pt-14 lg:pt-20">
          <PricingPlans />
        </div>
        <PricingLedger />
        <PricingFaq />

        <section className="shell pb-16 lg:pb-24">
          <div className="panel-ink border border-graphite/20 px-6 py-12 sm:px-10 lg:px-14 lg:py-16">
            <p className="mono-label text-spark-100/40">/ 04</p>
            <h2 className="display mt-4 max-w-[22ch] text-balance text-[clamp(2rem,4vw,3.4rem)] leading-[1] text-spark-50">
              {t("ctaTitle")}
            </h2>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-spark-100/60">
              {t("ctaSubtitle")}
            </p>
            <Link
              href="/login"
              className="focus-ring group mt-8 inline-flex h-12 items-center gap-3 bg-paper px-6 font-mono text-[11px] uppercase tracking-label text-graphite transition-colors hover:bg-lilac"
            >
              {t("ctaButton")}
              <ArrowUpRight className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transition-none" />
            </Link>
            <p className="mt-6 font-mono text-[11px] text-spark-100/35">{t("ctaNote")}</p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { CREDIT_COSTS } from "@ohnivo/shared";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { PricingPlans } from "@/components/marketing/pricing-plans";
import { PricingLedger } from "@/components/marketing/pricing-ledger";
import { PricingFaq } from "@/components/marketing/pricing-faq";
import { buttonClasses } from "@/components/ui/button";

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
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 grid-bg" aria-hidden="true" />
          <div className="relative mx-auto max-w-6xl px-4 pb-12 pt-14 sm:px-6 lg:pb-16 lg:pt-20">
            <p className="text-sm font-medium text-ember-400">{t("heroEyebrow")}</p>
            <h1 className="mt-4 max-w-3xl text-balance text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              {t("heroTitle")}
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-spark-100/70 sm:text-base">
              {t("heroSubtitle")}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link href="/login" className={buttonClasses("primary", "lg")}>
                {t("heroCta")}
              </Link>
              <span className="text-xs text-spark-100/40">{t("heroNote")}</span>
            </div>

            <dl className="mt-12 grid max-w-2xl grid-cols-1 gap-6 sm:grid-cols-3">
              {costs.map((cost) => (
                <div key={cost.label} className="border-l border-line/70 pl-4">
                  <dt className="text-xs text-spark-100/45">{cost.label}</dt>
                  <dd className="mt-1 text-lg font-semibold tabular-nums text-white">
                    {t("credits", { count: cost.value })}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <PricingPlans />
        <PricingLedger />
        <PricingFaq />

        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
          <div className="surface relative overflow-hidden p-8 text-center sm:p-12">
            <h2 className="text-balance text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              {t("ctaTitle")}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-spark-100/65">
              {t("ctaSubtitle")}
            </p>
            <Link href="/login" className={buttonClasses("primary", "lg", "mt-7")}>
              {t("ctaButton")}
            </Link>
            <p className="mt-4 text-xs text-spark-100/35">{t("ctaNote")}</p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

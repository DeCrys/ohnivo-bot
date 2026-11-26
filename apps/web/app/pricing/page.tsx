import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { CREDIT_COSTS } from "@ohnivo/shared";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { PricingPlans } from "@/components/marketing/pricing-plans";
import { PricingLedger } from "@/components/marketing/pricing-ledger";
import { PricingFaq } from "@/components/marketing/pricing-faq";
import { CtaBand, Section } from "@/components/marketing/ui";

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
    { label: t("costGenerate"), value: t("costGenerateValue") },
    { label: t("costRefine"), value: `${CREDIT_COSTS.refine} ${t("creditsUnit")}` },
    { label: t("costApply"), value: t("costApplyValue") },
  ];

  return (
    <div className="blueprint">
      <SiteHeader />
      <main>
        <Section>
          <div className="pad flex flex-col items-center pb-16 pt-16 text-center lg:pb-24 lg:pt-24">
            <p className="tag">{t("heroEyebrow")}</p>
            <h1 className="display mt-7 max-w-[18ch] text-balance text-[clamp(2.25rem,5.4vw,4.25rem)] leading-[1.02]">
              {t("heroTitle")}
            </h1>
            <p className="mt-6 max-w-[36rem] text-[17px] leading-relaxed text-chalk-400">
              {t("heroSubtitle")}
            </p>
            <Link href="/login" className="btn-hatch focus-ring mt-9">
              {t("heroCta")}
            </Link>
            <p className="mt-5 text-[13px] leading-relaxed text-chalk-500">
              {t("heroNote")}
            </p>
          </div>

          <dl className="grid gap-4 sm:grid-cols-3">
            {costs.map((cost, index) => (
              <div key={cost.label} className="surface p-6 sm:p-7">
                <dt className="flex items-center gap-3 text-[13px] text-chalk-muted">
                  <span className="text-chalk-500">{String(index + 1).padStart(2, "0")}</span>
                  {cost.label}
                </dt>
                <dd className="mt-5 text-[26px] font-medium leading-none tracking-display text-white">
                  {cost.value}
                </dd>
              </div>
            ))}
          </dl>
        </Section>

        <PricingPlans />
        <PricingLedger />
        <PricingFaq />

        <CtaBand
          title={t("ctaTitle")}
          body={t("ctaSubtitle")}
          button={t("ctaButton")}
          href="/login"
          note={t("ctaNote")}
        />
      </main>
      <SiteFooter />
    </div>
  );
}

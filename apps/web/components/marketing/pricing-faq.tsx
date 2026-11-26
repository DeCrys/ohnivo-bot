import { getTranslations } from "next-intl/server";
import { SectionHeader } from "@/components/marketing/ui";

const ITEMS = ["faq1", "faq2", "faq3", "faq4", "faq5", "faq6"] as const;

export async function PricingFaq() {
  const t = await getTranslations("marketing.pricingPage");
  const tf = await getTranslations("marketing.faq");

  return (
    <section id="faq" className="shell scroll-mt-24 pb-16 lg:pb-24">
      <SectionHeader index="03" label={t("faqTitle")} title={t("faqSubtitle")} />

      <div className="mt-10 border-t border-graphite/15">
        {ITEMS.map((item) => (
          <details key={item} className="group border-b border-graphite/15">
            <summary className="focus-ring flex cursor-pointer list-none items-baseline justify-between gap-6 py-6 [&::-webkit-details-marker]:hidden">
              <span className="display max-w-[46ch] text-[clamp(1.15rem,1.9vw,1.55rem)] leading-snug text-graphite">
                {t(`${item}q`)}
              </span>
              <span className="mono-label shrink-0 text-graphite/60 group-open:hidden">
                /{tf("show")}
              </span>
              <span className="mono-label hidden shrink-0 text-graphite/60 group-open:inline">
                /{tf("hide")}
              </span>
            </summary>
            <p className="max-w-2xl pb-6 text-[15px] leading-relaxed text-graphite-500">
              {t(`${item}a`)}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}

import { getTranslations } from "next-intl/server";
import { ChevronDown } from "lucide-react";

const ITEMS = ["faq1", "faq2", "faq3", "faq4", "faq5", "faq6"] as const;

export async function PricingFaq() {
  const t = await getTranslations("marketing.pricingPage");

  return (
    <section id="faq" className="mx-auto max-w-3xl px-4 pb-16 sm:px-6 lg:pb-24">
      <h2 className="text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">
        {t("faqTitle")}
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-spark-100/70">{t("faqSubtitle")}</p>

      <div className="mt-8 space-y-2">
        {ITEMS.map((item) => (
          <details
            key={item}
            className="group rounded-xl border border-line/70 bg-ink-850/70 px-5 py-4 open:border-spark-500/30"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium text-white">
              {t(`${item}q`)}
              <ChevronDown
                className="h-4 w-4 shrink-0 text-spark-300 transition-transform group-open:rotate-180"
                aria-hidden="true"
              />
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-spark-100/60">{t(`${item}a`)}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

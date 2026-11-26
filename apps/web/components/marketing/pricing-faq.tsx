import { getTranslations } from "next-intl/server";
import { FaqList, Section, SectionHeader } from "@/components/marketing/ui";

const ITEMS = ["faq1", "faq2", "faq3", "faq4", "faq5", "faq6"] as const;

export async function PricingFaq() {
  const t = await getTranslations("marketing.pricingPage");
  const tf = await getTranslations("marketing.faq");

  return (
    <Section id="faq">
      <SectionHeader index="03" label={t("faqTitle")} title={t("faqSubtitle")} />
      <FaqList
        items={ITEMS.map((item) => ({ question: t(`${item}q`), answer: t(`${item}a`) }))}
        show={tf("show")}
        hide={tf("hide")}
      />
    </Section>
  );
}

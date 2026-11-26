import { getTranslations } from "next-intl/server";
import { FaqList, Section, SectionHeader } from "@/components/marketing/ui";

const ITEMS = [
  ["q1", "a1"],
  ["q2", "a2"],
  ["q3", "a3"],
  ["q4", "a4"],
  ["q5", "a5"],
  ["q6", "a6"],
] as const;

export async function Faq() {
  const t = await getTranslations("marketing.faq");

  return (
    <Section id="faq">
      <SectionHeader index="04" label={t("eyebrow")} title={t("title")} />
      <FaqList
        items={ITEMS.map(([question, answer]) => ({ question: t(question), answer: t(answer) }))}
        show={t("show")}
        hide={t("hide")}
      />
    </Section>
  );
}

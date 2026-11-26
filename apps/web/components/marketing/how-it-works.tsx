import { getTranslations } from "next-intl/server";
import { Section, SectionHeader } from "@/components/marketing/ui";

export async function HowItWorks() {
  const t = await getTranslations("marketing.steps");
  const steps = [
    { number: "01", title: t("oneTitle"), body: t("oneBody") },
    { number: "02", title: t("twoTitle"), body: t("twoBody") },
    { number: "03", title: t("threeTitle"), body: t("threeBody") },
  ];

  return (
    <Section id="jak-to-funguje">
      <SectionHeader index="01" label={t("eyebrow")} title={t("title")} lead={t("subtitle")} />

      <ol className="grid gap-4 lg:grid-cols-3">
        {steps.map((step) => (
          <li key={step.number} className="surface flex flex-col p-6 sm:p-8">
            <span className="h-1.5 w-1.5 rounded-pill bg-spark-300" aria-hidden="true" />
            <p className="mt-8 text-[12px] text-chalk-500">{step.number}</p>
            <h3 className="mt-3 text-[22px] font-medium leading-tight tracking-display text-white">
              {step.title}
            </h3>
            <p className="mt-3 text-[15px] leading-relaxed text-chalk-400">{step.body}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}

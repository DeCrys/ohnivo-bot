import { getTranslations } from "next-intl/server";
import { SectionHeader } from "@/components/marketing/ui";

export async function HowItWorks() {
  const t = await getTranslations("marketing.steps");
  const steps = [
    { number: "01", title: t("oneTitle"), body: t("oneBody") },
    { number: "02", title: t("twoTitle"), body: t("twoBody") },
    { number: "03", title: t("threeTitle"), body: t("threeBody") },
  ];

  return (
    <section id="jak-to-funguje" className="shell scroll-mt-24 py-16 lg:py-24">
      <SectionHeader
        index="01"
        label={t("eyebrow")}
        title={t("title")}
        lead={t("subtitle")}
      />

      <ol className="mt-10 border-t border-graphite/15">
        {steps.map((step) => (
          <li
            key={step.number}
            className="group grid gap-x-10 gap-y-3 border-b border-graphite/15 py-7 md:grid-cols-[10rem_minmax(0,1fr)] md:py-9 lg:grid-cols-[10rem_minmax(0,1fr)_22rem]"
          >
            <p className="font-mono text-[11px] tracking-label text-graphite/60">{step.number}</p>
            <h3 className="display text-[clamp(1.55rem,2.5vw,2.15rem)] leading-[1.1] text-graphite transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none">
              {step.title}
            </h3>
            <p className="max-w-sm text-[15px] leading-relaxed text-graphite-500 md:col-start-2 lg:col-start-3 lg:pt-1.5">
              {step.body}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}

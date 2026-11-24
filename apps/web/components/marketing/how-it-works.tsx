import { getTranslations } from "next-intl/server";
import { MessageSquareText, Sparkles, Rocket } from "lucide-react";
import { SectionTitle } from "@/components/ui/primitives";

export async function HowItWorks() {
  const t = await getTranslations("marketing.steps");
  const steps = [
    { icon: MessageSquareText, title: t("oneTitle"), body: t("oneBody") },
    { icon: Sparkles, title: t("twoTitle"), body: t("twoBody") },
    { icon: Rocket, title: t("threeTitle"), body: t("threeBody") },
  ];

  return (
    <section id="jak-to-funguje" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
      <SectionTitle eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} align="center" />
      <div className="mt-12 grid gap-4 md:grid-cols-3">
        {steps.map((step, index) => (
          <div key={step.title} className="surface relative p-6">
            <span className="absolute right-5 top-5 text-4xl font-semibold text-spark-500/10">
              0{index + 1}
            </span>
            <div className="grid h-11 w-11 place-items-center rounded-xl border border-spark-500/25 bg-spark-500/10 text-spark-300">
              <step.icon className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-white">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-spark-100/60">{step.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

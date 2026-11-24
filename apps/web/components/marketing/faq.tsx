import { getTranslations } from "next-intl/server";
import { ChevronDown } from "lucide-react";
import { SectionTitle } from "@/components/ui/primitives";

export async function Faq() {
  const t = await getTranslations("marketing.faq");
  const items = [
    ["q1", "a1"],
    ["q2", "a2"],
    ["q3", "a3"],
    ["q4", "a4"],
    ["q5", "a5"],
    ["q6", "a6"],
  ] as const;

  return (
    <section id="faq" className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:py-24">
      <SectionTitle eyebrow={t("eyebrow")} title={t("title")} align="center" />
      <div className="mt-10 space-y-2">
        {items.map(([question, answer]) => (
          <details
            key={question}
            className="group rounded-xl border border-line/70 bg-ink-850/70 px-5 py-4 open:border-spark-500/30"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium text-white">
              {t(question)}
              <ChevronDown className="h-4 w-4 shrink-0 text-spark-300 transition-transform group-open:rotate-180" />
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-spark-100/60">{t(answer)}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

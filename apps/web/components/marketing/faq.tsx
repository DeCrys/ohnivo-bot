import { getTranslations } from "next-intl/server";
import { SectionHeader } from "@/components/marketing/ui";

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
    <section id="faq" className="shell scroll-mt-24 py-16 lg:py-24">
      <SectionHeader index="05" label={t("eyebrow")} title={t("title")} />

      <div className="mt-10 border-t border-graphite/15">
        {items.map(([question, answer]) => (
          <details key={question} className="group border-b border-graphite/15">
            <summary className="focus-ring flex cursor-pointer list-none items-baseline justify-between gap-6 py-6 [&::-webkit-details-marker]:hidden">
              <span className="display max-w-[42ch] text-[clamp(1.15rem,1.9vw,1.55rem)] leading-snug text-graphite">
                {t(question)}
              </span>
              <span className="mono-label shrink-0 text-graphite/60 group-open:hidden">
                /{t("show")}
              </span>
              <span className="mono-label hidden shrink-0 text-graphite/60 group-open:inline">
                /{t("hide")}
              </span>
            </summary>
            <p className="max-w-2xl pb-6 text-[15px] leading-relaxed text-graphite-500">
              {t(answer)}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}

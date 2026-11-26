import { getTranslations } from "next-intl/server";
import { BRAND } from "@ohnivo/shared";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Section } from "@/components/marketing/ui";

export async function LegalPage({
  namespace,
  sectionCount,
}: {
  namespace: "privacy" | "terms";
  sectionCount: number;
}) {
  const t = await getTranslations(`marketing.legal.${namespace}`);
  const sections = Array.from({ length: sectionCount }, (_, index) => index + 1);

  return (
    <div className="blueprint">
      <SiteHeader />
      <main>
        <Section>
          <div className="pad pb-12 pt-14 lg:pb-16 lg:pt-20">
            <p className="mono-label flex items-center gap-3">
              <span className="h-1.5 w-1.5 rounded-pill bg-spark-300" aria-hidden="true" />
              {t("updated")}
            </p>
            <h1 className="display mt-7 max-w-[20ch] text-balance text-[clamp(2.25rem,5vw,4rem)] leading-[1.02]">
              {t("title")}
            </h1>
          </div>
        </Section>

        <Section>
          {sections.map((index) => (
            <section
              key={index}
              className="pad grid gap-x-12 gap-y-3 border-b border-wire py-8 last:border-b-0 md:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] lg:py-10"
            >
              <h2 className="text-[19px] leading-snug text-chalk">{t(`s${index}t`)}</h2>
              <p className="max-w-[62ch] text-[15px] leading-relaxed text-chalk-400">
                {t(`s${index}b`)}
              </p>
            </section>
          ))}
        </Section>

        <Section>
          <p className="pad py-8 text-[15px] leading-relaxed text-chalk-400">
            {t("contact")}{" "}
            <a
              href={`mailto:${BRAND.supportEmail}`}
              className="focus-ring inline-flex min-h-[44px] items-center rounded-control text-chalk hover:text-spark-200"
            >
              <span className="link-rule py-1">{BRAND.supportEmail}</span>
            </a>
          </p>
        </Section>
      </main>
      <SiteFooter />
    </div>
  );
}

import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { BRAND } from "@ohnivo/shared";
import { Logo } from "@/components/brand/logo";

export async function LegalPage({
  namespace,
  sectionCount,
}: {
  namespace: "privacy" | "terms";
  sectionCount: number;
}) {
  const t = await getTranslations(`marketing.legal.${namespace}`);
  const ta = await getTranslations("auth");
  const sections = Array.from({ length: sectionCount }, (_, index) => index + 1);

  return (
    <div className="min-h-screen">
      <header className="border-b border-graphite/15">
        <div className="shell flex items-center justify-between py-5">
          <Logo tone="light" />
          <Link
            href="/"
            className="link-rule font-mono text-[11px] uppercase tracking-label text-graphite/60 hover:text-graphite"
          >
            {ta("backHome")}
          </Link>
        </div>
      </header>

      <main className="shell py-10 lg:py-14">
        <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-graphite/15 pb-4">
          <p className="mono-label text-graphite/70">
            <span className="mr-2 text-graphite/40">/</span>
            {t("title")}
          </p>
          <p className="font-mono text-[11px] uppercase tracking-label text-graphite/60">
            {t("updated")}
          </p>
        </div>

        <h1 className="display mt-10 max-w-[20ch] text-balance text-[clamp(2.4rem,5vw,4rem)] leading-[1] text-graphite lg:mt-12">
          {t("title")}
        </h1>

        <div className="mt-10 border-t border-graphite/15 lg:mt-12">
          {sections.map((index) => (
            <section
              key={index}
              className="grid gap-x-10 gap-y-2 border-b border-graphite/15 py-7 md:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]"
            >
              <h2 className="display text-[clamp(1.25rem,1.8vw,1.6rem)] leading-snug text-graphite">
                {t(`s${index}t`)}
              </h2>
              <p className="max-w-2xl text-[15px] leading-relaxed text-graphite-500">
                {t(`s${index}b`)}
              </p>
            </section>
          ))}
        </div>

        <p className="mt-10 text-[15px] text-graphite-500">
          {t("contact")}{" "}
          <a
            href={`mailto:${BRAND.supportEmail}`}
            className="link-rule text-graphite hover:text-spark-600"
          >
            {BRAND.supportEmail}
          </a>
        </p>
      </main>
    </div>
  );
}

import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Mascot } from "@/components/brand/mascot";
import { ArrowUpRight } from "@/components/marketing/ui";

export async function CtaSection() {
  const t = await getTranslations("marketing.cta");

  return (
    <section className="shell pb-16 lg:pb-24">
      <div className="panel-ink relative overflow-hidden border border-graphite/20 px-6 py-12 sm:px-10 lg:px-14 lg:py-16">
        <div className="grid items-end gap-10 lg:grid-cols-[minmax(0,1fr)_17rem]">
          <div>
            <p className="mono-label text-spark-100/40">/ 06</p>
            <h2 className="display mt-4 max-w-[18ch] text-balance text-[clamp(2.1rem,4.6vw,4rem)] leading-[0.98] text-spark-50">
              {t("title")}
            </h2>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-spark-100/60">{t("body")}</p>
            <Link
              href="/login"
              className="focus-ring group mt-8 inline-flex h-12 items-center gap-3 bg-paper px-6 font-mono text-[11px] uppercase tracking-label text-graphite transition-colors hover:bg-lilac"
            >
              {t("button")}
              <ArrowUpRight className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transition-none" />
            </Link>
          </div>

          <Mascot
            className="mx-auto h-36 w-36 lg:mx-0 lg:ml-auto lg:h-52 lg:w-52"
            withSparkles={false}
          />
        </div>
      </div>
    </section>
  );
}

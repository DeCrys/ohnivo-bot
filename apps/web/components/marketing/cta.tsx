import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Mascot } from "@/components/brand/mascot";
import { buttonClasses } from "@/components/ui/button";

export async function CtaSection() {
  const t = await getTranslations("marketing.cta");
  return (
    <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
      <div className="surface relative overflow-hidden px-6 py-12 text-center sm:px-12">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(116,80,245,0.25),transparent_60%)]"
          aria-hidden="true"
        />
        <Mascot className="mx-auto h-28 w-28" withSparkles={false} />
        <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          {t("title")}
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-spark-100/65">{t("body")}</p>
        <Link href="/login" className={buttonClasses("primary", "lg", "mt-6")}>
          {t("button")} <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

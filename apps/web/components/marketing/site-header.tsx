import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { Logo } from "@/components/brand/logo";
import { LocaleSwitcher } from "@/components/dashboard/locale-switcher";
import { ArrowUpRight } from "@/components/marketing/ui";

export async function SiteHeader() {
  const t = await getTranslations("marketing.nav");
  const locale = await getLocale();

  return (
    <header className="sticky top-0 z-40 border-b border-graphite/15 bg-paper/85 backdrop-blur-md">
      <div className="shell flex h-[72px] items-center justify-between gap-6">
        <Logo tone="light" />

        <nav className="hidden items-center gap-8 lg:flex">
          <Link href="/#jak-to-funguje" className="mono-label link-rule text-graphite/70 hover:text-graphite">
            <span className="mr-1.5 text-graphite/60">01</span>
            {t("how")}
          </Link>
          <Link href="/pricing" className="mono-label link-rule text-graphite/70 hover:text-graphite">
            <span className="mr-1.5 text-graphite/60">02</span>
            {t("pricing")}
          </Link>
          <Link href="/#faq" className="mono-label link-rule text-graphite/70 hover:text-graphite">
            <span className="mr-1.5 text-graphite/60">03</span>
            {t("faq")}
          </Link>
        </nav>

        <div className="flex items-center gap-3 sm:gap-4">
          <LocaleSwitcher current={locale as "cs" | "en"} compact tone="light" />
          <Link
            href="/login"
            className="mono-label link-rule hidden text-graphite/70 hover:text-graphite md:inline-block"
          >
            {t("login")}
          </Link>
          <Link
            href="/login"
            className="focus-ring group inline-flex h-9 items-center gap-2 whitespace-nowrap bg-graphite px-3 font-mono text-[11px] uppercase tracking-label text-paper transition-colors hover:bg-spark-600 sm:px-4"
          >
            {t("dashboard")}
            <ArrowUpRight className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transition-none" />
          </Link>
        </div>
      </div>
    </header>
  );
}

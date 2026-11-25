import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { Logo } from "@/components/brand/logo";
import { LocaleSwitcher } from "@/components/dashboard/locale-switcher";
import { buttonClasses } from "@/components/ui/button";

export async function SiteHeader() {
  const t = await getTranslations("marketing.nav");
  const locale = await getLocale();

  return (
    <header className="sticky top-0 z-40 border-b border-line/60 bg-ink-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-7 text-sm text-spark-100/70 md:flex">
          <Link href="/#jak-to-funguje" className="transition-colors hover:text-white">
            {t("how")}
          </Link>
          <Link href="/pricing" className="transition-colors hover:text-white">
            {t("pricing")}
          </Link>
          <Link href="/#faq" className="transition-colors hover:text-white">
            {t("faq")}
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <LocaleSwitcher current={locale as "cs" | "en"} compact />
          <Link href="/login" className={buttonClasses("ghost", "sm", "hidden sm:inline-flex")}>
            {t("login")}
          </Link>
          <Link href="/login" className={buttonClasses("primary", "sm")}>
            {t("dashboard")}
          </Link>
        </div>
      </div>
    </header>
  );
}

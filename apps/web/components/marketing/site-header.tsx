import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { BRAND } from "@ohnivo/shared";
import { Logo } from "@/components/brand/logo";
import { LocaleSwitcher } from "@/components/dashboard/locale-switcher";
import { LocalClock } from "@/components/marketing/local-clock";

const LINKS = [
  { href: "/#jak-to-funguje", key: "how" },
  { href: "/pricing", key: "pricing" },
  { href: "/#faq", key: "faq" },
] as const;

export async function SiteHeader() {
  const t = await getTranslations("marketing.nav");
  const th = await getTranslations("marketing.hero");
  const locale = await getLocale();

  return (
    <>
      {/* Meta bar: scrolls away. On small screens it carries the section links. */}
      <div className="frame">
        <div className="pad hidden h-9 items-center justify-between gap-6 lg:flex">
          <p className="mono-label">{th("label")}</p>
          <p className="mono-label text-chalk-500">{BRAND.domain}</p>
          <LocalClock label={t("localTime")} />
        </div>
        <nav aria-label={t("sections")} className="carousel-fade pad flex items-center gap-5 overflow-x-auto lg:hidden">
          {LINKS.map((link, index) => (
            <Link
              key={link.key}
              href={link.href}
              className="focus-ring inline-flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-pill border border-wire px-3 text-[13px] text-chalk-2 transition-colors hover:bg-white/[0.04] hover:text-white motion-reduce:transition-none"
            >
              <span className="text-chalk-500">{String(index + 1).padStart(2, "0")}</span>
              {t(link.key)}
            </Link>
          ))}
        </nav>
      </div>

      <header className="sticky top-0 z-40">
        <div className="frame border-b border-wire bg-void/85 backdrop-blur-md">
          <div className="pad flex h-16 items-center justify-between gap-6">
            <Logo />

            <nav className="hidden items-center gap-8 lg:flex">
              {LINKS.map((link) => (
                <Link
                  key={link.key}
                  href={link.href}
                  className="focus-ring inline-flex min-h-[40px] items-center rounded-pill border border-wire px-4 text-[13px] text-chalk-2 transition-colors hover:bg-white/[0.04] hover:text-white motion-reduce:transition-none"
                >
                  <span className="link-rule py-1">{t(link.key)}</span>
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-2 sm:gap-4">
              <LocaleSwitcher current={locale as "cs" | "en"} compact />
              <Link
                href="/login"
                className="mono-label focus-ring hidden min-h-[44px] items-center rounded-control text-chalk-300 transition-colors hover:text-chalk motion-reduce:transition-none md:inline-flex"
              >
                <span className="link-rule py-1">{t("login")}</span>
              </Link>
              <Link href="/login" className="btn-wire focus-ring whitespace-nowrap">
                {t("dashboard")}
              </Link>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}

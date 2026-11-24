import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { BRAND } from "@ohnivo/shared";
import { Logo } from "@/components/brand/logo";

export async function SiteFooter() {
  const t = await getTranslations("marketing.footer");
  return (
    <footer className="border-t border-line/60 bg-ink-950/60">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-spark-100/55">{t("tagline")}</p>
          <p className="mt-4 text-xs text-spark-100/35">{t("made")}</p>
        </div>
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-spark-100/45">
            {t("product")}
          </p>
          <ul className="space-y-2 text-sm text-spark-100/60">
            <li>
              <Link href="#jak-to-funguje" className="hover:text-white">
                {t("docs")}
              </Link>
            </li>
            <li>
              <Link href="#cenik" className="hover:text-white">
                {t("pricing")}
              </Link>
            </li>
            <li>
              <Link href="/login" className="hover:text-white">
                Dashboard
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-spark-100/45">
            {t("privacy")}
          </p>
          <ul className="space-y-2 text-sm text-spark-100/60">
            <li>
              <Link href="/terms" className="hover:text-white">
                {t("terms")}
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:text-white">
                {t("privacy")}
              </Link>
            </li>
            <li>
              <a href={`mailto:${BRAND.supportEmail}`} className="hover:text-white">
                {BRAND.supportEmail}
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line/50 px-4 py-4 text-center text-xs text-spark-100/30">
        © {new Date().getFullYear()} {BRAND.name}. {t("rights")}
      </div>
    </footer>
  );
}

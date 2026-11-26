import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { BRAND } from "@ohnivo/shared";
import { Logo } from "@/components/brand/logo";

export async function SiteFooter() {
  const t = await getTranslations("marketing.footer");
  const tn = await getTranslations("marketing.nav");
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-graphite/15">
      <div className="shell pt-14">
        <div className="grid gap-10 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div>
            <Logo tone="light" />
            <p className="mt-5 max-w-xs font-serif text-2xl leading-[1.2] text-graphite">
              {t("tagline")}
            </p>
          </div>

          <nav aria-labelledby="footer-product">
            <p id="footer-product" className="mono-label mb-4 text-graphite/60">
              {t("product")}
            </p>
            <ul className="space-y-2.5">
              <li>
                <Link href="/#jak-to-funguje" className="link-rule text-sm text-graphite-500 hover:text-graphite">
                  {t("docs")}
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="link-rule text-sm text-graphite-500 hover:text-graphite">
                  {t("pricing")}
                </Link>
              </li>
              <li>
                <Link href="/login" className="link-rule text-sm text-graphite-500 hover:text-graphite">
                  {tn("dashboard")}
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-labelledby="footer-legal">
            <p id="footer-legal" className="mono-label mb-4 text-graphite/60">
              {t("legal")}
            </p>
            <ul className="space-y-2.5">
              <li>
                <Link href="/terms" className="link-rule text-sm text-graphite-500 hover:text-graphite">
                  {t("terms")}
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="link-rule text-sm text-graphite-500 hover:text-graphite">
                  {t("privacy")}
                </Link>
              </li>
            </ul>
          </nav>

          <div>
            <p className="mono-label mb-4 text-graphite/60">{t("contact")}</p>
            <a
              href={`mailto:${BRAND.supportEmail}`}
              className="link-rule text-sm text-graphite-500 hover:text-graphite"
            >
              {BRAND.supportEmail}
            </a>
            <p className="mt-6 max-w-[16rem] font-mono text-[11px] leading-relaxed text-graphite-500">
              {t("made")}
            </p>
          </div>
        </div>

        <div className="mt-16 overflow-hidden border-t border-graphite/15 pt-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <p className="display select-none text-[clamp(3.5rem,13vw,11rem)] leading-[0.78] tracking-display text-graphite">
              ohnivo<span className="text-spark-600">.</span>
            </p>
            <p className="mono-label pb-2 text-graphite/60">
              © {year} {BRAND.name} — {t("rights")}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

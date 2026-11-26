import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { BRAND } from "@ohnivo/shared";
import { Logo } from "@/components/brand/logo";
import { Section } from "@/components/marketing/ui";

const LINK =
  "focus-ring inline-flex min-h-[44px] items-center rounded-control text-[14px] text-chalk-400 transition-colors hover:text-chalk motion-reduce:transition-none";

export async function SiteFooter() {
  const t = await getTranslations("marketing.footer");
  const tn = await getTranslations("marketing.nav");
  const year = new Date().getFullYear();

  return (
    <footer>
      <Section>
        <div className="grid gap-6 md:grid-cols-[1.6fr_1fr_1fr_1.2fr]">
          <div className="py-10 lg:py-12">
            <Logo />
            <p className="mt-4 max-w-[18ch] text-[22px] font-medium leading-[1.25] tracking-display text-chalk-2">
              {t("tagline")}
            </p>
          </div>

          <nav aria-labelledby="footer-product" className="py-10 lg:py-12">
            <p id="footer-product" className="mono-label mb-3 text-chalk-500">
              {t("product")}
            </p>
            <ul>
              <li>
                <Link href="/#jak-to-funguje" className={LINK}>
                  <span className="link-rule py-0.5">{t("docs")}</span>
                </Link>
              </li>
              <li>
                <Link href="/pricing" className={LINK}>
                  <span className="link-rule py-0.5">{t("pricing")}</span>
                </Link>
              </li>
              <li>
                <Link href="/login" className={LINK}>
                  <span className="link-rule py-0.5">{tn("dashboard")}</span>
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-labelledby="footer-legal" className="py-10 lg:py-12">
            <p id="footer-legal" className="mono-label mb-3 text-chalk-500">
              {t("legal")}
            </p>
            <ul>
              <li>
                <Link href="/terms" className={LINK}>
                  <span className="link-rule py-0.5">{t("terms")}</span>
                </Link>
              </li>
              <li>
                <Link href="/privacy" className={LINK}>
                  <span className="link-rule py-0.5">{t("privacy")}</span>
                </Link>
              </li>
            </ul>
          </nav>

          <div className="py-10 lg:py-12">
            <p className="mono-label mb-3 text-chalk-500">{t("contact")}</p>
            <a href={`mailto:${BRAND.supportEmail}`} className={LINK}>
              <span className="link-rule py-0.5">{BRAND.supportEmail}</span>
            </a>
            <p className="mt-4 max-w-[18rem] text-[13px] leading-relaxed text-chalk-500">
              {t("made")}
            </p>
          </div>
        </div>
      </Section>

      {/* Ghost wordmark band: outlined, hatched, cropped by the frame. */}
      <Section>
        <div className="overflow-hidden" aria-hidden="true">
          <p className="ghost-word select-none whitespace-nowrap text-center text-[clamp(5rem,22vw,19rem)] leading-[0.86] tracking-display">
            ohnivo.
          </p>
        </div>
      </Section>

      <Section>
        <div className="pad flex min-h-[56px] flex-wrap items-center justify-between gap-x-6 gap-y-2 py-4">
          <p className="mono-label text-chalk-500">
            © {year} {BRAND.name} — {t("rights")}
          </p>
          <p className="mono-label text-chalk-500">{BRAND.domain}</p>
        </div>
      </Section>
    </footer>
  );
}

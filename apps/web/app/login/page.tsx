import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Mascot } from "@/components/brand/mascot";
import { Logo } from "@/components/brand/logo";
import { ArrowUpRight } from "@/components/marketing/ui";
import { getSession } from "@/lib/auth/session";

function safeNext(value: string | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/dashboard";
  return value;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string; error?: string };
}) {
  const session = await getSession();
  const next = safeNext(searchParams.next);
  if (session) redirect(next);

  const t = await getTranslations("auth");

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-graphite/15">
        <div className="shell flex items-center justify-between py-5">
          <Logo tone="light" />
          <Link
            href="/"
            className="link-rule font-mono text-[11px] uppercase tracking-label text-graphite/60 hover:text-graphite"
          >
            {t("backHome")}
          </Link>
        </div>
      </header>

      <main className="shell grid flex-1 items-center gap-12 py-12 lg:grid-cols-[minmax(0,1fr)_26rem] lg:gap-20 lg:py-16">
        <div>
          <p className="mono-label text-graphite/60">
            <span className="mr-3 text-graphite/60">01</span>
            {t("discord")}
          </p>
          <h1 className="display mt-5 max-w-[18ch] text-balance text-[clamp(2.5rem,5.6vw,4.6rem)] leading-[0.98] text-graphite">
            {t("title")}
          </h1>
          <p className="mt-5 max-w-md text-[16px] leading-relaxed text-graphite-500">
            {t("subtitle")}
          </p>

          {searchParams.error ? (
            <p
              role="alert"
              className="mt-6 max-w-md border-l-2 border-red-600 bg-red-50 px-4 py-3 text-[14px] leading-relaxed text-red-900"
            >
              {searchParams.error === "access" ? t("errorAccess") : t("errorState")}
            </p>
          ) : null}

          <a
            href={`/api/auth/login?next=${encodeURIComponent(next)}`}
            className="focus-ring group mt-8 inline-flex h-12 items-center gap-3 bg-graphite px-5 font-mono text-[11px] uppercase tracking-label text-paper transition-colors hover:bg-spark-600"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
              <path d="M20.317 4.369A19.79 19.79 0 0 0 15.885 3c-.2.36-.43.84-.59 1.22a18.27 18.27 0 0 0-5.59 0A12.6 12.6 0 0 0 9.1 3a19.74 19.74 0 0 0-4.43 1.37C1.86 8.36 1.2 12.25 1.53 16.09a19.9 19.9 0 0 0 5.43 2.75c.44-.6.83-1.24 1.16-1.91a12.9 12.9 0 0 1-1.83-.88c.15-.11.3-.23.45-.35a14.2 14.2 0 0 0 12.1 0c.15.12.3.24.45.35-.58.35-1.2.64-1.84.88.34.67.73 1.31 1.17 1.91a19.86 19.86 0 0 0 5.43-2.75c.4-4.45-.66-8.3-2.74-11.72ZM8.55 13.78c-1.07 0-1.95-.98-1.95-2.18 0-1.2.86-2.18 1.95-2.18 1.1 0 1.97.99 1.95 2.18 0 1.2-.86 2.18-1.95 2.18Zm6.9 0c-1.07 0-1.95-.98-1.95-2.18 0-1.2.86-2.18 1.95-2.18 1.1 0 1.97.99 1.95 2.18 0 1.2-.85 2.18-1.95 2.18Z" />
            </svg>
            {t("discord")}
            <ArrowUpRight className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transition-none" />
          </a>

          <p className="mt-5 max-w-md font-mono text-[11px] leading-relaxed text-graphite-500">
            {t("consent")}
          </p>
          <Link
            href="/terms"
            className="link-rule mt-2 inline-block font-mono text-[11px] uppercase tracking-label text-graphite/60 hover:text-graphite"
          >
            {t("terms")}
          </Link>
        </div>

        <aside className="panel-ink border border-graphite/20 p-6">
          <Mascot className="mx-auto h-36 w-36" />
          <ul className="mt-8 space-y-4">
            {(["bullet1", "bullet2", "bullet3"] as const).map((key, index) => (
              <li key={key} className="flex gap-3 border-t border-white/10 pt-4 first:border-t-0 first:pt-0">
                <span className="font-mono text-[11px] text-spark-100/30">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="text-[14px] leading-relaxed text-spark-100/70">{t(key)}</span>
              </li>
            ))}
          </ul>
        </aside>
      </main>
    </div>
  );
}

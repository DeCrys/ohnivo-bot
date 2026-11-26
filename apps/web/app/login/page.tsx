import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Mascot } from "@/components/brand/mascot";
import { Logo } from "@/components/brand/logo";
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
    <div className="blueprint">
      <div className="frame flex min-h-screen flex-col">
        <header className="pad flex h-16 shrink-0 items-center justify-between gap-6 border-b border-wire">
          <Logo />
          <Link
            href="/"
            className="mono-label focus-ring inline-flex min-h-[44px] items-center rounded-control text-chalk-300 transition-colors hover:text-chalk motion-reduce:transition-none"
          >
            <span className="link-rule py-1">{t("backHome")}</span>
          </Link>
        </header>

        <main className="grid flex-1 lg:grid-cols-[minmax(0,1fr)_26rem]">
          <div className="pad flex flex-col justify-center py-14 lg:py-20">
            <p className="mono-label flex items-center gap-3">
              <span className="h-1.5 w-1.5 rounded-pill bg-spark-300" aria-hidden="true" />
              {t("discord")}
            </p>
            <h1 className="display mt-7 max-w-[16ch] text-balance text-[clamp(2.25rem,5.2vw,4rem)] leading-[1.02]">
              {t("title")}
            </h1>
            <p className="mt-6 max-w-[30rem] text-[17px] leading-relaxed text-chalk-400">
              {t("subtitle")}
            </p>

            {searchParams.error ? (
              <p
                role="alert"
                className="mt-7 max-w-[30rem] rounded-inner border border-red-500/30 bg-red-500/10 px-4 py-3 text-[14px] leading-relaxed text-red-200"
              >
                {searchParams.error === "access" ? t("errorAccess") : t("errorState")}
              </p>
            ) : null}

            <a
              href={`/api/auth/login?next=${encodeURIComponent(next)}`}
              className="btn-hatch focus-ring mt-9 w-full sm:w-fit"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                <path d="M20.317 4.369A19.79 19.79 0 0 0 15.885 3c-.2.36-.43.84-.59 1.22a18.27 18.27 0 0 0-5.59 0A12.6 12.6 0 0 0 9.1 3a19.74 19.74 0 0 0-4.43 1.37C1.86 8.36 1.2 12.25 1.53 16.09a19.9 19.9 0 0 0 5.43 2.75c.44-.6.83-1.24 1.16-1.91a12.9 12.9 0 0 1-1.83-.88c.15-.11.3-.23.45-.35a14.2 14.2 0 0 0 12.1 0c.15.12.3.24.45.35-.58.35-1.2.64-1.84.88.34.67.73 1.31 1.17 1.91a19.86 19.86 0 0 0 5.43-2.75c.4-4.45-.66-8.3-2.74-11.72ZM8.55 13.78c-1.07 0-1.95-.98-1.95-2.18 0-1.2.86-2.18 1.95-2.18 1.1 0 1.97.99 1.95 2.18 0 1.2-.86 2.18-1.95 2.18Zm6.9 0c-1.07 0-1.95-.98-1.95-2.18 0-1.2.86-2.18 1.95-2.18 1.1 0 1.97.99 1.95 2.18 0 1.2-.85 2.18-1.95 2.18Z" />
              </svg>
              {t("discord")}
            </a>

            <p className="mt-6 max-w-[30rem] text-[13px] leading-relaxed text-chalk-500">
              {t("consent")}
            </p>
            <Link
              href="/terms"
              className="mono-label focus-ring mt-1 inline-flex min-h-[44px] w-fit items-center rounded-control text-chalk-300 transition-colors hover:text-chalk motion-reduce:transition-none"
            >
              <span className="link-rule py-1">{t("terms")}</span>
            </Link>
          </div>

          <aside className="flex flex-col border-t border-white/5 bg-void-900 lg:border-l lg:border-t-0">
            <div className="relative grid flex-1 place-items-center overflow-hidden py-12">
              <div className="absolute inset-0 bg-spark-radial" aria-hidden="true" />
              <Mascot className="relative h-36 w-36" withSparkles={false} />
            </div>
            <ul className="space-y-2 px-5 pb-12 sm:px-8">
              {(["bullet1", "bullet2", "bullet3"] as const).map((key, index) => (
                <li
                  key={key}
                  className="inner-row grid grid-cols-[2rem_minmax(0,1fr)] gap-x-3"
                >
                  <span className="pt-[3px] text-[12px] text-chalk-500">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[14px] leading-relaxed text-chalk-2">{t(key)}</span>
                </li>
              ))}
            </ul>
          </aside>
        </main>
      </div>
    </div>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ShieldCheck, Sparkles, Wand2 } from "lucide-react";
import { Mascot } from "@/components/brand/mascot";
import { Logo } from "@/components/brand/logo";
import { buttonClasses } from "@/components/ui/button";
import { Alert } from "@/components/ui/primitives";
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
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-0 grid-bg" aria-hidden="true" />
      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <Logo />
        <Link href="/" className="text-sm text-spark-100/60 hover:text-white">
          {t("backHome")}
        </Link>
      </header>

      <main className="relative z-10 mx-auto grid w-full max-w-5xl flex-1 items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_0.9fr]">
        <div>
          <h1 className="text-balance text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            {t("title")}
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-spark-100/65">{t("subtitle")}</p>

          {searchParams.error ? (
            <Alert variant="danger" className="mt-5">
              {searchParams.error === "access" ? t("errorAccess") : t("errorState")}
            </Alert>
          ) : null}

          <a
            href={`/api/auth/login?next=${encodeURIComponent(next)}`}
            className={buttonClasses("primary", "lg", "mt-7 w-full sm:w-auto")}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
              <path d="M20.317 4.369A19.79 19.79 0 0 0 15.885 3c-.2.36-.43.84-.59 1.22a18.27 18.27 0 0 0-5.59 0A12.6 12.6 0 0 0 9.1 3a19.74 19.74 0 0 0-4.43 1.37C1.86 8.36 1.2 12.25 1.53 16.09a19.9 19.9 0 0 0 5.43 2.75c.44-.6.83-1.24 1.16-1.91a12.9 12.9 0 0 1-1.83-.88c.15-.11.3-.23.45-.35a14.2 14.2 0 0 0 12.1 0c.15.12.3.24.45.35-.58.35-1.2.64-1.84.88.34.67.73 1.31 1.17 1.91a19.86 19.86 0 0 0 5.43-2.75c.4-4.45-.66-8.3-2.74-11.72ZM8.55 13.78c-1.07 0-1.95-.98-1.95-2.18 0-1.2.86-2.18 1.95-2.18 1.1 0 1.97.99 1.95 2.18 0 1.2-.86 2.18-1.95 2.18Zm6.9 0c-1.07 0-1.95-.98-1.95-2.18 0-1.2.86-2.18 1.95-2.18 1.1 0 1.97.99 1.95 2.18 0 1.2-.85 2.18-1.95 2.18Z" />
            </svg>
            {t("discord")}
          </a>
          <p className="mt-4 max-w-md text-xs leading-relaxed text-spark-100/40">{t("consent")}</p>
          <Link href="/terms" className="mt-2 inline-block text-xs text-spark-300 hover:text-spark-200">
            {t("terms")}
          </Link>
        </div>

        <div className="surface relative overflow-hidden p-6">
          <Mascot className="mx-auto h-40 w-40" />
          <ul className="mt-4 space-y-3 text-sm text-spark-100/70">
            <li className="flex gap-3">
              <Wand2 className="mt-0.5 h-4 w-4 shrink-0 text-spark-300" />
              {t("bullet1")}
            </li>
            <li className="flex gap-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-spark-300" />
              {t("bullet2")}
            </li>
            <li className="flex gap-3">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-spark-300" />
              {t("bullet3")}
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}

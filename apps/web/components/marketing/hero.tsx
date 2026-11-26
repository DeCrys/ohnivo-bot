"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowRight, ArrowUpRight } from "@/components/marketing/ui";

const EXAMPLES = ["example1", "example2", "example3", "example4"] as const;
const STEPS = ["demoStep1", "demoStep2", "demoStep3"] as const;
const CATEGORIES = ["demoCategory1", "demoCategory2", "demoCategory3"] as const;
const ROLES = ["demoRole1", "demoRole2", "demoRole3"] as const;
const PERMISSIONS = ["demoPerm1", "demoPerm2", "demoPerm3"] as const;

export function Hero() {
  const t = useTranslations("marketing.hero");
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const ready = prompt.trim().length >= 3;

  function start() {
    const value = prompt.trim();
    if (value.length < 3) return;
    try {
      sessionStorage.setItem("ohnivo.prompt", value);
    } catch {
      // Storage can be unavailable in private mode; the user can retype.
    }
    router.push("/api/auth/login?next=/dashboard/new");
  }

  return (
    <section className="relative">
      <div className="shell">
        <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-graphite/15 py-4">
          <p className="mono-label text-graphite/70">{t("label")}</p>
          <p className="mono-label text-graphite/60">{t("builtIn")}</p>
        </div>

        <div className="grid gap-10 pb-14 pt-10 lg:grid-cols-[minmax(0,1fr)_25rem] lg:gap-16 lg:pb-20 lg:pt-16">
          <div className="flex flex-col justify-between gap-10">
            <h1 className="display text-[clamp(2.7rem,7.2vw,6.4rem)] leading-[0.94] text-graphite">
              <span className="reveal-line">
                <span style={{ "--reveal-delay": "0ms" } as React.CSSProperties}>{t("title1")}</span>
              </span>
              <span className="reveal-line">
                <span
                  className="italic text-graphite/75"
                  style={{ "--reveal-delay": "90ms" } as React.CSSProperties}
                >
                  {t("title2")}
                </span>
              </span>
            </h1>

            <div className="hidden items-center gap-3 lg:flex">
              <span className="h-2 w-2 bg-lilac" aria-hidden="true" />
              <p className="mono-label text-graphite/60">{t("flow")}</p>
            </div>
          </div>

          <div className="flex flex-col justify-end">
            <p className="max-w-sm text-[17px] leading-relaxed text-graphite-500">{t("subtitle")}</p>

            <form
              className="mt-8 border border-graphite/25 bg-paper-deep/70 transition-colors focus-within:border-graphite"
              onSubmit={(event) => {
                event.preventDefault();
                start();
              }}
            >
              <label htmlFor="hero-prompt" className="sr-only">
                {t("placeholder")}
              </label>
              <textarea
                id="hero-prompt"
                rows={4}
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder={t("placeholder")}
                className="w-full resize-none bg-transparent px-4 pt-4 font-serif text-[19px] leading-snug text-graphite placeholder:text-graphite/60 focus:outline-none"
              />
              <div className="flex items-center justify-between gap-3 px-2 pb-2">
                <span className="mono-label whitespace-nowrap px-1 text-graphite/60">{t("promptHint")}</span>
                <button
                  type="submit"
                  disabled={!ready}
                  className="focus-ring inline-flex h-11 shrink-0 items-center gap-2 whitespace-nowrap bg-graphite px-4 font-mono text-[11px] uppercase tracking-label text-paper transition-colors hover:bg-spark-600 disabled:cursor-not-allowed disabled:bg-transparent disabled:text-graphite/50 disabled:outline disabled:outline-1 disabled:outline-graphite/20"
                >
                  {t("cta")}
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </form>

            <p className="mt-3 font-mono text-[11px] leading-relaxed text-graphite-500">{t("note")}</p>

            <div className="mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-2">
              <span className="mono-label text-graphite/60">{t("examplesLabel")}</span>
              {EXAMPLES.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setPrompt(t(key))}
                  className="focus-ring link-rule text-[13px] text-graphite-500 hover:text-graphite"
                >
                  {t(key)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="shell pb-16 lg:pb-24">
        <div className="panel-ink grid animate-fade-up grid-cols-1 divide-y divide-white/10 border border-graphite/20 motion-reduce:animate-none md:grid-cols-[1.15fr_1fr_1fr] md:divide-x md:divide-y-0">
          <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4 md:col-span-3">
            <p className="font-mono text-[11px] uppercase tracking-label text-spark-200">
              {t("demoTitle")}
            </p>
            <p className="font-mono text-[11px] uppercase tracking-label text-spark-100/40">
              {t("demoMeta")}
            </p>
          </div>

          <div className="px-5 py-6">
            <p className="mono-label text-spark-100/40">{t("demoCategories")}</p>
            <ul className="mt-4 space-y-0">
              {CATEGORIES.map((key, index) => (
                <li
                  key={key}
                  className="flex items-baseline gap-4 border-b border-white/10 py-2.5 last:border-b-0"
                >
                  <span className="font-mono text-[11px] text-spark-100/30">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="font-mono text-[13px] text-spark-50">{t(key)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="px-5 py-6">
            <p className="mono-label text-spark-100/40">{t("demoRoles")}</p>
            <ul className="mt-4 flex flex-wrap gap-1.5">
              {ROLES.map((key) => (
                <li
                  key={key}
                  className="inline-flex items-center gap-1.5 border border-white/15 px-2 py-1 font-mono text-[11px] text-spark-100"
                >
                  {t(key)}
                </li>
              ))}
            </ul>
            <p className="mono-label mt-5 text-spark-100/40">{t("demoPermissions")}</p>
            <ul className="mt-3 space-y-1.5">
              {PERMISSIONS.map((key) => (
                <li key={key} className="flex items-center gap-2 font-mono text-[11px] text-spark-100/60">
                  <span className="h-1 w-1 bg-lilac" aria-hidden="true" />
                  {t(key)}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col justify-between px-5 py-6">
            <div>
              <p className="mono-label text-spark-100/40">{t("demoBuild")}</p>
              <ul className="mt-4 space-y-3">
                {STEPS.map((key) => (
                  <li key={key} className="flex items-center justify-between gap-3">
                    <span className="font-mono text-[12px] text-spark-100/80">{t(key)}</span>
                    <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-label text-lilac">
                      <span className="h-1.5 w-1.5 bg-lilac" aria-hidden="true" />
                      {t("demoDone")}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <a
              href="/login"
              className="link-rule mt-8 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-label text-spark-50 hover:text-white"
            >
              {t("demoLink")}
              <ArrowUpRight />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

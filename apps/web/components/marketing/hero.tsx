"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowUpRight } from "@/components/marketing/ui";
import { cn } from "@/lib/utils";

const EXAMPLES = ["example1", "example2", "example3", "example4"] as const;
const STEPS = ["demoStep1", "demoStep2", "demoStep3"] as const;
const CATEGORIES = ["demoCategory1", "demoCategory2", "demoCategory3"] as const;
const ROLES = [
  { key: "demoRole1", swatch: "bg-ember-400" },
  { key: "demoRole2", swatch: "bg-spark-300" },
  { key: "demoRole3", swatch: "bg-chalk" },
] as const;
const PERMISSIONS = ["demoPerm1", "demoPerm2", "demoPerm3"] as const;

/** Diagram card: mono header strip above free content. */
function Node({
  title,
  meta,
  className,
  children,
}: {
  title: string;
  meta?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("panel flex flex-col text-left", className)}>
      <div className="flex min-h-[40px] items-center justify-between gap-3 border-b border-white/5 px-5">
        <p className="text-[13px] font-medium text-white">{title}</p>
        {meta ? <p className="text-[12px] text-chalk-500">{meta}</p> : null}
      </div>
      <div className="flex-1 p-5">{children}</div>
    </div>
  );
}

/**
 * Connector between two diagram columns. Desktop: dashed curve(s) with a
 * lavender node on each end. Stacked layout: a short quiet vertical line.
 */
function Connector({ fork = false }: { fork?: boolean }) {
  return (
    <div aria-hidden="true" className="relative flex justify-center lg:block lg:self-stretch">
      <span className="h-8 border-l border-wire lg:hidden" />
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 hidden h-full w-full lg:block"
      >
        {fork ? (
          <>
            <path className="wire-dash" d="M0,50 C50,50 50,25 100,25" />
            <path className="wire-dash" d="M0,50 C50,50 50,75 100,75" />
          </>
        ) : (
          <path className="wire-dash" d="M0,50 L100,50" />
        )}
      </svg>
      <span className="node-dot left-0 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 lg:block" />
      {fork ? (
        <>
          <span className="node-dot right-0 top-1/4 hidden -translate-y-1/2 translate-x-1/2 lg:block" />
          <span className="node-dot right-0 top-3/4 hidden -translate-y-1/2 translate-x-1/2 lg:block" />
        </>
      ) : (
        <span className="node-dot right-0 top-1/2 hidden -translate-y-1/2 translate-x-1/2 lg:block" />
      )}
    </div>
  );
}

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
    <section className="frame">
      <div className="pad flex flex-col items-center pb-14 pt-14 text-center lg:pb-20 lg:pt-24">
        <p className="tag">{t("flow")}</p>

        <h1 className="display mt-6 text-balance text-[clamp(2.25rem,5vw,3.75rem)] leading-[1.06]">
          <span className="block text-chalk-500">{t("title1")}</span>
          <span className="block">{t("title2")}</span>
        </h1>

        <p className="mt-6 max-w-[38rem] text-[17px] leading-relaxed text-chalk-300">
          {t("subtitle")}
        </p>

        <form
          className="panel mt-10 w-full max-w-[44rem] text-left shadow-panel transition-colors duration-200 focus-within:border-white/[0.10] motion-reduce:transition-none"
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
            rows={3}
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder={t("placeholder")}
            className="block w-full resize-none bg-transparent px-4 pt-4 text-[17px] leading-relaxed text-chalk placeholder:text-chalk-500 focus:outline-none sm:px-5 sm:pt-5"
          />
          <div className="flex items-center justify-between gap-3 border-t border-white/5 p-2 pl-4 sm:pl-5">
            <span className="hidden text-[12px] text-chalk-500 sm:inline">{t("promptHint")}</span>
            <button type="submit" disabled={!ready} className="btn-hatch focus-ring ml-auto shrink-0">
              {t("cta")}
            </button>
          </div>
        </form>

        <p className="mt-4 text-[13px] leading-relaxed text-chalk-500">{t("note")}</p>

        <div className="mt-8 flex max-w-[52rem] flex-wrap items-center justify-center gap-2">
          <span className="mono-label mr-1 text-chalk-500">{t("examplesLabel")}</span>
          {EXAMPLES.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setPrompt(t(key))}
              className="focus-ring inline-flex min-h-[40px] items-center rounded-pill border border-wire px-3.5 text-[13px] leading-none text-chalk-2 transition-colors duration-150 hover:border-wire-strong hover:bg-white/[0.04] hover:text-white motion-reduce:transition-none"
            >
              {t(key)}
            </button>
          ))}
        </div>
      </div>

      <figure className="pad pb-16 lg:pb-24">
        <figcaption className="sr-only">{t("diagramLabel")}</figcaption>

        <div className="grid items-center lg:grid-cols-[minmax(0,0.9fr)_4.5rem_minmax(0,1.1fr)_4.5rem_minmax(0,1.1fr)]">
          <Node title={t("demoPrompt")}>
            <p className="line-clamp-4 text-[15px] leading-relaxed text-chalk">
              {ready ? prompt.trim() : t("example1")}
              <span
                aria-hidden="true"
                className="ml-0.5 inline-block h-[1.05em] w-[2px] translate-y-[0.2em] bg-spark-300 motion-safe:animate-pulse-soft"
              />
            </p>
          </Node>

          <Connector />

          <Node title={t("demoTitle")} meta={t("demoMeta")}>
            <p className="text-[12px] text-chalk-500">{t("demoCategories")}</p>
            <ul className="mt-3 space-y-1.5">
              {CATEGORIES.map((key, index) => (
                <li
                  key={key}
                  className={cn(
                    "flex h-10 items-center gap-3 rounded-inner border px-3 text-[13px]",
                    index === 1
                      ? "border-wire bg-spark-300/[0.10] text-spark-200"
                      : "border-wire bg-void text-chalk-300",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn("h-1.5 w-1.5 rounded-pill", index === 1 ? "bg-spark-300" : "bg-wire-strong")}
                  />
                  {t(key)}
                  <span className="ml-auto text-[11px] text-chalk-500">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </li>
              ))}
            </ul>
          </Node>

          <Connector fork />

          <div className="grid gap-4 lg:grid-rows-2">
            <Node title={t("demoRoles")}>
              <ul className="flex flex-wrap gap-1.5">
                {ROLES.map(({ key, swatch }) => (
                  <li
                    key={key}
                    className="inline-flex h-7 items-center gap-2 rounded-pill border border-wire px-2.5 text-[12px] text-chalk-2"
                  >
                    <span aria-hidden="true" className={cn("h-1.5 w-1.5 rounded-pill", swatch)} />
                    {t(key)}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-[12px] text-chalk-500">{t("demoPermissions")}</p>
              <ul className="mt-2.5 space-y-1.5">
                {PERMISSIONS.map((key) => (
                  <li key={key} className="flex items-center gap-2 text-[12px] text-chalk-400">
                    <span className="h-1 w-1 rounded-pill bg-spark-300" aria-hidden="true" />
                    {t(key)}
                  </li>
                ))}
              </ul>
            </Node>

            <Node title={t("demoBuild")} meta={t("builtIn")}>
              <ul className="space-y-2.5">
                {STEPS.map((key) => (
                  <li key={key} className="flex items-center justify-between gap-3">
                    <span className="text-[13px] text-chalk-2">{t(key)}</span>
                    <span className="inline-flex items-center gap-1.5 text-[12px] text-spark-200">
                      <span className="h-1.5 w-1.5 rounded-pill bg-spark-300" aria-hidden="true" />
                      {t("demoDone")}
                    </span>
                  </li>
                ))}
              </ul>
              <a
                href="/login"
                className="focus-ring mt-3 inline-flex min-h-[44px] items-center gap-2 rounded-control text-[13px] text-white transition-colors hover:text-spark-200 motion-reduce:transition-none"
              >
                <span className="link-rule py-1">{t("demoLink")}</span>
                <ArrowUpRight />
              </a>
            </Node>
          </div>
        </div>
      </figure>
    </section>
  );
}

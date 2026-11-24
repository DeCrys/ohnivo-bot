"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowRight, Sparkles } from "lucide-react";
import { Mascot } from "@/components/brand/mascot";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/primitives";

const EXAMPLES = ["example1", "example2", "example3", "example4"] as const;

export function Hero() {
  const t = useTranslations("marketing.hero");
  const router = useRouter();
  const [prompt, setPrompt] = useState("");

  function start() {
    const value = prompt.trim();
    if (value.length >= 3) {
      try {
        sessionStorage.setItem("ohnivo.prompt", value);
      } catch {
        // Storage can be unavailable in private mode; the user can retype.
      }
    }
    router.push("/api/auth/login?next=/dashboard/new");
  }

  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 grid-bg" aria-hidden="true" />
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-14 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:pb-24 lg:pt-20">
        <div className="relative">
          <Badge variant="soon" className="mb-5 px-3 py-1">
            <Sparkles className="h-3 w-3" /> {t("badge")}
          </Badge>
          <h1 className="text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
            {t("title1")}
            <br />
            <span className="gradient-text">{t("title2")}</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-spark-100/70 sm:text-lg">
            {t("subtitle")}
          </p>

          <div className="surface mt-7 p-3">
            <label htmlFor="hero-prompt" className="sr-only">
              {t("placeholder")}
            </label>
            <textarea
              id="hero-prompt"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              onKeyDown={(event) => {
                if ((event.metaKey || event.ctrlKey) && event.key === "Enter") start();
              }}
              maxLength={1200}
              rows={3}
              placeholder={t("placeholder")}
              className="w-full resize-none rounded-xl bg-transparent px-3 py-2 text-sm leading-relaxed text-white placeholder:text-spark-100/35 focus:outline-none"
            />
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line/60 px-2 pt-3">
              <div className="flex flex-wrap gap-1.5">
                {EXAMPLES.slice(0, 3).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setPrompt(t(key))}
                    className="rounded-full border border-line/70 px-2.5 py-1 text-[11px] text-spark-100/55 transition-colors hover:border-spark-500/50 hover:text-spark-100"
                  >
                    {t(key)}
                  </button>
                ))}
              </div>
              <Button onClick={start} disabled={prompt.trim().length < 3}>
                {t("cta")} <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <p className="mt-3 text-xs text-spark-100/40">{t("note")}</p>
        </div>

        <div className="relative hidden justify-center lg:flex">
          <div className="absolute inset-0 rounded-full bg-spark-500/20 blur-3xl" aria-hidden="true" />
          <div className="relative">
            <Mascot className="h-[22rem] w-[22rem] drop-shadow-[0_0_60px_rgba(116,80,245,0.35)]" />
            <div className="surface absolute -left-10 top-10 w-44 p-3 text-xs">
              <p className="font-medium text-white">#pravidla</p>
              <p className="mt-1 text-spark-100/50">{t("builtIn")}</p>
            </div>
            <div className="surface absolute -right-8 bottom-12 w-48 p-3 text-xs">
              <p className="font-medium text-white">🛡️ Moderátor</p>
              <p className="mt-1 text-spark-100/50">Manage Messages · Kick</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

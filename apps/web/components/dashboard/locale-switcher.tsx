"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Languages } from "lucide-react";
import { cn } from "@/lib/utils";

export function LocaleSwitcher({
  current,
  compact = false,
  tone = "dark",
}: {
  current: "cs" | "en";
  compact?: boolean;
  tone?: "dark" | "light";
}) {
  const t = useTranslations("common");
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [locale, setLocale] = useState(current);
  const light = tone === "light";

  function change(next: "cs" | "en") {
    if (next === locale) return;
    setLocale(next);
    startTransition(async () => {
      await fetch("/api/locale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: next, path: pathname }),
      });
      router.refresh();
    });
  }

  return (
    <div
      role="group"
      aria-label={t("language")}
      className={cn(
        "inline-flex items-center",
        light ? "gap-1" : "gap-1 rounded-full border border-line bg-ink-900/70 p-0.5",
        pending && "opacity-70",
      )}
    >
      {!compact ? (
        <Languages
          className={cn("ml-1.5 h-3.5 w-3.5", light ? "text-graphite-400" : "text-spark-100/50")}
          aria-hidden="true"
        />
      ) : null}
      {(["cs", "en"] as const).map((code, index) => (
        <span key={code} className="inline-flex items-center">
          {index > 0 ? (
            <span className={cn("px-0.5", light ? "text-graphite/25" : "text-spark-100/25")}>
              /
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => change(code)}
            aria-pressed={locale === code}
            className={cn(
              "focus-ring font-mono uppercase tracking-label transition-colors",
              light
                ? cn(
                    "px-1 py-1 text-[11px]",
                    locale === code
                      ? "text-graphite underline decoration-1 underline-offset-4"
                      : "text-graphite-400 hover:text-graphite",
                  )
                : cn(
                    "rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide",
                    locale === code
                      ? "bg-spark-500/20 text-spark-200"
                      : "text-spark-100/45 hover:text-spark-100",
                  ),
            )}
          >
            {code}
          </button>
        </span>
      ))}
    </div>
  );
}

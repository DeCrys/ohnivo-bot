"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export function LocaleSwitcher({ current, compact = false }: { current: "cs" | "en"; compact?: boolean }) {
  const t = useTranslations("common");
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [locale, setLocale] = useState(current);

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
        "inline-flex items-center gap-0.5 rounded-pill border border-wire bg-void-900/40 px-1",
        pending && "opacity-70",
      )}
    >
      {(["cs", "en"] as const).map((code, index) => (
        <span key={code} className="inline-flex items-center">
          {index > 0 ? (
            <span aria-hidden="true" className="px-0.5 text-chalk-500">
              /
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => change(code)}
            aria-pressed={locale === code}
            className={cn(
              "focus-ring inline-flex min-h-[38px] min-w-[38px] items-center justify-center rounded-pill text-[12px] transition-colors duration-150 motion-reduce:transition-none",
              compact ? "" : "px-3",
              locale === code
                ? "bg-white/[0.06] text-white"
                : "text-chalk-500 hover:bg-white/[0.04] hover:text-white",
            )}
          >
            {code}
          </button>
        </span>
      ))}
    </div>
  );
}

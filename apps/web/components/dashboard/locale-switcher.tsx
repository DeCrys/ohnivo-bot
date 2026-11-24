"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Languages } from "lucide-react";
import { cn } from "@/lib/utils";

export function LocaleSwitcher({ current, compact = false }: { current: "cs" | "en"; compact?: boolean }) {
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
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-line bg-ink-900/70 p-0.5",
        pending && "opacity-70",
      )}
      aria-label="Language"
    >
      {!compact ? <Languages className="ml-1.5 h-3.5 w-3.5 text-spark-100/50" /> : null}
      {(["cs", "en"] as const).map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => change(code)}
          className={cn(
            "rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide transition-colors",
            locale === code
              ? "bg-spark-500/20 text-spark-200"
              : "text-spark-100/45 hover:text-spark-100",
          )}
          aria-pressed={locale === code}
        >
          {code}
        </button>
      ))}
    </div>
  );
}

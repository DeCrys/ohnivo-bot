"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { RefreshCw } from "lucide-react";

export function PresenceRefresh({ guildId }: { guildId: string }) {
  const router = useRouter();
  const t = useTranslations("dashboard");
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState(t("checkBot"));

  function refresh() {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/guilds/${guildId}/presence`, { method: "POST" });
        if (!response.ok) setTitle(t("checkFailed"));
        router.refresh();
      } catch {
        setTitle(t("checkFailed"));
      }
    });
  }

  return (
    <button
      type="button"
      onClick={refresh}
      disabled={pending}
      title={title}
      aria-label={title}
      className="focus-ring inline-flex h-8 w-8 items-center justify-center rounded-pill border border-wire bg-white/[0.02] text-chalk-500 transition-colors hover:border-wire-strong hover:bg-white/[0.05] hover:text-white disabled:opacity-50 motion-reduce:transition-none"
    >
      <RefreshCw
        className={pending ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"}
        aria-hidden="true"
      />
    </button>
  );
}

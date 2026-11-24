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
      className="focus-ring rounded-lg border border-line p-1.5 text-spark-100/45 transition-colors hover:text-white disabled:opacity-50"
    >
      <RefreshCw className={pending ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />
    </button>
  );
}

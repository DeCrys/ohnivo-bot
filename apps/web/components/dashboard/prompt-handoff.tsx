"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowRight, Server } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";

interface GuildOption {
  id: string;
  name: string;
  icon: string | null;
}

export function PromptHandoff({ guilds }: { guilds: GuildOption[] }) {
  const router = useRouter();
  const t = useTranslations("dashboard");

  useEffect(() => {
    if (guilds.length === 1 && guilds[0]) {
      router.replace(`/dashboard/${guilds[0].id}/ai/new`);
    }
  }, [guilds, router]);

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {guilds.map((guild) => (
        <Link
          key={guild.id}
          href={`/dashboard/${guild.id}/ai/new`}
          className="surface flex items-center gap-3 p-4 transition-colors hover:border-spark-500/40"
        >
          <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-lg border border-line bg-ink-800">
            {guild.icon ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={guild.icon} alt="" className="h-full w-full object-cover" />
            ) : (
              <Server className="h-4 w-4 text-spark-300" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{guild.name}</p>
            <p className="text-xs text-spark-100/45">{t("aiBuilder")}</p>
          </div>
          <ArrowRight className="h-4 w-4 text-spark-300" />
        </Link>
      ))}
      {guilds.length === 0 ? (
        <p className="text-sm text-spark-100/50">{t("emptyBody")}</p>
      ) : null}
      {guilds.length > 1 ? (
        <div className="sm:col-span-2">
          <Link href="/dashboard" className={buttonClasses("ghost", "sm")}>
            {t("nav.backToServers")}
          </Link>
        </div>
      ) : null}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight, Server } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";

interface GuildOption {
  id: string;
  name: string;
  icon: string | null;
}

export function PromptHandoff({ guilds }: { guilds: GuildOption[] }) {
  const t = useTranslations("dashboard");

  return (
    <div>
      {guilds.length === 0 ? (
        <p className="text-[13px] text-chalk-500">{t("emptyBody")}</p>
      ) : (
        <div className="space-y-2">
          {guilds.map((guild, index) => (
            <Link
              key={guild.id}
              href={`/dashboard/new/${guild.id}`}
              className="ledger-row pad grid grid-cols-[3rem_minmax(0,1fr)_auto] items-center gap-4"
            >
              <span className="text-[12px] leading-none tabular-nums text-chalk-500">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-inner border border-wire bg-void-800">
                  {guild.icon ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={guild.icon} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Server className="h-4 w-4 text-spark-300" aria-hidden="true" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-medium leading-snug text-white">
                    {guild.name}
                  </p>
                  <p className="mt-1 text-[12px] text-chalk-500">{t("chooseMethodHint")}</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-spark-300" aria-hidden="true" />
            </Link>
          ))}
        </div>
      )}

      <div className="mt-8">
        <Link href="/dashboard/servers" className={buttonClasses("secondary", "sm")}>
          {t("nav.backToServers")}
        </Link>
      </div>
    </div>
  );
}

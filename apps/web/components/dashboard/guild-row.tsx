import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowRight, Download, Server } from "lucide-react";
import type { GuildRow } from "@/lib/types";
import { guildIconUrl } from "@/lib/discord";
import { PresenceRefresh } from "./presence-refresh";

/**
 * One row of the server ledger: index, server, bot state, actions.
 * Hairlines separate the rows, the whole row is clickable through the
 * "open server" action and the hover state is a single tonal step.
 */
export async function GuildRow({
  guild,
  index,
  inviteUrl,
}: {
  guild: GuildRow;
  index: number;
  inviteUrl: string | null;
}) {
  const t = await getTranslations("dashboard");
  const icon = guildIconUrl(guild.id, guild.icon, 128);

  return (
    <div className="ledger-row pad grid grid-cols-[3rem_minmax(0,1fr)] gap-x-4 gap-y-3 sm:grid-cols-[3rem_minmax(0,1fr)_11rem_auto]">
      <span className="text-[12px] leading-none tabular-nums text-chalk-500">
        {String(index).padStart(2, "0")}
      </span>

      <div className="flex min-w-0 items-center gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-inner border border-wire bg-void-800">
          {icon ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={icon} alt="" className="h-full w-full object-cover" />
          ) : (
            <Server className="h-4 w-4 text-spark-300" aria-hidden="true" />
          )}
        </div>
        <p className="truncate text-[15px] font-medium leading-snug text-white">{guild.name}</p>
      </div>

      <div className="col-span-2 flex items-center gap-2 sm:col-span-1">
        {guild.bot_present ? (
          <span className="tag-accent">
            <span className="h-1.5 w-1.5 rounded-pill bg-spark-300" aria-hidden="true" />
            {t("installed")}
          </span>
        ) : (
          <span className="tag-warn">
            <span className="h-1.5 w-1.5 rounded-pill bg-amber-400" aria-hidden="true" />
            {t("notInstalled")}
          </span>
        )}
        <PresenceRefresh guildId={guild.id} />
      </div>

      <div className="col-span-2 flex flex-wrap items-center gap-2 sm:col-span-1 sm:justify-end">
        <Link
          href={`/dashboard/${guild.id}`}
          className="btn-wire focus-ring h-9 shrink-0 px-3"
        >
          {t("open")} <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
        {!guild.bot_present && inviteUrl ? (
          <a
            href={inviteUrl}
            target="_blank"
            rel="noreferrer"
            className="btn-hatch focus-ring h-9 shrink-0 px-3"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" /> {t("install")}
          </a>
        ) : null}
      </div>
    </div>
  );
}

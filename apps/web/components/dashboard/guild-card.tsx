import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowRight, Download, Server } from "lucide-react";
import type { GuildRow } from "@/lib/types";
import { guildIconUrl } from "@/lib/discord";
import { Badge } from "@/components/ui/primitives";
import { buttonClasses } from "@/components/ui/button";
import { PresenceRefresh } from "./presence-refresh";

export async function GuildCard({ guild, inviteUrl }: { guild: GuildRow; inviteUrl: string | null }) {
  const t = await getTranslations("dashboard");
  const icon = guildIconUrl(guild.id, guild.icon, 128);

  return (
    <div className="surface flex flex-col gap-4 p-5 transition-colors hover:border-spark-500/30">
      <div className="flex items-start gap-3">
        <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl border border-line bg-ink-800">
          {icon ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={icon} alt="" className="h-full w-full object-cover" />
          ) : (
            <Server className="h-5 w-5 text-spark-300" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-white">{guild.name}</h3>
          <div className="mt-1.5">
            {guild.bot_present ? (
              <Badge variant="success">● {t("installed")}</Badge>
            ) : (
              <Badge variant="warning">{t("notInstalled")}</Badge>
            )}
          </div>
        </div>
        <PresenceRefresh guildId={guild.id} />
      </div>

      <div className="mt-auto flex flex-wrap gap-2">
        <Link href={`/dashboard/${guild.id}`} className={buttonClasses("secondary", "sm")}>
          {t("open")} <ArrowRight className="h-3.5 w-3.5" />
        </Link>
        {!guild.bot_present && inviteUrl ? (
          <a
            href={inviteUrl}
            target="_blank"
            rel="noreferrer"
            className={buttonClasses("primary", "sm")}
          >
            <Download className="h-3.5 w-3.5" /> {t("install")}
          </a>
        ) : null}
      </div>
    </div>
  );
}

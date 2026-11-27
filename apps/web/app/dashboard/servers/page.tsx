import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { getManagedGuilds } from "@/lib/guilds";
import { getBotInviteUrl } from "@/lib/discord";
import { GuildRow } from "@/components/dashboard/guild-row";
import { RefreshGuildsButton } from "@/components/dashboard/refresh-guilds";
import { EmptyState } from "@/components/ui/primitives";
import { PageHeader } from "@/components/ui/page-header";

export const dynamic = "force-dynamic";

export default async function ServersPage() {
  const session = await requireUser();
  const t = await getTranslations("dashboard");
  const guilds = await getManagedGuilds(session.user.id);
  const genericInvite = getBotInviteUrl();

  return (
    <div>
      <PageHeader
        index="02"
        label={t("indexLabel")}
        lead={t("statementLead")}
        title={t("statement")}
        subtitle={t("subtitle")}
        actions={
          <>
            <Link href="/dashboard/new" className="btn-hatch focus-ring">
              {t("newServer")}
            </Link>
            <RefreshGuildsButton label={t("refresh")} doneLabel={t("refreshDone")} />
          </>
        }
      />

      {guilds.length === 0 ? (
        <div className="pad py-10 lg:py-14">
          <EmptyState
            title={t("emptyTitle")}
            body={t("emptyBody")}
            action={
              genericInvite ? (
                <a href={genericInvite} target="_blank" rel="noreferrer" className="btn-hatch focus-ring">
                  {t("addBot")} <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              ) : null
            }
          />
        </div>
      ) : (
        <div>
          <div className="ledger-head pad hidden grid-cols-[3rem_minmax(0,1fr)_11rem_auto] sm:grid">
            <span className="mono-label">{t("ledgerIndex")}</span>
            <span className="mono-label">{t("ledgerServer")}</span>
            <span className="mono-label">{t("botStatus")}</span>
            <span className="mono-label sm:text-right">{t("ledgerAction")}</span>
          </div>

          {guilds.map((guild, index) => (
            <GuildRow
              key={guild.id}
              guild={guild}
              index={index + 1}
              inviteUrl={getBotInviteUrl(guild.id)}
            />
          ))}

          <p className="pad py-4 text-[13px] text-chalk-500">
            {t("serversCount", { count: guilds.length })}
          </p>
        </div>
      )}
    </div>
  );
}

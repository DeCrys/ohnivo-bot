import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowRight, Plus } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { getManagedGuilds } from "@/lib/guilds";
import { getBotInviteUrl } from "@/lib/discord";
import { GuildCard } from "@/components/dashboard/guild-card";
import { RefreshGuildsButton } from "@/components/dashboard/refresh-guilds";
import { EmptyState } from "@/components/ui/primitives";
import { buttonClasses } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await requireUser();
  const t = await getTranslations("dashboard");
  const guilds = await getManagedGuilds(session.user.id);
  const genericInvite = getBotInviteUrl();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">{t("title")}</h1>
          <p className="mt-1 text-sm text-spark-100/60">{t("subtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <RefreshGuildsButton label={t("refresh")} doneLabel={t("refreshDone")} />
          <Link href="/dashboard/new" className={buttonClasses("primary", "sm")}>
            <Plus className="h-4 w-4" /> {t("newServer")}
          </Link>
        </div>
      </div>

      {guilds.length === 0 ? (
        <EmptyState
          title={t("emptyTitle")}
          body={t("emptyBody")}
          action={
            genericInvite ? (
              <a
                href={genericInvite}
                target="_blank"
                rel="noreferrer"
                className={buttonClasses("primary", "md")}
              >
                {t("addBot")} <ArrowRight className="h-4 w-4" />
              </a>
            ) : null
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {guilds.map((guild) => (
            <GuildCard key={guild.id} guild={guild} inviteUrl={getBotInviteUrl(guild.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

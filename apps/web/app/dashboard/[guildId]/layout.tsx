import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireUser } from "@/lib/auth/session";
import { assertGuildAccess } from "@/lib/guild-access";
import { guildIconUrl } from "@/lib/discord";
import { GuildSidebar } from "@/components/dashboard/guild-sidebar";
import { Badge } from "@/components/ui/primitives";

export const dynamic = "force-dynamic";

export default async function GuildLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { guildId: string };
}) {
  const session = await requireUser();
  let access;
  try {
    access = await assertGuildAccess(session.user.id, params.guildId);
  } catch {
    redirect("/dashboard/servers");
  }
  const t = await getTranslations("dashboard");

  return (
    <div className="pad grid gap-8 py-10 lg:grid-cols-[220px_minmax(0,1fr)] lg:py-12">
      <GuildSidebar
        guildId={access.guild.id}
        guildName={access.guild.name}
        guildIcon={guildIconUrl(access.guild.id, access.guild.icon, 64)}
      />
      <div className="min-w-0">
        <div className="mb-8 flex flex-wrap items-center gap-3 border-b border-wire pb-5">
          <h1 className="display truncate text-[clamp(1.35rem,2.2vw,1.75rem)] leading-tight text-chalk">
            {access.guild.name}
          </h1>
          {access.guild.bot_present ? (
            <Badge variant="success">
              <span className="h-1.5 w-1.5 rounded-pill bg-spark-300" aria-hidden="true" />
              {t("botOnline")}
            </Badge>
          ) : (
            <Badge variant="warning">
              <span className="h-1.5 w-1.5 rounded-pill bg-amber-400" aria-hidden="true" />
              {t("botOffline")}
            </Badge>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}

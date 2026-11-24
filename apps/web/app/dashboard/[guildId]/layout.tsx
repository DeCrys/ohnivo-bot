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
    redirect("/dashboard");
  }
  const t = await getTranslations("dashboard");

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
      <GuildSidebar
        guildId={access.guild.id}
        guildName={access.guild.name}
        guildIcon={guildIconUrl(access.guild.id, access.guild.icon, 64)}
      />
      <div className="min-w-0">
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <h1 className="truncate text-xl font-semibold tracking-tight text-white">
            {access.guild.name}
          </h1>
          {access.guild.bot_present ? (
            <Badge variant="success">● {t("botOnline")}</Badge>
          ) : (
            <Badge variant="warning">{t("botOffline")}</Badge>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}

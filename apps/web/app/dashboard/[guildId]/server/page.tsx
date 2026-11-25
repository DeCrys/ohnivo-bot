import { getTranslations } from "next-intl/server";
import { BOT_INSTALL_PERMISSIONS } from "@ohnivo/shared";
import { requireUser } from "@/lib/auth/session";
import { assertGuildAccess } from "@/lib/guild-access";
import { getBotInviteUrl } from "@/lib/discord";
import { Alert, Card } from "@/components/ui/primitives";
import { buttonClasses } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function GuildServerPage({ params }: { params: { guildId: string } }) {
  const session = await requireUser();
  const access = await assertGuildAccess(session.user.id, params.guildId);
  const t = await getTranslations("dashboard.guild");
  const invite = getBotInviteUrl(access.guild.id);

  return (
    <div className="space-y-4">
      <Card>
        <h2 className="text-sm font-semibold text-white">{t("serverTitle")}</h2>
        <p className="mt-1 text-xs text-spark-100/50">{t("serverBody")}</p>
        <dl className="mt-4 grid gap-3 text-xs sm:grid-cols-2">
          <div>
            <dt className="text-spark-100/40">ID</dt>
            <dd className="mt-0.5 font-mono text-spark-100/80">{access.guild.id}</dd>
          </div>
          <div>
            <dt className="text-spark-100/40">{t("owner")}</dt>
            <dd className="mt-0.5 text-spark-100/80">
              {access.member.is_owner ? t("isOwnerYes") : t("isOwnerNo")}
            </dd>
          </div>
        </dl>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold text-white">{t("botPermissions")}</h2>
        <p className="mt-1 text-xs text-spark-100/50">{t("botPermissionsNote")}</p>
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {BOT_INSTALL_PERMISSIONS.map((permission) => (
            <li
              key={permission}
              className="rounded-md border border-line bg-ink-900 px-2 py-1 font-mono text-[11px] text-spark-200"
            >
              {permission}
            </li>
          ))}
        </ul>
        {invite ? (
          <a href={invite} target="_blank" rel="noreferrer" className={buttonClasses("secondary", "sm", "mt-4")}>
            {t("invite")}
          </a>
        ) : null}
      </Card>

      <Alert variant="warning" title={t("roleHierarchyTitle")}>
        {t("roleHierarchyBody")}
      </Alert>
    </div>
  );
}

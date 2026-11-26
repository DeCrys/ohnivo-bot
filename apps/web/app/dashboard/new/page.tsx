import { getTranslations } from "next-intl/server";
import { requireUser } from "@/lib/auth/session";
import { getManagedGuilds } from "@/lib/guilds";
import { guildIconUrl } from "@/lib/discord";
import { PromptHandoff } from "@/components/dashboard/prompt-handoff";
import { PageHeader } from "@/components/ui/page-header";

export const dynamic = "force-dynamic";

export default async function NewServerPage() {
  const session = await requireUser();
  const t = await getTranslations("dashboard");
  const guilds = await getManagedGuilds(session.user.id);

  return (
    <div>
      <PageHeader
        index="01"
        label={t("nav.new")}
        title={t("chooseServer")}
        subtitle={t("chooseServerBody")}
      />
      <div className="pad py-10 lg:py-12">
        <PromptHandoff
          guilds={guilds.map((guild) => ({
            id: guild.id,
            name: guild.name,
            icon: guildIconUrl(guild.id, guild.icon, 64),
          }))}
        />
      </div>
    </div>
  );
}

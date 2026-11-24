import { getTranslations } from "next-intl/server";
import { requireUser } from "@/lib/auth/session";
import { getManagedGuilds } from "@/lib/guilds";
import { guildIconUrl } from "@/lib/discord";
import { PromptHandoff } from "@/components/dashboard/prompt-handoff";

export const dynamic = "force-dynamic";

export default async function NewServerPage() {
  const session = await requireUser();
  const t = await getTranslations("dashboard");
  const guilds = await getManagedGuilds(session.user.id);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">{t("chooseServer")}</h1>
        <p className="mt-1 text-sm text-spark-100/60">{t("chooseServerBody")}</p>
      </div>
      <PromptHandoff
        guilds={guilds.map((guild) => ({
          id: guild.id,
          name: guild.name,
          icon: guildIconUrl(guild.id, guild.icon, 64),
        }))}
      />
    </div>
  );
}

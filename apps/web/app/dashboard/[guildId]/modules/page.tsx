import { getTranslations } from "next-intl/server";
import { Blocks } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { assertGuildAccess } from "@/lib/guild-access";
import { Mascot } from "@/components/brand/mascot";
import { Badge } from "@/components/ui/primitives";

export const dynamic = "force-dynamic";

export default async function ModulesPage({ params }: { params: { guildId: string } }) {
  const session = await requireUser();
  await assertGuildAccess(session.user.id, params.guildId);
  const t = await getTranslations("dashboard.guild");
  const tc = await getTranslations("common");

  return (
    <div className="panel flex flex-col items-center px-6 py-14 text-center">
      <Mascot className="h-32 w-32" />
      <div className="mt-2 flex items-center gap-2">
        <Blocks className="h-4 w-4 text-spark-300" aria-hidden="true" />
        <h2 className="display text-xl leading-tight text-chalk">{t("modulesSoon")}</h2>
      </div>
      <Badge variant="soon" className="mt-4">
        {tc("comingSoon")}
      </Badge>
    </div>
  );
}

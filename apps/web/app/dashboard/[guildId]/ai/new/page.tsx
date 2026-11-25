import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { CREDIT_COSTS } from "@ohnivo/shared";
import { canUsePaidAi } from "@/lib/auth/admin";
import { requireUser } from "@/lib/auth/session";
import { assertGuildAccess } from "@/lib/guild-access";
import { getCreditBalance } from "@/lib/credits";
import { isDemoMode } from "@/lib/ai/service";
import { PromptForm } from "@/components/ai/prompt-form";
import { Alert } from "@/components/ui/primitives";
import { buttonClasses } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function NewBlueprintPage({ params }: { params: { guildId: string } }) {
  const session = await requireUser();
  await assertGuildAccess(session.user.id, params.guildId);
  const t = await getTranslations("ai.new");
  const balance = await getCreditBalance(session.user.id);
  const canUseAi = canUsePaidAi(session.user);
  const demo = isDemoMode();

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link
        href={`/dashboard/${params.guildId}`}
        className="inline-flex items-center gap-1.5 text-xs text-spark-100/45 hover:text-white"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> {t("back")}
      </Link>
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-white">{t("title")}</h2>
        <p className="mt-1 text-sm leading-relaxed text-spark-100/60">{t("subtitle")}</p>
      </div>

      {!canUseAi ? (
        <Alert variant="warning" title={t("planRequired")}>
          <p>{t("planRequiredBody")}</p>
          <Link href="/dashboard/billing" className={buttonClasses("primary", "sm", "mt-3")}>
            {t("buyCredits")}
          </Link>
        </Alert>
      ) : null}

      <PromptForm
        guildId={params.guildId}
        cost={CREDIT_COSTS.generate}
        balance={balance}
        canUseAi={canUseAi}
        demo={demo}
      />
    </div>
  );
}

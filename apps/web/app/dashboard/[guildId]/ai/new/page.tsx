import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { isDemoMode } from "@/lib/ai/service";
import { requireUser } from "@/lib/auth/session";
import { assertGuildAccess } from "@/lib/guild-access";
import { generationAccess, getGenerationUsage } from "@/lib/usage-limits";
import { PromptForm } from "@/components/ai/prompt-form";
import { Alert } from "@/components/ui/primitives";
import { buttonClasses } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function NewBlueprintPage({ params }: { params: { guildId: string } }) {
  const session = await requireUser();
  await assertGuildAccess(session.user.id, params.guildId);
  const t = await getTranslations("ai.new");
  const used = await getGenerationUsage(session.user.id);
  const quota = generationAccess(session.user, used);
  const demo = isDemoMode();

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link
        href={`/dashboard/${params.guildId}`}
        className="mono-label focus-ring inline-flex min-h-[44px] items-center gap-2 rounded-control text-chalk-500 transition-colors hover:text-chalk motion-reduce:transition-none"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> {t("back")}
      </Link>
      <div className="border-b border-wire pb-6">
        <h2 className="display text-[clamp(1.35rem,2.2vw,1.75rem)] leading-[1.12] text-chalk">
          {t("title")}
        </h2>
        <p className="mt-3 max-w-[52ch] text-[15px] leading-relaxed text-chalk-400">{t("subtitle")}</p>
      </div>

      {quota.planRequired ? (
        <Alert variant="warning" title={t("planRequired")}>
          <p>{t("planRequiredBody")}</p>
          <Link href="/dashboard/billing" className={buttonClasses("primary", "sm", "mt-3")}>
            {t("viewPlans")}
          </Link>
        </Alert>
      ) : null}

      <PromptForm guildId={params.guildId} quota={quota} demo={demo} />
    </div>
  );
}

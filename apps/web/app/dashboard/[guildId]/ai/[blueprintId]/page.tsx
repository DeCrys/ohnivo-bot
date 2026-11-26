import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { CREDIT_COSTS } from "@ohnivo/shared";
import { requireUser } from "@/lib/auth/session";
import { assertGuildAccess } from "@/lib/guild-access";
import { getCreditBalance } from "@/lib/credits";
import { getServiceClient } from "@/lib/supabase/service";
import type { ApplyJobRow, BlueprintRow } from "@/lib/types";
import { BlueprintEditor } from "@/components/ai/blueprint-editor";
import { Alert } from "@/components/ui/primitives";

export const dynamic = "force-dynamic";

export default async function BlueprintPreviewPage({
  params,
}: {
  params: { guildId: string; blueprintId: string };
}) {
  const session = await requireUser();
  await assertGuildAccess(session.user.id, params.guildId);
  const t = await getTranslations("ai.preview");
  const ta = await getTranslations("ai.apply");
  const tc = await getTranslations("common");

  const service = getServiceClient();
  const { data } = await service
    .from("blueprints")
    .select("*")
    .eq("id", params.blueprintId)
    .eq("guild_id", params.guildId)
    .eq("user_id", session.user.id)
    .maybeSingle();
  if (!data) notFound();
  const blueprint = data as BlueprintRow;

  const [balance, activeJobResult] = await Promise.all([
    getCreditBalance(session.user.id),
    service
      .from("apply_jobs")
      .select("*")
      .eq("blueprint_id", blueprint.id)
      .in("status", ["queued", "running"])
      .maybeSingle(),
  ]);
  const activeJob = (activeJobResult.data as ApplyJobRow | null) ?? null;

  return (
    <div className="space-y-5">
      <Link
        href={`/dashboard/${params.guildId}`}
        className="mono-label focus-ring inline-flex min-h-[44px] items-center gap-2 rounded-control text-chalk-500 transition-colors hover:text-chalk motion-reduce:transition-none"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> {t("back")}
      </Link>
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-wire pb-6">
        <div>
          <h2 className="display text-[clamp(1.35rem,2.2vw,1.75rem)] leading-[1.12] text-chalk">
            {t("title")}
          </h2>
          <p className="mt-3 max-w-[52ch] text-[15px] leading-relaxed text-chalk-400">{t("subtitle")}</p>
        </div>
        <p className="text-[12px] text-chalk-500">
          {t("serverName")}: <span className="text-chalk-300">{blueprint.data.serverName}</span>
        </p>
      </div>

      {activeJob ? (
        <Alert variant="info">
          <Link
            href={`/dashboard/${params.guildId}/apply/${activeJob.id}`}
            className="font-medium text-spark-200 hover:text-chalk"
          >
            {ta("title")} →
          </Link>{" "}
          ({tc(`jobStatus.${activeJob.status}`)})
        </Alert>
      ) : null}

      <BlueprintEditor
        guildId={params.guildId}
        blueprintId={blueprint.id}
        initial={blueprint.data}
        initialIssues={blueprint.issues ?? []}
        initialRemoved={blueprint.removed_permissions ?? []}
        refineCost={CREDIT_COSTS.refine}
        regenerateCost={CREDIT_COSTS.regenerate}
        canSpendCredits={balance >= CREDIT_COSTS.refine}
        balance={balance}
      />
    </div>
  );
}

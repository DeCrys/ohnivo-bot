import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { CREDIT_COSTS } from "@ohnivo/shared";
import { canUsePaidAi } from "@/lib/auth/admin";
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
        className="inline-flex items-center gap-1.5 text-xs text-spark-100/45 hover:text-white"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> {t("back")}
      </Link>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-white">{t("title")}</h2>
          <p className="mt-1 text-sm text-spark-100/60">{t("subtitle")}</p>
        </div>
        <p className="text-xs text-spark-100/40">
          {t("serverName")}: <span className="text-spark-100/70">{blueprint.data.serverName}</span>
        </p>
      </div>

      {activeJob ? (
        <Alert variant="info">
          <Link
            href={`/dashboard/${params.guildId}/apply/${activeJob.id}`}
            className="font-medium text-spark-200 hover:text-white"
          >
            {ta("title")} →
          </Link>{" "}
          ({activeJob.status})
        </Alert>
      ) : null}

      <BlueprintEditor
        guildId={params.guildId}
        blueprintId={blueprint.id}
        initial={blueprint.data}
        initialIssues={blueprint.issues ?? []}
        initialRemoved={blueprint.removed_permissions ?? []}
        refineCost={CREDIT_COSTS.refine}
        regenerateCost={CREDIT_COSTS.generate}
        canUseAi={canUsePaidAi(session.user)}
        balance={balance}
      />
    </div>
  );
}

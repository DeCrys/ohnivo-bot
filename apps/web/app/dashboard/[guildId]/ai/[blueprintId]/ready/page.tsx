import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowLeft, Coins, Image as ImageIcon, Sparkles } from "lucide-react";
import {
  blueprintStats,
  CREDIT_COSTS,
  isPaidPlan,
} from "@ohnivo/shared";
import { requireUser } from "@/lib/auth/session";
import { assertGuildAccess } from "@/lib/guild-access";
import { getCreditBalance } from "@/lib/credits";
import { getServiceClient } from "@/lib/supabase/service";
import type { ApplyJobRow, BlueprintRow } from "@/lib/types";
import { ReadyPanel } from "@/components/ai/ready-panel";
import { Badge, Card } from "@/components/ui/primitives";

export const dynamic = "force-dynamic";

export default async function ReadyPage({
  params,
}: {
  params: { guildId: string; blueprintId: string };
}) {
  const session = await requireUser();
  const access = await assertGuildAccess(session.user.id, params.guildId);
  const t = await getTranslations("ai.ready");
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

  const { data: activeJob } = await service
    .from("apply_jobs")
    .select("*")
    .eq("blueprint_id", blueprint.id)
    .in("status", ["queued", "running"])
    .maybeSingle();
  if (activeJob) {
    redirect(`/dashboard/${params.guildId}/apply/${(activeJob as ApplyJobRow).id}`);
  }

  const [balance] = await Promise.all([getCreditBalance(session.user.id)]);
  const stats = blueprintStats(blueprint.data);
  const cost = CREDIT_COSTS.apply;
  const canUseAi = isPaidPlan(session.user.plan);

  const summary = [
    { label: t("categories"), value: stats.categories },
    { label: t("channels"), value: stats.channels },
    { label: t("roles"), value: stats.roles },
    { label: t("overwrites"), value: stats.overwrites },
    { label: t("rules"), value: stats.rules },
    { label: t("welcomeMsg"), value: blueprint.data.welcome.channel ? 1 : 0 },
  ];

  const assets = [
    { label: t("icon"), cost: CREDIT_COSTS.imageIcon },
    { label: t("banners"), cost: CREDIT_COSTS.imageBanner },
    { label: t("emoji"), cost: CREDIT_COSTS.imageEmoji },
    { label: t("stickers"), cost: CREDIT_COSTS.imageSticker },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link
        href={`/dashboard/${params.guildId}/ai/${params.blueprintId}`}
        className="inline-flex items-center gap-1.5 text-xs text-spark-100/45 hover:text-white"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> {tc("back")}
      </Link>
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-white">{t("title")}</h2>
        <p className="mt-1 text-sm leading-relaxed text-spark-100/60">{t("subtitle")}</p>
      </div>

      <Card>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">{t("summary")}</h3>
          <Badge variant="soon">{blueprint.data.serverName}</Badge>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {summary.map((item) => (
            <div key={item.label} className="rounded-lg border border-line/60 bg-ink-900/50 px-3 py-2">
              <dt className="text-[11px] uppercase tracking-wide text-spark-100/40">{item.label}</dt>
              <dd className="mt-0.5 text-lg font-semibold text-white">{item.value}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-white">{t("welcomeMsg")}</h3>
        <p className="mt-1 text-xs text-spark-100/50">#{blueprint.data.welcome.channel || "—"}</p>
        {blueprint.data.welcome.message ? (
          <p className="mt-3 whitespace-pre-line rounded-lg border border-line/60 bg-ink-900/60 p-3 text-xs leading-relaxed text-spark-100/70">
            {blueprint.data.welcome.message}
          </p>
        ) : (
          <p className="mt-3 text-xs text-spark-100/40">{t("welcomeMsg")}: —</p>
        )}
        {blueprint.data.rules.length > 0 ? (
          <ol className="mt-3 list-inside list-decimal space-y-1 text-xs text-spark-100/55">
            {blueprint.data.rules.map((rule, index) => (
              <li key={index}>{rule}</li>
            ))}
          </ol>
        ) : null}
      </Card>

      <Card>
        <div className="flex items-start gap-3">
          <ImageIcon className="mt-0.5 h-4 w-4 shrink-0 text-spark-300" />
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold text-white">{t("assets")}</h3>
              <Badge variant="soon">{t("soon")}</Badge>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-spark-100/50">{t("assetsBody")}</p>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {assets.map((asset) => (
                <li
                  key={asset.label}
                  className="flex items-center justify-between rounded-lg border border-line/50 bg-ink-900/40 px-3 py-2 text-xs"
                >
                  <span className="text-spark-100/70">{asset.label}</span>
                  <span className="flex items-center gap-1 text-spark-100/40">
                    <Coins className="h-3 w-3" /> {asset.cost}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>

      <ReadyPanel
        guildId={params.guildId}
        blueprintId={params.blueprintId}
        cost={cost}
        balance={balance}
        canUseAi={canUseAi}
        botPresent={access.guild.bot_present}
      />

      <Card>
        <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
          <Sparkles className="h-4 w-4 text-spark-300" /> {t("faqTitle")}
        </h3>
        <div className="mt-3 space-y-2">
          <details className="rounded-lg border border-line/50 bg-ink-900/40 px-3 py-2">
            <summary className="cursor-pointer text-xs font-medium text-white">{t("faq1q")}</summary>
            <p className="mt-2 text-[11px] leading-relaxed text-spark-100/55">{t("faq1a")}</p>
          </details>
          <details className="rounded-lg border border-line/50 bg-ink-900/40 px-3 py-2">
            <summary className="cursor-pointer text-xs font-medium text-white">{t("faq2q")}</summary>
            <p className="mt-2 text-[11px] leading-relaxed text-spark-100/55">{t("faq2a")}</p>
          </details>
        </div>
      </Card>
    </div>
  );
}

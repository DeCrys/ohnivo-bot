import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  ArrowRight,
  Blocks,
  Image as ImageIcon,
  Sparkles,
  Wand2,
} from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { assertGuildAccess } from "@/lib/guild-access";
import { getCreditBalance } from "@/lib/credits";
import { getBotInviteUrl } from "@/lib/discord";
import { getServiceClient } from "@/lib/supabase/service";
import type { ApplyJobRow, BlueprintRow } from "@/lib/types";
import { Badge, Card } from "@/components/ui/primitives";
import { buttonClasses } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function GuildHomePage({ params }: { params: { guildId: string } }) {
  const session = await requireUser();
  const access = await assertGuildAccess(session.user.id, params.guildId);
  const t = await getTranslations("dashboard");
  const tg = await getTranslations("dashboard.guild");
  const ta = await getTranslations("ai.apply");
  const tc = await getTranslations("common");

  const service = getServiceClient();
  const [balance, blueprintsResult, jobsResult] = await Promise.all([
    getCreditBalance(session.user.id),
    service
      .from("blueprints")
      .select("*")
      .eq("guild_id", access.guild.id)
      .eq("user_id", session.user.id)
      .order("updated_at", { ascending: false })
      .limit(5),
    service
      .from("apply_jobs")
      .select("*")
      .eq("guild_id", access.guild.id)
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const blueprints = (blueprintsResult.data ?? []) as BlueprintRow[];
  const jobs = (jobsResult.data ?? []) as ApplyJobRow[];
  const invite = getBotInviteUrl(access.guild.id);

  const tools = [
    {
      icon: Sparkles,
      title: tg("build"),
      body: t("aiBuilderBody"),
      href: `/dashboard/${access.guild.id}/ai/new`,
      enabled: true,
    },
    { icon: Wand2, title: tg("edit"), body: tg("aiBody"), href: "#", enabled: false },
    { icon: ImageIcon, title: tg("graphics"), body: tg("aiBody"), href: "#", enabled: false },
  ];

  return (
    <div className="space-y-6">
      {!access.guild.bot_present && invite ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-100">
          <span>{t("notInstalled")}. {tg("botPermissions")}: Manage Channels, Manage Roles, Send Messages.</span>
          <a href={invite} target="_blank" rel="noreferrer" className={buttonClasses("primary", "sm")}>
            {t("install")} <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-spark-100/45">{t("creditsLeft")}</p>
            <p className="mt-1 text-2xl font-semibold text-white">{balance.toLocaleString("cs-CZ")}</p>
          </div>
          <Link href="/dashboard/billing" className={buttonClasses("secondary", "sm")}>
            {t("offers")}
          </Link>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-spark-100/45">{t("plan")}</p>
          <p className="mt-1 text-lg font-semibold capitalize text-white">
            {session.user.plan === "free" ? t("planFree") : session.user.plan}
          </p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-spark-100/45">{t("botStatus")}</p>
          <p className="mt-1">
            {access.guild.bot_present ? (
              <Badge variant="success">● {t("botOnline")}</Badge>
            ) : (
              <Badge variant="warning">{t("botOffline")}</Badge>
            )}
          </p>
        </Card>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-white">{tg("aiTitle")}</h2>
          <Link
            href={`/dashboard/${access.guild.id}/ai`}
            className="text-xs text-spark-300 hover:text-spark-200"
          >
            {tg("allTools")} →
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {tools.map((tool) => {
            const inner = (
              <div
                className={`surface h-full p-4 transition-colors ${
                  tool.enabled ? "hover:border-spark-500/40" : "opacity-60"
                }`}
              >
                <div className="flex items-center justify-between">
                  <tool.icon className="h-4 w-4 text-spark-300" />
                  {!tool.enabled ? <Badge variant="soon">{tg("soon")}</Badge> : null}
                </div>
                <p className="mt-3 text-sm font-medium text-white">{tool.title}</p>
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-spark-100/50">{tool.body}</p>
              </div>
            );
            return tool.enabled ? (
              <Link key={tool.title} href={tool.href}>
                {inner}
              </Link>
            ) : (
              <div key={tool.title}>{inner}</div>
            );
          })}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="surface p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">{t("recentBlueprints")}</h2>
            <Link
              href={`/dashboard/${access.guild.id}/ai/new`}
              className="text-xs text-spark-300 hover:text-spark-200"
            >
              + {t("newServer")}
            </Link>
          </div>
          {blueprints.length === 0 ? (
            <p className="text-xs text-spark-100/45">{t("noBlueprints")}</p>
          ) : (
            <ul className="divide-y divide-line/50">
              {blueprints.map((blueprint) => (
                <li key={blueprint.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <Link
                      href={`/dashboard/${access.guild.id}/ai/${blueprint.id}`}
                      className="truncate text-xs font-medium text-white hover:text-spark-200"
                    >
                      {blueprint.title}
                    </Link>
                    <p className="text-[11px] text-spark-100/40">
                      {formatDateTime(blueprint.updated_at)} · rev. {blueprint.revision}
                    </p>
                  </div>
                  <Badge variant={blueprint.status === "applied" ? "success" : "default"}>
                    {blueprint.status === "applied"
                      ? t("applied")
                      : blueprint.status === "queued"
                        ? t("queued")
                        : t("draft")}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="surface p-5">
          <h2 className="mb-3 text-sm font-semibold text-white">{ta("title")}</h2>
          {jobs.length === 0 ? (
            <p className="text-xs text-spark-100/45">{t("noJobs")}</p>
          ) : (
            <ul className="divide-y divide-line/50">
              {jobs.map((job) => (
                <li key={job.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div>
                    <Link
                      href={`/dashboard/${access.guild.id}/apply/${job.id}`}
                      className="text-xs font-medium text-white hover:text-spark-200"
                    >
                      {ta("title")} · {formatDateTime(job.created_at)}
                    </Link>
                    <p className="text-[11px] text-spark-100/40">
                      {t("channelCount", { count: job.summary?.channels ?? 0 })} ·{" "}
                      {t("costLabel", { count: job.cost })}
                    </p>
                  </div>
                  <Badge
                    variant={
                      job.status === "completed"
                        ? "success"
                        : job.status === "failed" || job.status === "rolled_back"
                          ? "danger"
                          : job.status === "running"
                            ? "info"
                            : "default"
                    }
                  >
                    {tc(`jobStatus.${job.status}`)}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="surface flex items-start gap-4 p-5">
        <Blocks className="mt-0.5 h-5 w-5 text-spark-300" />
        <div>
          <h2 className="text-sm font-semibold text-white">{t("nav.modules")}</h2>
          <p className="mt-1 text-xs leading-relaxed text-spark-100/50">{tg("modulesSoon")}</p>
          <Link
            href={`/dashboard/${access.guild.id}/modules`}
            className="mt-2 inline-block text-xs text-spark-300 hover:text-spark-200"
          >
            {t("open")} →
          </Link>
        </div>
      </section>
    </div>
  );
}

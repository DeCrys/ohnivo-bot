import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import {
  ArrowRight,
  Blocks,
  Image as ImageIcon,
  Sparkles,
} from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { assertGuildAccess } from "@/lib/guild-access";
import { getCreditBalance } from "@/lib/credits";
import { getBotInviteUrl } from "@/lib/discord";
import { getServiceClient } from "@/lib/supabase/service";
import type { ApplyJobRow, BlueprintRow } from "@/lib/types";
import { Alert, Badge, Card } from "@/components/ui/primitives";
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
  const locale = await getLocale();
  const number = new Intl.NumberFormat(locale);

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
    {
      icon: Blocks,
      title: t("setup.manualTitle"),
      body: t("setup.manualBody"),
      href: `/dashboard/${access.guild.id}/new`,
      enabled: true,
    },
    { icon: ImageIcon, title: tg("graphics"), body: tg("aiBody"), href: "#", enabled: false },
  ];

  return (
    <div className="space-y-8">
      {!access.guild.bot_present && invite ? (
        <Alert variant="warning">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>
              {t("notInstalled")}. {tg("botPermissions")}: Manage Channels, Manage Roles, Send Messages.
            </span>
            <a href={invite} target="_blank" rel="noreferrer" className={buttonClasses("primary", "sm")}>
              {t("install")} <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </div>
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="surface p-6">
          <p className="mono-label">{t("creditsLeft")}</p>
          <p className="mt-3 text-[24px] font-medium leading-none tracking-display tabular-nums text-white">
            {number.format(balance)}
          </p>
          <Link href="/dashboard/billing" className="mt-4 inline-block">
            <span className="link-rule py-1 text-[13px] text-chalk-400">{t("offers")}</span>
          </Link>
        </div>
        <div className="surface p-6">
          <p className="mono-label">{t("plan")}</p>
          <p className="mt-3 text-[20px] font-medium capitalize leading-snug text-white">
            {session.user.plan === "free" ? t("planFree") : session.user.plan}
          </p>
        </div>
        <div className="surface p-6">
          <p className="mono-label">{t("botStatus")}</p>
          <p className="mt-3">
            {access.guild.bot_present ? (
              <Badge variant="success">
                <span className="h-1.5 w-1.5 rounded-pill bg-spark-300" aria-hidden="true" />
                {t("botOnline")}
              </Badge>
            ) : (
              <Badge variant="warning">
                <span className="h-1.5 w-1.5 rounded-pill bg-amber-400" aria-hidden="true" />
                {t("botOffline")}
              </Badge>
            )}
          </p>
        </div>
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between gap-3 border-b border-wire pb-3">
          <h2 className="text-[18px] font-medium text-white">{tg("aiTitle")}</h2>
          <Link
            href={`/dashboard/${access.guild.id}/ai`}
            className="text-[13px] text-chalk-400 transition-colors hover:text-white motion-reduce:transition-none"
          >
            <span className="link-rule py-1">{tg("allTools")}</span>
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {tools.map((tool) => {
            const inner = (
              <div
                className={`surface h-full p-6 transition-colors ${
                  tool.enabled ? "hover:border-wire-strong" : "opacity-60"
                }`}
              >
                <div className="flex items-center justify-between">
                  <tool.icon className="h-4 w-4 text-spark-300" aria-hidden="true" />
                  {!tool.enabled ? <Badge variant="soon">{tg("soon")}</Badge> : null}
                </div>
                <p className="mt-5 text-[15px] font-medium text-white">{tool.title}</p>
                <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-chalk-400">
                  {tool.body}
                </p>
              </div>
            );
            return tool.enabled ? (
              <Link key={tool.title} href={tool.href} className="block h-full">
                {inner}
              </Link>
            ) : (
              <div key={tool.title} className="h-full">
                {inner}
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="surface p-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-[18px] font-medium text-white">{t("recentBlueprints")}</h2>
            <Link
              href={`/dashboard/${access.guild.id}/ai/new`}
              className="text-[13px] text-chalk-400 transition-colors hover:text-white motion-reduce:transition-none"
            >
              <span className="link-rule py-1">+ {t("newServer")}</span>
            </Link>
          </div>
          {blueprints.length === 0 ? (
            <p className="mt-4 text-[13px] text-chalk-500">{t("noBlueprints")}</p>
          ) : (
            <ul className="divide-y divide-white/5">
              {blueprints.map((blueprint) => (
                <li key={blueprint.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <Link
                      href={`/dashboard/${access.guild.id}/ai/${blueprint.id}`}
                      className="truncate text-[13px] text-chalk transition-colors hover:text-spark-200"
                    >
                      {blueprint.title}
                    </Link>
                    <p className="mt-1 text-[12px] text-chalk-500">
                      {formatDateTime(blueprint.updated_at, locale)} · rev. {blueprint.revision}
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

        <section className="surface p-6">
          <h2 className="mb-3 text-[18px] font-medium text-white">{ta("title")}</h2>
          {jobs.length === 0 ? (
            <p className="mt-4 text-[13px] text-chalk-500">{t("noJobs")}</p>
          ) : (
            <ul className="divide-y divide-white/5">
              {jobs.map((job) => (
                <li key={job.id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <Link
                      href={`/dashboard/${access.guild.id}/apply/${job.id}`}
                      className="text-[13px] text-chalk transition-colors hover:text-spark-200"
                    >
                      {ta("title")} · {formatDateTime(job.created_at, locale)}
                    </Link>
                    <p className="mt-1 text-[12px] text-chalk-500">
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

      <section className="surface flex items-start gap-4 p-6">
        <Blocks className="mt-0.5 h-5 w-5 text-spark-300" aria-hidden="true" />
        <div>
          <h2 className="text-[18px] font-medium text-white">{t("nav.modules")}</h2>
          <p className="mt-1 text-[13px] leading-relaxed text-chalk-400">{tg("modulesSoon")}</p>
          <Link
            href={`/dashboard/${access.guild.id}/modules`}
            className="mt-3 inline-block text-[13px] text-chalk-400 transition-colors hover:text-white motion-reduce:transition-none"
          >
            <span className="link-rule py-1">{t("open")}</span>
          </Link>
        </div>
      </section>
    </div>
  );
}

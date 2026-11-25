import Link from "next/link";
import { ArrowRight, Blocks, Image as ImageIcon, Sparkles, Wand2 } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { requireUser } from "@/lib/auth/session";
import { assertGuildAccess } from "@/lib/guild-access";
import { getServiceClient } from "@/lib/supabase/service";
import { AppError } from "@/lib/errors";
import { Badge, Card } from "@/components/ui/primitives";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

type BlueprintSummary = {
  id: string;
  title: string;
  updated_at: string;
};

export default async function AiToolsPage({ params }: { params: { guildId: string } }) {
  const session = await requireUser();
  await assertGuildAccess(session.user.id, params.guildId);
  const t = await getTranslations("ai.hub");

  const { data, error } = await getServiceClient()
    .from("blueprints")
    .select("id, title, updated_at")
    .eq("user_id", session.user.id)
    .eq("guild_id", params.guildId)
    .order("updated_at", { ascending: false })
    .limit(6);

  if (error) throw new AppError("unknown", `AI tool proposals could not be loaded: ${error.message}`);

  const blueprints = (data ?? []) as BlueprintSummary[];
  const tools = [
    {
      id: "create",
      icon: Sparkles,
      title: t("createTitle"),
      body: t("createBody"),
      badge: t("available"),
      href: `/dashboard/${params.guildId}/ai/new`,
    },
    {
      id: "edit",
      icon: Wand2,
      title: t("editTitle"),
      body: t("editBody"),
      badge: blueprints[0] ? t("available") : t("noDrafts"),
      href: blueprints[0] ? `/dashboard/${params.guildId}/ai/${blueprints[0].id}` : undefined,
    },
    {
      id: "creative-studio",
      icon: ImageIcon,
      title: t("creativeTitle"),
      body: t("creativeBody"),
      badge: t("comingSoon"),
    },
    {
      id: "restyle-server",
      icon: Sparkles,
      title: t("restyleTitle"),
      body: t("restyleBody"),
      badge: t("comingSoon"),
    },
    {
      id: "module-workshop",
      icon: Blocks,
      title: t("workshopTitle"),
      body: t("workshopBody"),
      badge: t("comingSoon"),
    },
  ];

  return (
    <div className="space-y-7">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-white">{t("title")}</h2>
        <p className="mt-1 text-sm text-spark-100/60">{t("subtitle")}</p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        {tools.map((tool) => {
          const content = (
            <Card className="flex h-full min-h-48 flex-col transition-colors group-hover:border-spark-500/40">
              <div className="flex items-start justify-between gap-3">
                <tool.icon className="h-5 w-5 text-spark-300" />
                <Badge variant={tool.href ? "success" : "soon"}>{tool.badge}</Badge>
              </div>
              <h3 className="mt-5 text-sm font-semibold text-white">{tool.title}</h3>
              <p className="mt-2 flex-1 text-xs leading-relaxed text-spark-100/55">{tool.body}</p>
              {tool.href ? (
                <span className="mt-4 inline-flex items-center gap-1 text-xs text-spark-300">
                  {tool.title} <ArrowRight className="h-3.5 w-3.5" />
                </span>
              ) : null}
            </Card>
          );

          return tool.href ? (
            <Link key={tool.id} href={tool.href} className="group">
              {content}
            </Link>
          ) : (
            <div key={tool.id} id={tool.id} aria-disabled="true" className="opacity-65">
              {content}
            </div>
          );
        })}
      </section>

      <section id="recent-drafts" className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-white">{t("recentDrafts")}</h3>
        </div>
        {blueprints.length === 0 ? (
          <Card className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-spark-100/55">{t("noDraftsBody")}</p>
            <Link
              href={`/dashboard/${params.guildId}/ai/new`}
              className="inline-flex items-center gap-1 text-xs text-spark-300 hover:text-spark-200"
            >
              {t("createTitle")} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Card>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {blueprints.map((blueprint) => (
              <Link
                key={blueprint.id}
                href={`/dashboard/${params.guildId}/ai/${blueprint.id}`}
                className="surface flex items-center justify-between gap-3 p-4 transition-colors hover:border-spark-500/40"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">{blueprint.title}</p>
                  <p className="mt-1 text-[11px] text-spark-100/45">
                    {t("updated")} {formatDateTime(blueprint.updated_at)}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-spark-300" />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

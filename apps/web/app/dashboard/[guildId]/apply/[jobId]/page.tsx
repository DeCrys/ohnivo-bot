import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { assertGuildAccess } from "@/lib/guild-access";
import { getServiceClient } from "@/lib/supabase/service";
import { mintUserJwt, getPublicSupabaseConfig } from "@/lib/supabase/user";
import type { ApplyJobRow } from "@/lib/types";
import { ApplyProgress } from "@/components/ai/apply-progress";

export const dynamic = "force-dynamic";

export default async function ApplyJobPage({
  params,
}: {
  params: { guildId: string; jobId: string };
}) {
  const session = await requireUser();
  await assertGuildAccess(session.user.id, params.guildId);
  const t = await getTranslations("ai.apply");
  const tc = await getTranslations("common");

  const { data } = await getServiceClient()
    .from("apply_jobs")
    .select("*")
    .eq("id", params.jobId)
    .eq("guild_id", params.guildId)
    .eq("user_id", session.user.id)
    .maybeSingle();
  if (!data) notFound();
  const job = data as ApplyJobRow;

  const publicConfig = getPublicSupabaseConfig();
  const token = publicConfig ? await mintUserJwt(session.user.id) : null;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link
        href={`/dashboard/${params.guildId}`}
        className="inline-flex items-center gap-1.5 text-xs text-spark-100/45 hover:text-white"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> {tc("back")}
      </Link>
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-white">{t("title")}</h2>
        <p className="mt-1 text-sm leading-relaxed text-spark-100/60">{t("subtitle")}</p>
      </div>

      <ApplyProgress
        job={{
          id: job.id,
          status: job.status,
          progress: job.progress,
          summary: job.summary,
          error: job.error,
          refunded: job.refunded,
          cost: job.cost,
          created_at: job.created_at,
          finished_at: job.finished_at,
        }}
        guildId={params.guildId}
        realtime={
          publicConfig
            ? { url: publicConfig.url, anonKey: publicConfig.anonKey, token }
            : null
        }
      />
    </div>
  );
}

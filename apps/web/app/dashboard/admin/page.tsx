import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/primitives";
import { requireUser } from "@/lib/auth/session";
import { isAdminUser } from "@/lib/auth/admin";
import { env } from "@/lib/env";
import { getCreditBalance } from "@/lib/credits";
import { AdminPanel } from "@/components/admin/admin-panel";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await requireUser();
  if (!isAdminUser(session.user)) notFound();

  const t = await getTranslations("admin");
  const balance = await getCreditBalance(session.user.id);
  const provider =
    env.AI_PROVIDER === "auto"
      ? env.NVIDIA_API_KEY
        ? "NVIDIA"
        : env.ANTHROPIC_API_KEY
          ? "Anthropic"
          : "Mock"
      : env.AI_PROVIDER === "anthropic"
        ? "Anthropic"
        : env.AI_PROVIDER === "nvidia"
          ? "NVIDIA"
          : "Mock";
  const configured =
    provider === "Anthropic"
      ? Boolean(env.ANTHROPIC_API_KEY)
      : provider === "NVIDIA"
        ? Boolean(env.NVIDIA_API_KEY)
        : false;
  const model =
    provider === "Anthropic"
      ? env.ANTHROPIC_MODEL
      : provider === "NVIDIA"
        ? env.NVIDIA_MODEL
        : "—";

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">{t("title")}</h1>
        <p className="mt-1 text-sm text-spark-100/60">{t("subtitle")}</p>
      </div>

      <Card>
        <h2 className="text-sm font-semibold text-white">{t("aiTitle")}</h2>
        <p className="mt-2 text-sm text-spark-100/70">
          {configured
            ? t("aiReady", { provider, model })
            : t("aiMissing", { provider })}
        </p>
        {!configured ? (
          <p className="mt-3 whitespace-pre-wrap rounded-lg border border-line/60 bg-ink-900/60 p-3 font-mono text-xs leading-relaxed text-spark-100/60">
            {t("aiSetup")}
          </p>
        ) : null}
      </Card>

      <AdminPanel initialBalance={balance} />
    </div>
  );
}

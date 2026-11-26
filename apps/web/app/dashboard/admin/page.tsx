import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/primitives";
import { PageHeader } from "@/components/ui/page-header";
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
  const td = await getTranslations("dashboard");
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
    <div>
      <PageHeader
        index="01"
        label={td("admin")}
        title={t("title")}
        subtitle={t("subtitle")}
      />

      <div className="pad mx-auto max-w-3xl space-y-5 py-10 lg:py-12">
        <Card>
          <h2 className="text-[15px] font-medium text-chalk">{t("aiTitle")}</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-chalk-400">
            {configured
              ? t("aiReady", { provider, model })
              : t("aiMissing", { provider })}
          </p>
          {!configured ? (
            <p className="font-code mt-3 whitespace-pre-wrap rounded-inner border border-wire bg-void-800 p-4 text-[13px] leading-relaxed text-chalk-400">
              {t("aiSetup")}
            </p>
          ) : null}
        </Card>

        <AdminPanel initialBalance={balance} />
      </div>
    </div>
  );
}

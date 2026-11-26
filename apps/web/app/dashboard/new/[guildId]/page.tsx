import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { assertGuildAccess } from "@/lib/guild-access";
import { AppError } from "@/lib/errors";
import { SetupChoice } from "@/components/dashboard/setup-choice";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/primitives";

export const dynamic = "force-dynamic";

export default async function SetupMethodPage({ params }: { params: { guildId: string } }) {
  const session = await requireUser();
  const access = await assertGuildAccess(session.user.id, params.guildId).catch((error: unknown) => {
    if (error instanceof AppError && error.code === "forbidden") notFound();
    throw error;
  });
  const t = await getTranslations("dashboard");

  return (
    <div>
      <PageHeader
        index="02"
        label={t("nav.new")}
        title={t("chooseMethod")}
        subtitle={t("chooseMethodBody")}
      />
      <div className="pad py-10 lg:py-12">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Link
            href="/dashboard/new"
            className="focus-ring inline-flex min-h-[44px] items-center gap-1.5 rounded-control text-[13px] text-chalk-400 transition-colors hover:text-chalk motion-reduce:transition-none"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            {t("nav.backToServers")}
          </Link>
          <span className="text-[12px] text-chalk-500">{t("nav.server")}</span>
          <Badge>{access.guild.name}</Badge>
        </div>
        <SetupChoice guildId={access.guild.id} />
      </div>
    </div>
  );
}

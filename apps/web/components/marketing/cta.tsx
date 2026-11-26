import { getTranslations } from "next-intl/server";
import { Mascot } from "@/components/brand/mascot";
import { CtaBand } from "@/components/marketing/ui";

export async function CtaSection() {
  const t = await getTranslations("marketing.cta");

  return (
    <CtaBand title={t("title")} body={t("body")} button={t("button")} href="/login">
      <Mascot className="h-28 w-28 lg:h-32 lg:w-32" withSparkles={false} />
    </CtaBand>
  );
}

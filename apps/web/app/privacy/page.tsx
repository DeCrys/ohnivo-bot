import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LegalPage } from "@/components/marketing/legal-page";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("marketing.legal.privacy");
  return {
    title: t("title"),
    description: t("s1b"),
    alternates: { canonical: "/privacy" },
  };
}

export default function PrivacyPage() {
  return <LegalPage namespace="privacy" sectionCount={6} />;
}

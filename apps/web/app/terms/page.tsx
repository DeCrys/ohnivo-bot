import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LegalPage } from "@/components/marketing/legal-page";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("marketing.legal.terms");
  return {
    title: t("title"),
    description: t("s1b"),
    alternates: { canonical: "/terms" },
  };
}

export default function TermsPage() {
  return <LegalPage namespace="terms" sectionCount={5} />;
}

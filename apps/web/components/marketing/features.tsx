import { getTranslations } from "next-intl/server";
import {
  Blocks,
  Eye,
  Layers,
  ShieldCheck,
  Sparkles,
  Wand2,
} from "lucide-react";
import { Mascot } from "@/components/brand/mascot";
import { SectionTitle } from "@/components/ui/primitives";

export async function Features() {
  const t = await getTranslations("marketing.features");
  const items = [
    { icon: Layers, title: t("blueprintTitle"), body: t("blueprintBody"), mascot: true },
    { icon: ShieldCheck, title: t("permissionsTitle"), body: t("permissionsBody"), mascot: false },
    { icon: Wand2, title: t("previewTitle"), body: t("previewBody"), mascot: true },
    { icon: Sparkles, title: t("applyTitle"), body: t("applyBody"), mascot: false },
    { icon: Blocks, title: t("modulesTitle"), body: t("modulesBody"), mascot: true },
    { icon: Eye, title: t("creditsTitle"), body: t("creditsBody"), mascot: false },
  ];

  return (
    <section className="relative overflow-hidden border-y border-line/50 bg-ink-900/40">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
        <SectionTitle
          eyebrow={t("eyebrow")}
          title={t("title")}
          subtitle={t("subtitle")}
          align="center"
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div
              key={item.title}
              className="surface group relative overflow-hidden p-6 transition-colors hover:border-spark-500/40"
            >
              {item.mascot ? (
                <Mascot
                  className="pointer-events-none absolute -right-5 -top-4 h-24 w-24 opacity-30 transition-opacity group-hover:opacity-50"
                  withSparkles={false}
                  floating={false}
                />
              ) : null}
              <div className="grid h-10 w-10 place-items-center rounded-lg border border-line bg-ink-800 text-spark-300">
                <item.icon className="h-4 w-4" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-white">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-spark-100/60">{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

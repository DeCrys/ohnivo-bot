import { getTranslations } from "next-intl/server";
import { SectionHeader } from "@/components/marketing/ui";

export async function Features() {
  const t = await getTranslations("marketing.features");
  const items = [
    ["blueprintTitle", "blueprintBody"],
    ["permissionsTitle", "permissionsBody"],
    ["previewTitle", "previewBody"],
    ["applyTitle", "applyBody"],
    ["modulesTitle", "modulesBody"],
    ["creditsTitle", "creditsBody"],
  ] as const;

  return (
    <section className="shell pb-16 lg:pb-24">
      <SectionHeader
        index="02"
        label={t("eyebrow")}
        title={t("title")}
        lead={t("subtitle")}
      />

      <ul className="mt-10 grid gap-px border border-graphite/15 bg-graphite/15 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(([title, body], index) => (
          <li
            key={title}
            className="group flex flex-col bg-paper p-5 transition-colors hover:bg-paper-deep lg:p-7"
          >
            <span className="font-mono text-[11px] tracking-label text-graphite/60">
              {String(index + 1).padStart(2, "0")}
            </span>
            <h3 className="mt-5 text-[17px] font-medium leading-snug text-graphite">{t(title)}</h3>
            <p className="mt-2 text-[14px] leading-relaxed text-graphite-500">{t(body)}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

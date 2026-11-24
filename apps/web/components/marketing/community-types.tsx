import { getTranslations } from "next-intl/server";
import { SectionTitle } from "@/components/ui/primitives";

export async function CommunityTypes() {
  const t = await getTranslations("marketing.types");
  const types = [
    ["🎮", t("gaming")],
    ["⛏️", t("minecraft")],
    ["🌆", t("fivem")],
    ["🎨", t("creators")],
    ["🏆", t("esport")],
    ["🚀", t("startup")],
  ] as const;

  return (
    <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <SectionTitle title={t("title")} subtitle={t("subtitle")} align="center" />
      <div className="mt-8 flex flex-wrap justify-center gap-2.5">
        {types.map(([emoji, label]) => (
          <span
            key={label}
            className="inline-flex items-center gap-2 rounded-full border border-line bg-ink-850/80 px-4 py-2 text-sm text-spark-100/75"
          >
            <span aria-hidden="true">{emoji}</span>
            {label}
          </span>
        ))}
      </div>
    </section>
  );
}

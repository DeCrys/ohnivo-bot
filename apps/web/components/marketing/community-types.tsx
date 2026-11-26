import { getTranslations } from "next-intl/server";
import { Section } from "@/components/marketing/ui";

/** Compact strip under the hero, in the place a logo row usually takes. */
export async function CommunityTypes() {
  const t = await getTranslations("marketing.types");
  const types = [
    t("gaming"),
    t("minecraft"),
    t("fivem"),
    t("creators"),
    t("esport"),
    t("startup"),
  ];

  return (
    <Section>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:gap-10">
        <div className="flex flex-col justify-center py-2">
          <p className="mono-label">{t("eyebrow")}</p>
          <h2 className="mt-3 text-[18px] font-medium leading-snug text-white">{t("title")}</h2>
          <p className="mt-2 text-[14px] leading-relaxed text-chalk-400">{t("subtitle")}</p>
        </div>

        <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
          {types.map((label, index) => (
            <li
              key={label}
              className="flex min-h-[96px] flex-col justify-between rounded-inner border border-white/5 bg-white/[0.03] p-4 lg:min-h-[132px]"
            >
              <span className="text-[12px] text-chalk-500">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="text-[14px] font-medium leading-snug text-chalk-2">{label}</span>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}

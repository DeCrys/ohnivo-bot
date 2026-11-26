import { getTranslations } from "next-intl/server";

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
    <section className="border-y border-graphite/15 bg-paper-sand">
      <div className="shell py-16 lg:py-20">
        <div className="grid gap-x-10 gap-y-4 md:grid-cols-[10rem_minmax(0,1fr)]">
          <p className="mono-label pt-1 text-graphite/60">
            <span className="mr-3 text-graphite/60">03</span>
            {t("eyebrow")}
          </p>
          <div>
            <h2 className="display max-w-[24ch] text-balance text-[clamp(1.9rem,3.2vw,3.1rem)] leading-[1.04] text-graphite">
              {t("title")}
            </h2>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-graphite-500">
              {t("subtitle")}
            </p>
          </div>
        </div>

        <ul className="mt-10 grid gap-px border border-graphite/20 bg-graphite/20 sm:grid-cols-2 lg:grid-cols-3">
          {types.map((label, index) => (
            <li key={label} className="group flex items-end justify-between gap-4 bg-paper-sand p-5 lg:p-7">
              <p className="display text-[clamp(1.5rem,2.6vw,2.3rem)] leading-none text-graphite">
                {label}
              </p>
              <span className="font-mono text-[11px] tracking-label text-graphite/60">
                {String(index + 1).padStart(2, "0")}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

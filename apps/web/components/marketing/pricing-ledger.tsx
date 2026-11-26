import { Fragment } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import { CREDIT_COSTS, PLANS, type PlanId } from "@ohnivo/shared";
import { SectionHeader } from "@/components/marketing/ui";

type Value = "yes" | "no" | string;

const COLUMNS: PlanId[] = ["free", "starter", "premium", "pro"];

const GROUPS: { key: string; rows: { key: string; values: Record<PlanId, Value> }[] }[] = [
  {
    key: "ledgerCredits",
    rows: [
      {
        key: "rowCredits",
        values: {
          free: "no",
          starter: String(PLANS.starter.monthlyCredits),
          premium: String(PLANS.premium.monthlyCredits),
          pro: String(PLANS.pro.monthlyCredits),
        },
      },
      {
        key: "rowDrafts",
        values: {
          free: "no",
          starter: String(Math.floor(PLANS.starter.monthlyCredits / CREDIT_COSTS.generate)),
          premium: String(Math.floor(PLANS.premium.monthlyCredits / CREDIT_COSTS.generate)),
          pro: String(Math.floor(PLANS.pro.monthlyCredits / CREDIT_COSTS.generate)),
        },
      },
    ],
  },
  {
    key: "ledgerTools",
    rows: [
      { key: "rowGenerate", values: { free: "no", starter: "yes", premium: "yes", pro: "yes" } },
      { key: "rowRefine", values: { free: "no", starter: "yes", premium: "yes", pro: "yes" } },
      { key: "rowGraphics", values: { free: "no", starter: "yes", premium: "yes", pro: "yes" } },
      { key: "rowApply", values: { free: "yes", starter: "yes", premium: "yes", pro: "yes" } },
    ],
  },
  {
    key: "ledgerModules",
    rows: [
      { key: "rowModules", values: { free: "yes", starter: "yes", premium: "yes", pro: "yes" } },
      { key: "rowRoles", values: { free: "yes", starter: "yes", premium: "yes", pro: "yes" } },
    ],
  },
  {
    key: "ledgerManagement",
    rows: [
      { key: "rowOverview", values: { free: "yes", starter: "yes", premium: "yes", pro: "yes" } },
      { key: "rowEditor", values: { free: "yes", starter: "yes", premium: "yes", pro: "yes" } },
      {
        key: "rowSubscription",
        values: { free: "no", starter: "yes", premium: "yes", pro: "yes" },
      },
    ],
  },
];

export async function PricingLedger() {
  const t = await getTranslations("marketing.pricingPage");
  const locale = await getLocale();

  function renderValue(value: Value) {
    if (value === "yes") {
      return (
        <span className="inline-flex items-center">
          <span aria-hidden="true" className="text-[15px] leading-none text-graphite">
            ✓
          </span>
          <span className="sr-only">{t("included")}</span>
        </span>
      );
    }
    if (value === "no") {
      return (
        <span className="inline-flex items-center">
          <span aria-hidden="true" className="text-[15px] leading-none text-graphite/25">
            —
          </span>
          <span className="sr-only">{t("notIncluded")}</span>
        </span>
      );
    }
    return (
      <span className="font-mono text-[12px] tabular-nums text-graphite">
        {Number(value).toLocaleString(locale === "cs" ? "cs-CZ" : "en-US")}
      </span>
    );
  }

  return (
    <section id="compare" className="shell scroll-mt-24 pb-16 lg:pb-24">
      <SectionHeader
        index="02"
        label={t("compareEyebrow")}
        title={t("ledgerTitle")}
        lead={t("ledgerSubtitle")}
      />

      <div className="mt-10 hidden border border-graphite/15 md:block">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-graphite/20">
              <th scope="col" className="w-[40%] px-5 py-4">
                <span className="mono-label text-graphite/60">{t("ledgerColumn")}</span>
              </th>
              {COLUMNS.map((plan) => (
                <th key={plan} scope="col" className="px-3 py-4 text-center">
                  <span
                    className={
                      plan === "premium"
                        ? "font-mono text-[11px] uppercase tracking-label text-graphite"
                        : "font-mono text-[11px] uppercase tracking-label text-graphite/50"
                    }
                  >
                    {plan}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {GROUPS.map((group) => (
              <Fragment key={group.key}>
                <tr>
                  <th
                    scope="colgroup"
                    colSpan={COLUMNS.length + 1}
                    className="border-t border-graphite/20 bg-paper-deep/60 px-5 py-2 text-left"
                  >
                    <span className="mono-label text-graphite/60">{t(group.key)}</span>
                  </th>
                </tr>
                {group.rows.map((row) => (
                  <tr key={row.key} className="border-t border-graphite/10">
                    <th scope="row" className="px-5 py-3 text-[14px] font-normal text-graphite-500">
                      {t(row.key)}
                    </th>
                    {COLUMNS.map((plan) => (
                      <td
                        key={plan}
                        className={
                          plan === "premium"
                            ? "bg-lilac/20 px-3 py-3 text-center"
                            : "px-3 py-3 text-center"
                        }
                      >
                        {renderValue(row.values[plan])}
                      </td>
                    ))}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-10 space-y-4 md:hidden">
        {COLUMNS.map((plan) => (
          <div key={plan} className="border border-graphite/15 p-4">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="font-mono text-[11px] uppercase tracking-label text-graphite">
                {plan}
              </h3>
              <p className="font-mono text-[11px] text-graphite-500">
                {plan === "free"
                  ? t("included")
                  : t("creditsPerMonth", { count: PLANS[plan].monthlyCredits })}
              </p>
            </div>
            <dl className="mt-3 space-y-2">
              {GROUPS.flatMap((group) =>
                group.rows.map((row) => (
                  <div
                    key={row.key}
                    className="flex items-start justify-between gap-4 border-t border-graphite/10 pt-2"
                  >
                    <dt className="text-[12px] leading-relaxed text-graphite-500">
                      <span className="text-graphite/60">{t(group.key)} · </span>
                      {t(row.key)}
                    </dt>
                    <dd className="shrink-0">{renderValue(row.values[plan])}</dd>
                  </div>
                )),
              )}
            </dl>
          </div>
        ))}
      </div>
    </section>
  );
}

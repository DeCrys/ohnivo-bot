import { Fragment } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import { PLANS, type PlanId } from "@ohnivo/shared";
import { Section, SectionHeader } from "@/components/marketing/ui";
import { cn } from "@/lib/utils";

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
          starter: String(PLANS.starter.monthlyGenerations),
          premium: String(PLANS.premium.monthlyGenerations),
          pro: String(PLANS.pro.monthlyGenerations),
        },
      },
    ],
  },
  {
    key: "ledgerTools",
    rows: [
      { key: "rowGenerate", values: { free: "no", starter: "yes", premium: "yes", pro: "yes" } },
      { key: "rowRefine", values: { free: "yes", starter: "yes", premium: "yes", pro: "yes" } },
      { key: "rowGraphics", values: { free: "yes", starter: "yes", premium: "yes", pro: "yes" } },
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
          <span aria-hidden="true" className="h-2 w-2 rounded-pill bg-spark-300" />
          <span className="sr-only">{t("included")}</span>
        </span>
      );
    }
    if (value === "no") {
      return (
        <span className="inline-flex items-center">
          <span aria-hidden="true" className="h-px w-3 rounded-pill bg-chalk-500" />
          <span className="sr-only">{t("notIncluded")}</span>
        </span>
      );
    }
    return (
      <span className="text-[14px] tabular-nums text-white">
        {Number(value).toLocaleString(locale === "cs" ? "cs-CZ" : "en-US")}
      </span>
    );
  }

  return (
    <Section id="compare">
      <SectionHeader
        index="02"
        label={t("compareEyebrow")}
        title={t("ledgerTitle")}
        lead={t("ledgerSubtitle")}
      />

      <div className="hidden md:block">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[13px] text-chalk-muted">
              <th scope="col" className="w-[40%] px-6 py-4 font-normal lg:px-8">
                {t("ledgerColumn")}
              </th>
              {COLUMNS.map((plan) => (
                <th
                  key={plan}
                  scope="col"
                  className={cn(
                    "px-3 py-4 text-center font-normal",
                    plan === "premium" && "bg-spark-300/[0.04]",
                  )}
                >
                  <span className={plan === "premium" ? "text-spark-200" : "text-chalk-2"}>
                    {plan}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {GROUPS.map((group) => (
              <Fragment key={group.key}>
                <tr className="bg-white/[0.015]">
                  <th
                    scope="colgroup"
                    colSpan={COLUMNS.length + 1}
                    className="px-6 py-3 text-left text-[13px] font-normal text-chalk-500 lg:px-8"
                  >
                    {t(group.key)}
                  </th>
                </tr>
                {group.rows.map((row) => (
                  <tr key={row.key} className="border-t border-white/5">
                    <th
                      scope="row"
                      className="px-6 py-3.5 text-[14px] font-normal text-chalk-2 lg:px-8"
                    >
                      {t(row.key)}
                    </th>
                    {COLUMNS.map((plan) => (
                      <td
                        key={plan}
                        className={cn(
                          "px-3 py-3.5 text-center",
                          plan === "premium" && "bg-spark-300/[0.04]",
                        )}
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

      <div className="grid gap-4 md:hidden">
        {COLUMNS.map((plan) => (
          <div
            key={plan}
            className={cn(
              "surface p-5 sm:p-6",
              plan === "premium" && "border-wire shadow-glow",
            )}
          >
            <div className="flex items-baseline justify-between gap-3">
              <h3
                className={cn(
                  "text-[18px] font-medium",
                  plan === "premium" ? "text-spark-200" : "text-white",
                )}
              >
                {plan}
              </h3>
              <div className="text-right">
                <p className="text-[13px] text-chalk-400">
                  {plan === "free"
                    ? t("included")
                    : t("creditsPerMonth", { count: PLANS[plan].monthlyCredits })}
                </p>
                {plan !== "free" ? (
                  <p className="mt-0.5 text-[12px] text-chalk-500">
                    {t("generationsShort", { count: PLANS[plan].monthlyGenerations })}
                  </p>
                ) : null}
              </div>
            </div>
            <dl className="mt-4">
              {GROUPS.flatMap((group) =>
                group.rows.map((row) => (
                  <div
                    key={row.key}
                    className="flex items-center justify-between gap-4 border-t border-white/5 py-3"
                  >
                    <dt className="text-[13px] leading-relaxed text-chalk-2">
                      <span className="text-chalk-500">{t(group.key)} · </span>
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
    </Section>
  );
}

import { Fragment } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import { Check, Minus } from "lucide-react";
import { CREDIT_COSTS, PLANS, type PlanId } from "@ohnivo/shared";

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
          <Check className="h-4 w-4 text-emerald-400" aria-hidden="true" />
          <span className="sr-only">{t("included")}</span>
        </span>
      );
    }
    if (value === "no") {
      return (
        <span className="inline-flex items-center">
          <Minus className="h-4 w-4 text-spark-100/25" aria-hidden="true" />
          <span className="sr-only">{t("notIncluded")}</span>
        </span>
      );
    }
    return (
      <span className="font-medium tabular-nums text-spark-100">
        {Number(value).toLocaleString(locale === "cs" ? "cs-CZ" : "en-US")}
      </span>
    );
  }

  return (
    <section id="compare" className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:pb-24">
      <div className="max-w-2xl">
        <h2 className="text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          {t("ledgerTitle")}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-spark-100/70">{t("ledgerSubtitle")}</p>
      </div>

      <div className="surface mt-8 hidden overflow-hidden md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line/60">
              <th scope="col" className="w-[38%] px-5 py-4 text-xs font-medium text-spark-100/45">
                {t("ledgerColumn")}
              </th>
              {COLUMNS.map((plan) => (
                <th
                  key={plan}
                  scope="col"
                  className={
                    plan === "premium"
                      ? "px-3 py-4 text-center text-xs font-semibold capitalize text-spark-200"
                      : "px-3 py-4 text-center text-xs font-medium capitalize text-spark-100/60"
                  }
                >
                  {plan}
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
                    className="px-5 pb-2 pt-6 text-left text-xs font-semibold text-spark-300/70"
                  >
                    {t(group.key)}
                  </th>
                </tr>
                {group.rows.map((row) => (
                  <tr key={row.key} className="border-t border-line/40">
                    <th scope="row" className="px-5 py-3 pr-4 text-sm font-normal text-spark-100/70">
                      {t(row.key)}
                    </th>
                    {COLUMNS.map((plan) => (
                      <td
                        key={plan}
                        className={
                          plan === "premium"
                            ? "bg-spark-500/[0.04] px-3 py-3 text-center"
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

      <div className="mt-8 space-y-4 md:hidden">
        {COLUMNS.map((plan) => (
          <div key={plan} className="surface-muted p-4">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="text-sm font-semibold capitalize text-white">{plan}</h3>
              <p className="text-xs text-spark-100/50">
                {plan === "free"
                  ? t("included")
                  : t("creditsPerMonth", { count: PLANS[plan].monthlyCredits })}
              </p>
            </div>
            <dl className="mt-3 space-y-2.5">
              {GROUPS.flatMap((group) =>
                group.rows.map((row) => (
                  <div key={row.key} className="flex items-start justify-between gap-4">
                    <dt className="text-xs text-spark-100/55">
                      <span className="text-spark-100/30">{t(group.key)} · </span>
                      {t(row.key)}
                    </dt>
                    <dd className="shrink-0 text-xs">{renderValue(row.values[plan])}</dd>
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

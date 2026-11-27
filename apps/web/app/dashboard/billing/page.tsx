import { getLocale, getTranslations } from "next-intl/server";
import { Coins } from "lucide-react";
import { PLANS, isPaidPlan, type BillingInterval, type PlanId } from "@ohnivo/shared";
import { requireUser } from "@/lib/auth/session";
import { hasSubscriptionCreditsSince } from "@/lib/billing-checkout";
import { getCreditBalance } from "@/lib/credits";
import { isStripeConfigured } from "@/lib/env";
import { getServiceClient } from "@/lib/supabase/service";
import type { CreditLedgerRow, SubscriptionRow } from "@/lib/types";
import { generationAccess, getGenerationUsage } from "@/lib/usage-limits";
import { Alert, Badge, Card } from "@/components/ui/primitives";
import { PageHeader } from "@/components/ui/page-header";
import { CreditPackPicker } from "@/components/billing/credit-pack-picker";
import { PlanPicker } from "@/components/billing/plan-picker";
import { PortalButton } from "@/components/billing/portal-button";
import { formatDate, formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

const KIND_KEYS: Record<string, string> = {
  // Legacy kinds remain mapped so historical ledger rows keep a readable label.
  generate: "kindGenerate",
  regenerate: "kindRegenerate",
  refine: "kindRefine",
  apply: "kindApply",
  credit_pack: "kindCreditPack",
  refund: "kindRefund",
  subscription: "kindSubscription",
  grant: "kindGrant",
  admin_grant: "kindAdminGrant",
  image: "kindImage",
};

export default async function BillingPage({
  searchParams,
}: {
  searchParams: { checkout?: string; checkout_started_at?: string; interval?: string; plan?: string };
}) {
  const session = await requireUser();
  const t = await getTranslations("ai.billing");
  const td = await getTranslations("dashboard");
  const tc = await getTranslations("common");
  const locale = await getLocale();
  const number = new Intl.NumberFormat(locale);

  const service = getServiceClient();
  const [balance, usedGenerations, ledgerResult, subscriptionResult] = await Promise.all([
    getCreditBalance(session.user.id),
    getGenerationUsage(session.user.id),
    service
      .from("credit_ledger")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(40),
    service
      .from("subscriptions")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const ledger = (ledgerResult.data ?? []) as CreditLedgerRow[];
  const subscription = (subscriptionResult.data as SubscriptionRow | null) ?? null;
  const checkoutCreditsConfirmed = hasSubscriptionCreditsSince(
    ledger,
    searchParams.checkout_started_at,
  );
  const initialInterval: BillingInterval =
    searchParams.interval === "year" ? "year" : (subscription?.interval ?? "month");
  const requestedPlanParam = searchParams.plan ?? "";
  const requestedPlan: Exclude<PlanId, "free"> | undefined = isPaidPlan(requestedPlanParam)
    ? requestedPlanParam
    : undefined;
  const plan = session.user.plan as PlanId;
  const quota = generationAccess(session.user, usedGenerations);

  function kindLabel(kind: string): string {
    const key = KIND_KEYS[kind];
    if (!key) return kind;
    try {
      return t(key);
    } catch {
      return kind;
    }
  }

  return (
    <div>
      <PageHeader
        index="01"
        label={td("nav.billing")}
        title={t("title")}
        subtitle={t("subtitle")}
      />

      <div className="pad space-y-6 py-10 lg:py-12">
        {searchParams.checkout === "success" ? (
          <Alert variant="success">
            {t(checkoutCreditsConfirmed ? "checkoutSuccess" : "checkoutPending")}
          </Alert>
        ) : null}
        {searchParams.checkout === "credits_success" ? (
          <Alert variant="success">{t("checkoutCreditsSuccess")}</Alert>
        ) : null}
        {searchParams.checkout === "cancelled" ? (
          <Alert variant="warning">{t("checkoutCancelled")}</Alert>
        ) : null}
        {!isStripeConfigured() ? <Alert variant="warning">{t("stripeMissing")}</Alert> : null}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="flex items-center justify-between gap-4">
            <div>
              <p className="mono-label">{t("balance")}</p>
              <p className="mt-3 flex items-center gap-2 text-[30px] font-medium leading-none tracking-display text-white">
                <Coins className="h-5 w-5 text-spark-300" aria-hidden="true" />
                <span className="tabular-nums">{number.format(balance)}</span>
              </p>
              <p className="mt-2 text-[13px] text-chalk-500">{tc("credits")}</p>
            </div>
          </Card>
          <Card>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="mono-label">{t("plan")}</p>
                <p className="mt-3 text-[20px] font-medium capitalize leading-snug text-white">
                  {plan === "free" ? tc("free") : plan}
                </p>
                {subscription ? (
                  <p className="mt-2 text-[13px] leading-relaxed text-chalk-500">
                    {subscription.current_period_end
                      ? `${subscription.cancel_at_period_end ? t("activeUntil") : t("renews")} ${formatDate(
                          subscription.current_period_end,
                          locale,
                        )}`
                      : t("current")}
                    {" · "}
                    {subscription.interval === "year" ? t("perYear") : t("perMonth")}
                  </p>
                ) : (
                  <p className="mt-2 text-[13px] text-chalk-500">{t("noPlan")}</p>
                )}
              </div>
              {subscription ? <Badge variant="success">{t("current")}</Badge> : null}
            </div>
            {session.user.stripe_customer_id ? (
              <div className="mt-5 flex justify-end">
                <PortalButton label={t("manage")} />
              </div>
            ) : null}
          </Card>
          <Card>
            <p className="mono-label">{t("generationQuota")}</p>
            <p className="mt-3 flex items-baseline gap-2 text-[30px] font-medium leading-none tracking-display text-white">
              <span className="tabular-nums">{quota.used}</span>
              <span className="text-[18px] text-chalk-500">/ {quota.limit}</span>
            </p>
            <div
              className="mt-4 h-1.5 w-full overflow-hidden rounded-pill bg-white/5"
              aria-hidden="true"
            >
              <div
                className="h-full rounded-pill bg-spark-300 transition-[width] duration-300 ease-out motion-reduce:transition-none"
                style={{
                  width: `${quota.limit > 0 ? Math.min(100, (quota.used / quota.limit) * 100) : 0}%`,
                }}
              />
            </div>
            <p className="mt-3 text-[13px] leading-relaxed text-chalk-500">
              {t("generationQuotaBody", { plan: quota.plan })}
            </p>
          </Card>
        </div>

        <section className="space-y-3">
          <div>
            <h2 className="text-[18px] font-medium text-white">{t("choosePlan")}</h2>
            <p className="mt-1.5 text-[13px] text-chalk-500">
              {PLANS[plan].monthlyGenerations > 0
                ? t("planBenefits", {
                    generations: PLANS[plan].monthlyGenerations,
                    credits: number.format(PLANS[plan].monthlyCredits),
                  })
                : t("note")}
            </p>
          </div>
          <PlanPicker
            currentPlan={plan}
            initialInterval={initialInterval}
            highlightPlan={requestedPlan}
            stripeReady={isStripeConfigured()}
          />
        </section>

        <section className="space-y-3">
          <div>
            <h2 className="text-[18px] font-medium text-white">{t("topUpTitle")}</h2>
            <p className="mt-1.5 max-w-[60ch] text-[13px] leading-relaxed text-chalk-500">
              {t("topUpBody")}
            </p>
          </div>
          <CreditPackPicker stripeReady={isStripeConfigured()} />
        </section>

        <Card>
          <h2 className="text-[18px] font-medium text-white">{t("history")}</h2>
          {ledger.length === 0 ? (
            <p className="mt-2 text-[13px] text-chalk-500">{t("empty")}</p>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-left text-[14px]">
                <thead className="text-[13px] text-chalk-muted">
                  <tr>
                    <th className="pb-3 font-normal">{t("date")}</th>
                    <th className="pb-3 font-normal">{t("description")}</th>
                    <th className="pb-3 text-right font-normal">{t("amount")}</th>
                    <th className="pb-3 text-right font-normal">{t("balance")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {ledger.map((row) => (
                    <tr key={row.id}>
                      <td className="whitespace-nowrap py-3 tabular-nums text-chalk-500">
                        {formatDateTime(row.created_at, locale)}
                      </td>
                      <td className="py-3 text-chalk-2">{kindLabel(row.kind)}</td>
                      <td
                        className={
                          row.delta > 0
                            ? "py-3 text-right tabular-nums text-spark-200"
                            : "py-3 text-right tabular-nums text-red-300"
                        }
                      >
                        {row.delta > 0 ? "+" : ""}
                        {row.delta}
                      </td>
                      <td className="py-3 text-right tabular-nums text-chalk-500">
                        {row.balance_after}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-4 text-[12px] leading-relaxed text-chalk-500">{t("note")}</p>
        </Card>
      </div>
    </div>
  );
}

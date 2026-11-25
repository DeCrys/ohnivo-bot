import { getTranslations } from "next-intl/server";
import { Coins } from "lucide-react";
import { PLANS, type BillingInterval, type PlanId } from "@ohnivo/shared";
import { requireUser } from "@/lib/auth/session";
import { hasSubscriptionCreditsSince } from "@/lib/billing-checkout";
import { getCreditBalance } from "@/lib/credits";
import { isStripeConfigured } from "@/lib/env";
import { getServiceClient } from "@/lib/supabase/service";
import type { CreditLedgerRow, SubscriptionRow } from "@/lib/types";
import { Badge, Card } from "@/components/ui/primitives";
import { Alert } from "@/components/ui/primitives";
import { PlanPicker } from "@/components/billing/plan-picker";
import { PortalButton } from "@/components/billing/portal-button";
import { formatDate, formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

const KIND_KEYS: Record<string, string> = {
  generate: "kindGenerate",
  regenerate: "kindGenerate",
  refine: "kindRefine",
  apply: "kindApply",
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
  const tc = await getTranslations("common");

  const service = getServiceClient();
  const [balance, ledgerResult, subscriptionResult] = await Promise.all([
    getCreditBalance(session.user.id),
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
  const plan = session.user.plan as PlanId;

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">{t("title")}</h1>
        <p className="mt-1 text-sm text-spark-100/60">{t("subtitle")}</p>
      </div>

      {searchParams.checkout === "success" ? (
        <Alert variant="success">
          {t(checkoutCreditsConfirmed ? "checkoutSuccess" : "checkoutPending")}
        </Alert>
      ) : null}
      {searchParams.checkout === "cancelled" ? (
        <Alert variant="warning">{t("checkoutCancelled")}</Alert>
      ) : null}
      {!isStripeConfigured() ? <Alert variant="warning">{t("stripeMissing")}</Alert> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-spark-100/45">{t("balance")}</p>
            <p className="mt-1 flex items-center gap-2 text-3xl font-semibold text-white">
              <Coins className="h-5 w-5 text-spark-300" />
              {balance.toLocaleString("cs-CZ")}
            </p>
            <p className="mt-1 text-xs text-spark-100/40">{tc("credits")}</p>
          </div>
        </Card>
        <Card>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-spark-100/45">{t("plan")}</p>
              <p className="mt-1 text-lg font-semibold capitalize text-white">
                {plan === "free" ? tc("free") : plan}
              </p>
              {subscription ? (
                <p className="mt-1 text-xs text-spark-100/50">
                  {subscription.current_period_end
                    ? `${subscription.cancel_at_period_end ? t("activeUntil") : t("renews")} ${formatDate(
                        subscription.current_period_end,
                      )}`
                    : t("current")}
                  {" · "}
                  {subscription.interval === "year" ? t("perYear") : t("perMonth")}
                </p>
              ) : (
                <p className="mt-1 text-xs text-spark-100/40">{t("noPlan")}</p>
              )}
            </div>
            {subscription ? <Badge variant="success">{t("current")}</Badge> : null}
          </div>
          {session.user.stripe_customer_id ? (
            <div className="mt-4 flex justify-end">
              <PortalButton label={t("manage")} />
            </div>
          ) : null}
        </Card>
      </div>

      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-white">{t("choosePlan")}</h2>
          <p className="mt-0.5 text-xs text-spark-100/45">
            {PLANS[plan].monthlyCredits > 0
              ? `${PLANS[plan].monthlyCredits.toLocaleString("cs-CZ")} ${tc("credits")} / ${t("perMonth")}`
              : t("note")}
          </p>
        </div>
        <PlanPicker
          currentPlan={plan}
          initialInterval={initialInterval}
          stripeReady={isStripeConfigured()}
        />
      </section>

      <Card>
        <h2 className="text-sm font-semibold text-white">{t("history")}</h2>
        {ledger.length === 0 ? (
          <p className="mt-2 text-xs text-spark-100/45">{t("empty")}</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] uppercase tracking-wide text-spark-100/35">
                <tr>
                  <th className="pb-2 font-medium">{t("date")}</th>
                  <th className="pb-2 font-medium">{t("description")}</th>
                  <th className="pb-2 text-right font-medium">{t("amount")}</th>
                  <th className="pb-2 text-right font-medium">{t("balance")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/40">
                {ledger.map((row) => (
                  <tr key={row.id}>
                    <td className="py-2 whitespace-nowrap text-spark-100/45">
                      {formatDateTime(row.created_at)}
                    </td>
                    <td className="py-2 text-spark-100/75">{kindLabel(row.kind)}</td>
                    <td
                      className={
                        row.delta > 0
                          ? "py-2 text-right font-medium text-emerald-300"
                          : "py-2 text-right font-medium text-red-300"
                      }
                    >
                      {row.delta > 0 ? "+" : ""}
                      {row.delta}
                    </td>
                    <td className="py-2 text-right text-spark-100/55">{row.balance_after}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-3 text-[11px] text-spark-100/35">{t("note")}</p>
      </Card>
    </div>
  );
}

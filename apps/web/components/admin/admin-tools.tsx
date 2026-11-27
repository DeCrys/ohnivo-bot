"use client";

import type { FormEvent } from "react";
import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Coins, Search, Sparkles } from "lucide-react";
import { PLAN_ORDER, PLANS, type BillingInterval, type PlanId } from "@ohnivo/shared";
import { manualPlanCredits } from "@/lib/admin-plan";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";
import { Alert, Badge, Card } from "@/components/ui/primitives";

export interface AdminUserSummary {
  id: string;
  discord_id: string;
  username: string;
  global_name: string | null;
  plan: PlanId;
  plan_source?: "stripe" | "manual" | null;
  is_admin?: boolean;
}

const planKey = {
  free: "planOptions.free",
  starter: "planOptions.starter",
  premium: "planOptions.premium",
  pro: "planOptions.pro",
} as const;

const intervalKey = {
  month: "intervalMonth",
  year: "intervalYear",
} as const;

function displayName(user: AdminUserSummary): string {
  return user.global_name || user.username;
}

export function AdminTools({ currentUser }: { currentUser: AdminUserSummary }) {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const locale = useLocale();
  const number = new Intl.NumberFormat(locale);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AdminUserSummary[]>([]);
  const [searched, setSearched] = useState(false);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<AdminUserSummary | null>(null);
  const [amount, setAmount] = useState("1000");
  const [creditReason, setCreditReason] = useState("");
  const [plan, setPlan] = useState<PlanId>("starter");
  const [interval, setInterval] = useState<BillingInterval>("month");
  const [planReason, setPlanReason] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const planCredits = manualPlanCredits(plan, plan === "free" ? null : interval);

  function choose(user: AdminUserSummary) {
    setSelected(user);
    setConfirming(false);
    setNotice(null);
    setError(null);
  }

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setError(null);
    void (async () => {
      try {
        const response = await fetch(`/api/admin/users?query=${encodeURIComponent(query.trim())}`);
        const data = (await response.json()) as { users?: AdminUserSummary[] };
        if (!response.ok || !data.users) {
          setError(t("searchFailed"));
          return;
        }
        setResults(data.users);
        setSearched(true);
      } catch {
        setError(t("searchFailed"));
      } finally {
        setSearching(false);
      }
    })();
  }

  function grantCredits(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    setNotice(null);
    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch("/api/admin/credits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: Number(amount),
            reason: creditReason,
            targetUserId: selected.id,
          }),
        });
        const data = (await response.json()) as {
          balance?: number;
          error?: { code?: string };
        };
        if (!response.ok || typeof data.balance !== "number") {
          setError(data.error?.code === "not_found" ? t("notFound") : t("grantFailed"));
          return;
        }
        setNotice(t("grantSuccess", { balance: number.format(data.balance) }));
        setCreditReason("");
      } catch {
        setError(t("grantFailed"));
      }
    });
  }

  function assignPlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
    setError(null);
    setConfirming(true);
  }

  function confirmPlan() {
    if (!selected) return;
    setNotice(null);
    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch("/api/admin/plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            targetUserId: selected.id,
            plan,
            interval: plan === "free" ? null : interval,
            reason: planReason,
          }),
        });
        const data = (await response.json()) as {
          balance?: number;
          plan?: PlanId;
          creditsGranted?: boolean;
          error?: { code?: string };
        };
        if (!response.ok || typeof data.balance !== "number") {
          setError(data.error?.code === "not_found" ? t("notFound") : t("planFailed"));
          return;
        }
        setConfirming(false);
        setSelected({ ...selected, plan: data.plan ?? plan, plan_source: "manual" });
        setNotice(
          data.creditsGranted
            ? t("planSuccess", { balance: number.format(data.balance) })
            : t("planAlreadyGranted"),
        );
        setPlanReason("");
      } catch {
        setError(t("planFailed"));
      }
    });
  }

  return (
    <>
      <Card>
        <h2 className="text-[16px] font-medium text-white">{t("usersTitle")}</h2>
        <p className="mt-1 max-w-[62ch] text-[13px] leading-relaxed text-chalk-400">
          {t("usersBody")}
        </p>

        <form onSubmit={search} className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Label htmlFor="admin-user-search">{t("searchLabel")}</Label>
            <Input
              id="admin-user-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("searchPlaceholder")}
              minLength={1}
              maxLength={100}
              required
            />
          </div>
          <Button type="submit" variant="secondary" disabled={searching}>
            <Search className="h-4 w-4" aria-hidden="true" />
            {searching ? t("searching") : t("searchButton")}
          </Button>
          <Button type="button" variant="ghost" onClick={() => choose(currentUser)}>
            {t("myAccount")}
          </Button>
        </form>

        {searched ? (
          results.length === 0 ? (
            <p className="mt-4 text-[13px] text-chalk-400">{t("noResults")}</p>
          ) : (
            <ul className="mt-4 space-y-2" aria-label={t("resultsLabel")}>
              {results.map((user) => (
                <li key={user.id}>
                  <button
                    type="button"
                    onClick={() => choose(user)}
                    aria-pressed={selected?.id === user.id}
                    className={cn(
                      "focus-ring flex w-full items-center justify-between gap-3 rounded-inner border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-left transition-colors duration-[180ms] hover:border-white/[0.10] motion-reduce:transition-none",
                      selected?.id === user.id && "border-spark-300/40 bg-spark-500/[0.06]",
                    )}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[14px] text-chalk">
                        {displayName(user)}
                      </span>
                      <span className="font-code mt-0.5 block truncate text-[12px] text-chalk-500">
                        {user.discord_id}
                      </span>
                    </span>
                    <Badge>{t(planKey[user.plan])}</Badge>
                  </button>
                </li>
              ))}
            </ul>
          )
        ) : (
          <p className="mt-4 text-[13px] text-chalk-400">{t("selectHint")}</p>
        )}
      </Card>

      {selected ? (
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-[16px] font-medium text-white">{t("selectedTitle")}</h2>
              <p className="mt-2 text-[15px] text-chalk-2">{displayName(selected)}</p>
              <p className="font-code mt-1 text-[12px] text-chalk-500">{selected.discord_id}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={selected.plan_source === "manual" ? "info" : "default"}>
                {selected.plan_source === "manual" ? t("planSourceManual") : t("planSourceStripe")}
              </Badge>
              <Badge>{t(planKey[selected.plan])}</Badge>
              {selected.is_admin ? <Badge variant="warning">{t("isAdminBadge")}</Badge> : null}
            </div>
          </div>

          <div aria-live="polite" className="mt-5 space-y-2">
            {notice ? <Alert variant="success">{notice}</Alert> : null}
            {error ? <Alert variant="danger">{error}</Alert> : null}
          </div>

          <div className="mt-6 space-y-6 border-t border-white/[0.06] pt-6">
            <section>
              <h3 className="text-[15px] font-medium text-chalk">{t("creditsTitle")}</h3>
              <p className="mt-1 text-[13px] leading-relaxed text-chalk-400">{t("creditsBody")}</p>
              <form onSubmit={grantCredits} className="mt-4 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="admin-credit-amount">{t("amount")}</Label>
                    <Input
                      id="admin-credit-amount"
                      type="number"
                      min="1"
                      max="10000"
                      step="1"
                      value={amount}
                      onChange={(event) => setAmount(event.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="admin-credit-reason">{t("reason")}</Label>
                    <Input
                      id="admin-credit-reason"
                      value={creditReason}
                      onChange={(event) => setCreditReason(event.target.value)}
                      minLength={3}
                      maxLength={200}
                      placeholder={t("reasonPlaceholder")}
                      required
                    />
                  </div>
                </div>
                <Button type="submit" disabled={pending}>
                  <Coins className="h-4 w-4" aria-hidden="true" />
                  {pending ? t("granting") : t("grant")}
                </Button>
              </form>
            </section>

            <section className="border-t border-white/[0.06] pt-6">
              <h3 className="text-[15px] font-medium text-chalk">{t("planTitle")}</h3>
              <p className="mt-1 max-w-[62ch] text-[13px] leading-relaxed text-chalk-400">
                {t("planBody")}
              </p>
              <form onSubmit={assignPlan} className="mt-4 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="admin-plan">{t("planSelectLabel")}</Label>
                    <select
                      id="admin-plan"
                      value={plan}
                      onChange={(event) => setPlan(event.target.value as PlanId)}
                      className="focus-ring w-full rounded-inner border border-white/[0.06] bg-void-800 px-4 py-3 text-[15px] text-chalk"
                    >
                      {PLAN_ORDER.map((id) => (
                        <option key={id} value={id}>
                          {t(planKey[id])}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="admin-plan-interval">{t("intervalLabel")}</Label>
                    <select
                      id="admin-plan-interval"
                      value={interval}
                      disabled={plan === "free"}
                      onChange={(event) => setInterval(event.target.value as BillingInterval)}
                      className="focus-ring w-full rounded-inner border border-white/[0.06] bg-void-800 px-4 py-3 text-[15px] text-chalk disabled:opacity-50"
                    >
                      <option value="month">{t(intervalKey.month)}</option>
                      <option value="year">{t(intervalKey.year)}</option>
                    </select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="admin-plan-reason">{t("reason")}</Label>
                  <Input
                    id="admin-plan-reason"
                    value={planReason}
                    onChange={(event) => setPlanReason(event.target.value)}
                    minLength={3}
                    maxLength={200}
                    placeholder={t("reasonPlaceholder")}
                    required
                  />
                </div>
                <p className="text-[13px] text-chalk-400">
                  {planCredits > 0
                    ? t("planCreditsNote", { credits: number.format(planCredits) })
                    : t("planNoCredits")}
                </p>

                {confirming ? (
                  <div className="space-y-3">
                    <Alert variant="warning" title={t("planConfirmTitle")}>
                      {plan === "free"
                        ? t("planConfirmBodyFree", {
                            name: displayName(selected),
                            plan: t(planKey[plan]),
                            credits: number.format(planCredits),
                          })
                        : t("planConfirmBody", {
                            name: displayName(selected),
                            plan: t(planKey[plan]),
                            interval: t(intervalKey[interval]),
                            credits: number.format(planCredits),
                          })}
                    </Alert>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" onClick={confirmPlan} disabled={pending}>
                        <Sparkles className="h-4 w-4" aria-hidden="true" />
                        {t("confirm")}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setConfirming(false)}
                        disabled={pending}
                      >
                        {t("cancel")}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button type="submit">
                    <Sparkles className="h-4 w-4" aria-hidden="true" />
                    {t("assignPlan")}
                  </Button>
                )}
              </form>
            </section>
          </div>
        </Card>
      ) : null}
    </>
  );
}

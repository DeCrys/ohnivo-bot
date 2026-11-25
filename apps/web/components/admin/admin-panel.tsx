"use client";

import type { FormEvent } from "react";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";
import { Alert, Card } from "@/components/ui/primitives";

export function AdminPanel({ initialBalance }: { initialBalance: number }) {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const [balance, setBalance] = useState(initialBalance);
  const [amount, setAmount] = useState("1000");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch("/api/admin/credits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: Number(amount), reason }),
        });
        const data = (await response.json()) as {
          balance?: number;
          error?: { code: string };
        };
        if (!response.ok || data.balance === undefined) {
          setError(t("grantFailed"));
          return;
        }
        setBalance(data.balance);
        setMessage(t("grantSuccess", { balance: data.balance }));
        setReason("");
      } catch {
        setError(t("grantFailed"));
      }
    });
  }

  return (
    <Card>
      <h2 className="text-sm font-semibold text-white">{t("creditsTitle")}</h2>
      <p className="mt-1 text-xs leading-relaxed text-spark-100/55">{t("creditsBody")}</p>
      <p className="mt-4 flex items-center gap-2 text-sm text-spark-100/70">
        <Coins className="h-4 w-4 text-spark-300" />
        {t("currentBalance")}: <strong className="text-white">{balance.toLocaleString("cs-CZ")}</strong>{" "}
        {tc("credits")}
      </p>

      <form onSubmit={submit} className="mt-5 space-y-4">
        <div>
          <Label htmlFor="credit-amount">{t("amount")}</Label>
          <Input
            id="credit-amount"
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
          <Label htmlFor="credit-reason">{t("reason")}</Label>
          <Input
            id="credit-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            minLength={3}
            maxLength={200}
            placeholder={t("reasonPlaceholder")}
            required
          />
        </div>
        {message ? <Alert variant="success">{message}</Alert> : null}
        {error ? <Alert variant="danger">{error}</Alert> : null}
        <Button type="submit" disabled={pending}>
          <Coins className="h-4 w-4" />
          {pending ? t("granting") : t("grant")}
        </Button>
      </form>
    </Card>
  );
}

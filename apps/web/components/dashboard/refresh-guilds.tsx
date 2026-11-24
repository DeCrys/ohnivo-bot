"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RefreshGuildsButton({ label, doneLabel }: { label: string; doneLabel: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  function refresh() {
    startTransition(async () => {
      const response = await fetch("/api/guilds/refresh", { method: "POST" });
      if (response.ok) {
        setDone(true);
        router.refresh();
        setTimeout(() => setDone(false), 4000);
      }
    });
  }

  return (
    <Button variant="secondary" size="sm" onClick={refresh} disabled={pending}>
      <RefreshCw className={pending ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />
      {done ? doneLabel : label}
    </Button>
  );
}

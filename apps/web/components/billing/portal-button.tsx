"use client";

import { useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PortalButton({ label }: { label: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);

  async function open() {
    setPending(true);
    setError(false);
    try {
      const response = await fetch("/api/stripe/portal", { method: "POST" });
      const data = (await response.json()) as { url?: string };
      if (response.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      setError(true);
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="text-right">
      <Button variant="secondary" size="sm" onClick={open} disabled={pending}>
        {pending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <ExternalLink className="h-3.5 w-3.5" />
        )}
        {label}
      </Button>
      {error ? <p className="mt-1 text-[11px] text-red-300">Stripe</p> : null}
    </div>
  );
}

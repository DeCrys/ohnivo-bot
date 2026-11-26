"use client";

import { useEffect, useState } from "react";

/**
 * Visitor's local time for the meta bar. Renders a placeholder on the server
 * so hydration never mismatches. With reduced motion it drops the seconds and
 * only updates once a minute.
 */
export function LocalClock({ label }: { label: string }) {
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const format = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: calm ? undefined : "2-digit",
      hour12: false,
    });
    const tick = () => setTime(format.format(new Date()));
    tick();
    const timer = window.setInterval(tick, calm ? 30_000 : 1_000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <p aria-hidden="true" className="mono-label flex items-center gap-2 tabular-nums">
      <span className="text-chalk-500">{label}</span>
      <span className="text-chalk-300">{time ?? "--:--:--"}</span>
    </p>
  );
}

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function ArrowUpRight({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className={cn("h-3.5 w-3.5", className)}
    >
      <path d="M4 12 12 4M5.5 4H12v6.5" stroke="currentColor" strokeWidth="1.25" />
    </svg>
  );
}

export function ArrowRight({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className={cn("h-3.5 w-3.5", className)}
    >
      <path d="M2 8h11M9.5 4.5 13 8l-3.5 3.5" stroke="currentColor" strokeWidth="1.25" />
    </svg>
  );
}

/**
 * Section header: mono index + label on the left, serif statement in the
 * middle, short lead on the right. This 3-column split is the rhythm used by
 * basar.studio for its studio and work sections.
 */
export function SectionHeader({
  index,
  label,
  title,
  lead,
  className,
  id,
}: {
  index: string;
  label: string;
  title: ReactNode;
  lead?: string;
  className?: string;
  id?: string;
}) {
  return (
    <div
      className={cn(
        "grid gap-x-10 gap-y-6 border-t border-graphite/15 pt-6 md:grid-cols-[10rem_minmax(0,1fr)] lg:grid-cols-[10rem_minmax(0,1fr)_22rem]",
        className,
      )}
    >
      <p className="mono-label flex items-baseline gap-3 pt-1">
        <span className="text-graphite/60">{index}</span>
        <span id={id}>{label}</span>
      </p>
      <h2 className="display max-w-[22ch] text-balance text-[clamp(1.9rem,3.2vw,3.1rem)] leading-[1.04] text-graphite">
        {title}
      </h2>
      {lead ? (
        <p className="max-w-sm text-[15px] leading-relaxed text-graphite-500 lg:pt-1.5">{lead}</p>
      ) : null}
    </div>
  );
}

/** Thin rule used between ledger rows and list items. */
export function Rule({ className }: { className?: string }) {
  return <div className={cn("h-px w-full bg-graphite/15", className)} aria-hidden="true" />;
}

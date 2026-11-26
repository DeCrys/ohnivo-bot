import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Page head for the app shell: a small quiet label, a medium-weight statement
 * (optionally in two tones) and a muted lead. Actions sit on the right.
 */
export function PageHeader({
  index,
  label,
  lead,
  title,
  subtitle,
  actions,
  className,
}: {
  index?: string;
  label?: string;
  lead?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rule-nodes-bottom", className)}>
      <div className="pad flex flex-wrap items-end justify-between gap-x-8 gap-y-6 pb-8 pt-10 lg:pt-14">
        <div className="min-w-0">
          {index && label ? (
            <p className="mono-label flex items-center gap-2.5">
              <span className="h-1.5 w-1.5 shrink-0 rounded-pill bg-spark-300" aria-hidden="true" />
              <span className="text-chalk-500">{index}</span>
              <span>{label}</span>
            </p>
          ) : null}
          <h1 className="display mt-4 max-w-[28ch] text-[clamp(1.5rem,2.6vw,2rem)] leading-[1.2]">
            {lead ? <span className="block text-chalk-500">{lead}</span> : null}
            <span className="block">{title}</span>
          </h1>
          {subtitle ? (
            <p className="mt-3 max-w-[56ch] text-[15px] leading-[1.55] text-chalk-400">
              {subtitle}
            </p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
      </div>
    </div>
  );
}

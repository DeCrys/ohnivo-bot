import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Mascot } from "@/components/brand/mascot";

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("surface p-6 sm:p-8", className)}>{children}</div>;
}

export function SectionTitle({
  eyebrow,
  title,
  subtitle,
  className,
  align = "left",
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  className?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={cn(align === "center" && "mx-auto text-center", "max-w-2xl", className)}>
      {eyebrow ? (
        <p className="mono-label flex items-center gap-2.5">
          <span
            className="h-1.5 w-1.5 shrink-0 rounded-pill bg-spark-300"
            aria-hidden="true"
          />
          <span>{eyebrow}</span>
        </p>
      ) : null}
      <h2 className="display mt-4 text-[clamp(1.25rem,2.4vw,1.75rem)] leading-[1.25]">
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-3 max-w-[56ch] text-[15px] leading-[1.55] text-chalk-400">{subtitle}</p>
      ) : null}
    </div>
  );
}

const badgeStyles = {
  default: "bg-white/[0.04] border-white/[0.06] text-chalk-300",
  success: "bg-spark-500/10 border-white/[0.06] text-spark-200",
  warning: "bg-amber-400/10 border-amber-400/20 text-amber-200",
  danger: "bg-red-400/10 border-red-400/20 text-red-200",
  info: "bg-ember-400/10 border-ember-400/20 text-ember-400",
  soon: "bg-white/[0.04] border-white/[0.06] text-chalk-400",
} as const;

export function Badge({
  children,
  variant = "default",
  className,
}: {
  children: ReactNode;
  variant?: keyof typeof badgeStyles;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-1 font-sans text-[12px] leading-none",
        badgeStyles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

const alertStyles = {
  info: "border-ember-400/15 bg-ember-400/[0.06] text-ember-400",
  warning: "border-amber-400/20 bg-amber-400/[0.06] text-amber-200",
  danger: "border-red-400/20 bg-red-400/[0.06] text-red-200",
  success: "border-white/[0.06] bg-spark-500/[0.06] text-spark-200",
} as const;

export function Alert({
  children,
  variant = "info",
  title,
  className,
}: {
  children?: ReactNode;
  variant?: keyof typeof alertStyles;
  title?: string;
  className?: string;
}) {
  return (
    <div className={cn("rounded-inner border px-4 py-3 text-sm", alertStyles[variant], className)}>
      {title ? <p className="mb-1 font-medium text-chalk">{title}</p> : null}
      {children ? <div className="leading-relaxed">{children}</div> : null}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn("h-4 w-4 animate-spin", className)}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="panel flex flex-col items-center gap-5 px-8 py-16 text-center">
      <Mascot className="h-28 w-28 opacity-90" withSparkles={false} />
      <div>
        <h3 className="display text-[19px] leading-tight text-chalk">{title}</h3>
        <p className="mx-auto mt-3 max-w-md text-[15px] leading-[1.55] text-chalk-400">{body}</p>
      </div>
      {action}
    </div>
  );
}

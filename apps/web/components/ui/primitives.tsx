import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Mascot } from "@/components/brand/mascot";

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("surface p-5", className)}>{children}</div>;
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
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-spark-300">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">
        {title}
      </h2>
      {subtitle ? <p className="mt-3 text-sm leading-relaxed text-spark-100/70">{subtitle}</p> : null}
    </div>
  );
}

export function Badge({
  children,
  variant = "default",
  className,
}: {
  children: ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "soon";
  className?: string;
}) {
  const styles = {
    default: "bg-ink-700 text-spark-100 border-line",
    success: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
    warning: "bg-amber-500/10 text-amber-300 border-amber-500/30",
    danger: "bg-red-500/10 text-red-300 border-red-500/30",
    info: "bg-ember-500/10 text-ember-400 border-ember-500/30",
    soon: "bg-spark-500/10 text-spark-300 border-spark-500/30",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
        styles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Alert({
  children,
  variant = "info",
  title,
  className,
}: {
  children?: ReactNode;
  variant?: "info" | "warning" | "danger" | "success";
  title?: string;
  className?: string;
}) {
  const styles = {
    info: "border-ember-500/25 bg-ember-500/5 text-ember-400",
    warning: "border-amber-500/30 bg-amber-500/5 text-amber-200",
    danger: "border-red-500/30 bg-red-500/5 text-red-200",
    success: "border-emerald-500/30 bg-emerald-500/5 text-emerald-200",
  } as const;
  return (
    <div className={cn("rounded-xl border px-4 py-3 text-sm", styles[variant], className)}>
      {title ? <p className="mb-1 font-medium text-white">{title}</p> : null}
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
    <div className="surface flex flex-col items-center gap-4 px-6 py-12 text-center">
      <Mascot className="h-28 w-28 opacity-90" withSparkles={false} />
      <div>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <p className="mx-auto mt-1 max-w-md text-sm leading-relaxed text-spark-100/65">{body}</p>
      </div>
      {action}
    </div>
  );
}

import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "outline";
export type ButtonSize = "sm" | "md" | "lg";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-spark-500 text-white shadow-glow hover:bg-spark-400 active:bg-spark-600 border border-spark-400/40",
  secondary:
    "bg-ink-800 text-spark-50 border border-line hover:bg-ink-700 hover:border-spark-500/40",
  ghost: "text-spark-100 hover:bg-ink-800/80 hover:text-white",
  danger: "bg-red-500/90 text-white hover:bg-red-500 border border-red-400/40",
  outline: "border border-line text-spark-100 hover:border-spark-500/60 hover:text-white",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

export function buttonClasses(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string,
): string {
  return cn(
    "focus-ring inline-flex select-none items-center justify-center gap-2 rounded-xl font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    sizes[size],
    className,
  );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({ variant = "primary", size = "md", className, ...props }: ButtonProps) {
  return <button className={buttonClasses(variant, size, className)} {...props} />;
}

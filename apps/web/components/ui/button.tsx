import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "outline";
export type ButtonSize = "sm" | "md" | "lg";

/**
 * One primary violet control, one quiet outlined control, three restrained
 * text actions. All share the same radius, type treatment and 180ms feedback.
 */
const variants: Record<ButtonVariant, string> = {
  primary: "btn-hatch",
  secondary: "btn-wire",
  ghost: "text-chalk-400 hover:text-chalk hover:bg-white/[0.03]",
  danger:
    "border border-red-400/20 bg-red-400/5 text-red-200 hover:bg-red-400/10 hover:border-red-400/30",
  outline: "border border-wire bg-transparent text-chalk-300 hover:bg-white/[0.03] hover:text-chalk",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-10 px-3.5 text-[13px]",
  md: "h-11 px-4 text-[14px]",
  lg: "h-12 px-6 text-[15px]",
};

export function buttonClasses(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string,
): string {
  return cn(
    "focus-ring inline-flex select-none items-center justify-center gap-2 rounded-control font-sans font-medium leading-none transition-[background-color,border-color,color,filter,box-shadow,transform] duration-[180ms] ease-out disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none",
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

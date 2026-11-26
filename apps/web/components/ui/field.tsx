import type { InputHTMLAttributes, LabelHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const fieldBase =
  "focus-ring w-full rounded-inner border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-[15px] leading-[1.5] text-chalk placeholder:text-chalk-500 transition-colors duration-[180ms] hover:border-white/[0.10] focus:border-white/[0.12]";

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("mb-2 block text-[13px] text-chalk-400", className)} {...props} />;
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldBase, className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(fieldBase, "resize-y leading-relaxed", className)} {...props} />;
}

export function FieldError({ children }: { children?: string }) {
  if (!children) return null;
  return <p className="mt-1.5 text-[13px] text-red-300">{children}</p>;
}

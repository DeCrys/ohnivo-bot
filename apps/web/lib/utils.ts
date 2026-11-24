import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatCredits(value: number): string {
  return new Intl.NumberFormat("cs-CZ").format(value);
}

export function formatDate(value: string | Date, locale = "cs-CZ"): string {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function formatDateTime(value: string | Date, locale = "cs-CZ"): string {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function pluralCredits(count: number): string {
  if (count === 1) return "kredit";
  if (count >= 2 && count <= 4) return "kredity";
  return "kreditů";
}

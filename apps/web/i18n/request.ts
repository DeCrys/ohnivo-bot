import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

export const LOCALE_COOKIE = "ohnivo_locale";
export type AppLocale = "cs" | "en";

export function resolveLocale(value: string | undefined): AppLocale {
  return value === "en" ? "en" : "cs";
}

export default getRequestConfig(async () => {
  const cookieLocale = cookies().get(LOCALE_COOKIE)?.value;
  const locale = resolveLocale(cookieLocale);
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
    timeZone: "Europe/Prague",
  };
});

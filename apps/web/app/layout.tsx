import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Inter, Fragment_Mono } from "next/font/google";
import { BRAND } from "@ohnivo/shared";
import "./globals.css";

/**
 * Inter for all reading and headings; the mono face is reserved for real
 * code and IDs. Both are OFL and include latin-ext for Czech diacritics.
 */
const sans = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
  display: "swap",
});

const mono = Fragment_Mono({
  subsets: ["latin", "latin-ext"],
  weight: "400",
  variable: "--font-mono",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) === "en" ? "en" : "cs";
  const title = `${BRAND.name} — ${BRAND.tagline[locale]}`;
  const description = BRAND.description[locale];

  return {
    title: {
      default: title,
      template: `%s · ${BRAND.name}`,
    },
    description,
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
    openGraph: {
      title,
      description,
      type: "website",
      locale: locale === "cs" ? "cs_CZ" : "en_US",
      siteName: BRAND.name,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    icons: {
      icon: "/icon.svg",
    },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className={`${sans.variable} ${mono.variable}`}>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

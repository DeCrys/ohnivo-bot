import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { IBM_Plex_Mono, Instrument_Serif, Inter_Tight } from "next/font/google";
import { BRAND } from "@ohnivo/shared";
import "./globals.css";

/**
 * Three faces, all open source, all with latin-ext so Czech diacritics stay in
 * the same family. Serif display + grotesk body + mono labels is the same
 * pairing the reference studios use (basar.studio, 12ft.studio/lab).
 */
const serif = Instrument_Serif({
  subsets: ["latin", "latin-ext"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const sans = Inter_Tight({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500"],
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
    <html
      lang={locale}
      className={`${serif.variable} ${sans.variable} ${mono.variable}`}
    >
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

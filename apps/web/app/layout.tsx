import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { BRAND } from "@ohnivo/shared";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: `${BRAND.name} — AI stavitel Discord komunit`,
    template: `%s · ${BRAND.name}`,
  },
  description: BRAND.description.cs,
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  openGraph: {
    title: `${BRAND.name} — AI stavitel Discord komunit`,
    description: BRAND.description.cs,
    type: "website",
    locale: "cs_CZ",
  },
  icons: {
    icon: "/icon.svg",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className="dark">
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

import { getLocale } from "next-intl/server";
import Link from "next/link";
import { BRAND } from "@ohnivo/shared";
import { Logo } from "@/components/brand/logo";

const CONTENT = {
  cs: {
    title: "Podmínky používání",
    updated: "Naposledy upraveno: 24. 11. 2026",
    sections: [
      {
        title: "1. Služba",
        body: `Ohnivo je nástroj, který na základě tvého popisu navrhne strukturu Discord serveru a po tvém potvrzení ji nechá bota vytvořit. Ohnivo není spojené s Discordem ani s ním není nijak propojené nad rámec standardního OAuth přihlášení a bota.`,
      },
      {
        title: "2. Účet a oprávnění",
        body: "Přihlašuješ se přes Discord. Pracujeme jen se servery, kde máš oprávnění Manage Server. Za obsah serveru a za to, komu dáš přístup, odpovídáš ty.",
      },
      {
        title: "3. Kredity a platby",
        body: "AI akce spotřebovávají kredity podle zveřejněného ceníku. Předplatné se obnovuje automaticky, dokud ho nezrušíš. Nevyčerpané kredity zůstávají na účtu. Ceny jsou uvedené včetně DPH.",
      },
      {
        title: "4. Odpovědnost",
        body: "Návrh od AI může obsahovat chyby. Vždy si projdi náhled, než stavbu spustíš. Bot nikdy nemaže existující kanály ani role bez výslovného potvrzení. Službu poskytujeme tak, jak je.",
      },
      {
        title: "5. Zrušení",
        body: "Předplatné můžeš kdykoli zrušit v zákaznickém portálu. Přístup k AI funkcím skončí na konci zaplaceného období. Účet můžeš nechat smazat na support e-mailu.",
      },
    ],
    contact: "Dotazy? Napiš nám na",
  },
  en: {
    title: "Terms of service",
    updated: "Last updated: 24 November 2026",
    sections: [
      {
        title: "1. The service",
        body: "Ohnivo turns your description into a Discord server blueprint and, after you confirm it, lets the bot create it. Ohnivo is not affiliated with Discord beyond the standard OAuth login and bot installation.",
      },
      {
        title: "2. Account and permissions",
        body: "You sign in with Discord. We only work with servers where you have Manage Server. You are responsible for the server content and for who you give access to.",
      },
      {
        title: "3. Credits and payments",
        body: "AI actions consume credits according to the published pricing. Subscriptions renew automatically until cancelled. Unused credits stay on your account. Prices include VAT.",
      },
      {
        title: "4. Responsibility",
        body: "AI output can contain mistakes. Always review the preview before starting a build. The bot never deletes existing channels or roles without explicit confirmation. The service is provided as is.",
      },
      {
        title: "5. Cancellation",
        body: "You can cancel a subscription in the customer portal at any time. AI access ends at the end of the paid period. You can request account deletion by email.",
      },
    ],
    contact: "Questions? Write to us at",
  },
} as const;

export default async function TermsPage() {
  const locale = (await getLocale()) === "en" ? "en" : "cs";
  const content = CONTENT[locale];
  return (
    <div className="min-h-screen">
      <header className="border-b border-line/60">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-5 sm:px-6">
          <Logo />
          <Link href="/" className="text-sm text-spark-100/60 hover:text-white">
            {locale === "en" ? "Back home" : "Zpět na úvod"}
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-semibold tracking-tight text-white">{content.title}</h1>
        <p className="mt-2 text-xs text-spark-100/40">{content.updated}</p>
        <div className="mt-8 space-y-6">
          {content.sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-sm font-semibold text-white">{section.title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-spark-100/60">{section.body}</p>
            </section>
          ))}
        </div>
        <p className="mt-10 text-sm text-spark-100/55">
          {content.contact}{" "}
          <a href={`mailto:${BRAND.supportEmail}`} className="text-spark-300 hover:text-spark-200">
            {BRAND.supportEmail}
          </a>
        </p>
      </main>
    </div>
  );
}

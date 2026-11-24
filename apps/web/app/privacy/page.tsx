import { getLocale } from "next-intl/server";
import Link from "next/link";
import { BRAND } from "@ohnivo/shared";
import { Logo } from "@/components/brand/logo";

const CONTENT = {
  cs: {
    title: "Soukromí",
    updated: "Naposledy upraveno: 24. 11. 2026",
    sections: [
      {
        title: "Co ukládáme",
        body: "Discord ID, uživatelské jméno, zobrazované jméno, avatar a seznam serverů, které spravuješ. Dále ukládáme návrhy serverů, průběh staveb, zůstatek kreditů a historii plateb.",
      },
      {
        title: "Proč to ukládáme",
        body: "Abychom tě poznali při přihlášení, ověřili oprávnění k serveru, mohli ti ukázat návrhy a stavby a správně účtovali kredity. Nic z toho neprodáváme.",
      },
      {
        title: "Discord tokeny",
        body: "Přístupové tokeny z Discordu šifrujeme symetrickým klíčem a ukládáme jen na serveru. Nikdy se nedostanou do prohlížeče. Relace má httpOnly cookie a dá se kdykoli zrušit odhlášením.",
      },
      {
        title: "AI a zpracování",
        body: "Popis komunity posíláme poskytovateli AI pouze za účelem vygenerování návrhu. Neposíláme mu tvůj Discord token ani platební údaje. Pokud AI klíč není nastavený, běží deterministický demo režim.",
      },
      {
        title: "Tvoje práva",
        body: "Můžeš požádat o výpis, opravu nebo smazání svých údajů. Napiš na support e-mail a ozveme se. Některé záznamy (například účetní ledger) musíme ze zákona uchovat.",
      },
      {
        title: "Cookies",
        body: "Používáme jen technické cookies pro přihlášení a volbu jazyka. Žádná reklamní ani sledovací cookie třetích stran.",
      },
    ],
    contact: "Ohledně soukromí piš na",
  },
  en: {
    title: "Privacy",
    updated: "Last updated: 24 November 2026",
    sections: [
      {
        title: "What we store",
        body: "Discord ID, username, display name, avatar and the list of servers you manage. We also store server blueprints, build progress, credit balance and payment history.",
      },
      {
        title: "Why we store it",
        body: "To recognise you at login, verify guild permissions, show your blueprints and builds, and charge credits correctly. We never sell any of it.",
      },
      {
        title: "Discord tokens",
        body: "Discord access tokens are encrypted with a symmetric key and stored server-side only. They never reach the browser. Sessions use an httpOnly cookie and can be revoked by signing out.",
      },
      {
        title: "AI processing",
        body: "We send your community description to the AI provider only to generate a blueprint. We never send your Discord token or payment details. Without an AI key the app runs a deterministic demo mode.",
      },
      {
        title: "Your rights",
        body: "You can request an export, correction or deletion of your data. Email support and we will respond. Some records (such as the accounting ledger) must be retained by law.",
      },
      {
        title: "Cookies",
        body: "We only use technical cookies for login and language preference. No advertising or third-party tracking cookies.",
      },
    ],
    contact: "Privacy questions:",
  },
} as const;

export default async function PrivacyPage() {
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

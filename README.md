# Ohnivo

AI stavitel Discord komunit. Uživatel popíše komunitu běžnou řečí a Ohnivo vygeneruje kompletní Discord server — kategorie, kanály, role, oprávnění, uvítání a volitelné grafiky.  
Brand: **Ohnivo**, maskot **Jiskřík**, doména `ohnivo.app`, podpora `ahoj@ohnivo.app`.

> UI, chyby, e-maily a texty bota jsou v češtině (výchozí). Angličtina je dostupná přes `next-intl`; locale se přepíná cookie `ohnivo_locale`. Kód a commit zprávy jsou v angličtině.

## Stack

- Next.js 14 App Router + React 18 + TypeScript + Tailwind, Vercel
- Supabase Postgres s RLS na každé tabulce
- Discord OAuth2 `identify guilds`, bot discord.js v14, standalone Node.js service v Dockeru, jobs fronta v Supabase
- Anthropic server-side, validace Zod, retry, rate limit
- Stripe subscriptions + webhook, kreditní systém
- Image generation připravěno za rozhraním `ImageProvider` (demo bez klíčů)

Monorepo:
```
/apps/web        – Next.js aplikace
/apps/bot        – discord.js worker
/packages/shared – schéma, limity, oprávnění, plánování aplikací
/supabase        – migrace SQL
```

## Požadavky

- Node 20+ (`.nvmrc`)
- npm 9+
- Přístup k Supabase, Discord Developer Portal, Stripe (volitelné pro demo)

## Nastavení

1. Fork / clone repo.
2. `npm install`
3. Zkopíruj `.env.example` → `.env` a vyplň:

- `NEXT_PUBLIC_APP_URL` – https://ohnivo.app v produkci
- Supabase URL, anon key, service role key, `SUPABASE_JWT_SECRET`
- Discord `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `DISCORD_BOT_TOKEN`
- `SESSION_SECRET` 32+ znaků pro šifrování tokenů
- `ANTHROPIC_API_KEY` – pokud není, běží deterministický mock provider
- Stripe klíče a ceny, webhook secret – nutné pro platby

`.env.example` obsahuje kompletní seznam proměnných pro web i bota.

4. Supabase migrace

```bash
# přes Supabase CLI nebo SQL editor
psql $DATABASE_URL -f supabase/migrations/0001_init.sql
psql $DATABASE_URL -f supabase/migrations/0002_rls.sql
psql $DATABASE_URL -f supabase/migrations/0003_functions.sql
psql $DATABASE_URL -f supabase/migrations/0004_realtime.sql
```

5. Discord aplikace
- Scope OAuth2: `identify`, `guilds`
- Redirect URI: `https://ohnivo.app/api/auth/callback`
- Bot scopes: `bot` + `applications.commands`; oprávnění: `Manage Channels`, `Manage Roles`, `View Channels`, `Send Messages`, `Manage Messages`. Nikdy neuděluj `Administrator`.

6. Stripe
- Produkty: Starter, Premium, Pro – měsíčně/ ročně
- Webhook na `/api/stripe/webhook` s událostmi `checkout.session.completed`, `invoice.paid`, `customer.subscription.deleted`
- Ceny se mapují na kredity: vygenerovat 40, upřesnit 20, aplikovat 30, ikona 60, banner 45, emoji 15, sticker 25

## Lokální běh

```bash
npm run dev          # web na :3000
npm run dev:bot      # bot worker lokálně (tsx)
```

Docker:

```bash
docker compose up --build
```

## Demo mód

Bez `ANTHROPIC_API_KEY` se používá mock provider s deterministickým výstupem. Všechny toky (generace, validace, náhled, aplikace) fungují.

## Kreditní plán

- Free: 0 kreditů
- Starter 149/1490 Kč – 300 kreditů
- Premium 349/3490 Kč – 900 kreditů, doporučeno
- Pro 799/7990 Kč – 2400 kreditů

Kredity jsou append-only v `credit_ledger`; atomic `spend_credits` / `grant_credits` s advisory lockem.

## Bezpečnost

- Secrets pouze server-side
- Per-route kontrola členství v gildě, RLS, audit log
- AI rate limit + sanitizace promptu
- Whitelist oprávnění, nikdy `Administrator`, `Manage Guild`, `Manage Webhooks`; `Ban Members`, `Mention Everyone`, `Manage Messages` jen pro staff role názvy
- Zod validace na všech API hranicích

## Struktura fází

- **Fáze 1**: monorepo, env, Supabase, Discord OAuth, dashboard „Moje servery“, landing, bot invite oprávnění
- **Fáze 2**: Zod `ServerBlueprint`, AI generace s retry, náhled editor, ready screen s kredity a countdown, bot apply engine s merge/append, rollback, realtime checklist, billing, právní stránky

## Příspěvek

Kód v angličtině, commit zprávy v angličtině, UI v češtině. Testy: `npm run test`, `npm run typecheck`, `npm run build:web`.

## Licence

Interní. Nekomercionálně.

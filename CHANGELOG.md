# Changelog

## Phase 2 – 2026-11-24

### Přidáno
- AI builder: `ServerBlueprint` Zod schémata, normalizace, limity, systémový prompt v češtině, JSON-only výstup
- Validace blueprintu s jedním retry, odezva chyb, refund při selhání
- Editor náhledu s přejmenováním, mazáním, přesunem, regenerací, upřesněním promptem
- Ochrana proti nebezpečným oprávněním, automatické odstranění a report v náhledu
- Ready screen s cenou, porovnání zůstatku, deaktivované tlačítko při nedostatku kreditů, krátký storno countdown
- Apply pipeline: create job, kreditní odečet, guard proti duplicitě, realtime checklist přes Supabase Realtime + polling fallback
- Bot apply engine: pořadí role → kategorie → kanály → overwrites → uvítací zpráva, rate-limit queue s exponenciálním backoffem, idempotentní resume, merge/append módy, rollback pouze vlastních objektů
- Billing: `/dashboard/billing`, plan picker, Stripe checkout & portal, webhook s idempotencí, připsání kreditů na `invoice.paid`, downgrade při zrušení
- Notifikace bell, čtení notifikací
- Právní stránky `/terms`, `/privacy` v češtině a angličtině
- i18n doplnění: `messages/cs.json` a `en.json` s billing, checkoutSuccess, checkoutCancelled, activeUntil
- Webpack `extensionAlias` `.js`→`.ts` pro `@ohnivo/shared`

### Opraveno
- Typy discord.js: `colors: { primaryColor }`, cast pro smazání kanálu v rollbacku
- Přesun permission listu v promptu na `BASE_ROLE_PERMISSIONS` a `STAFF_EXTRA_PERMISSIONS`

## Phase 1 – 2026-11-24

### Přidáno
- Monorepo s npm workspaces, `package.json` skripty, `tsconfig.base.json`, `.gitignore`, `.nvmrc`, `docker-compose.yml`
- `packages/shared`: limity, permissions, blueprint, apply-plan, progress, plány, bot-i18n, branding
- Supabase migrace: `0001_init.sql`, `0002_rls.sql`, `0003_functions.sql`, `0004_realtime.sql`
- Web i18n `next-intl`, locale cookie, stránky landing, auth, dashboard shell
- Discord OAuth + `sessions` tabulka, šifrování tokenů AES-256-GCM, Supabase user-scoped klient s HS256 JWT
- Dashboard „Moje servery“, refresh guilds, bot status, instalace bota, kreditní zůstatek
- AI mock provider pro demo, rate limit, sanitizace
- API routy základní auth, guilds, kredity
- Bot skeleton, Dockerfile, `queue.ts`, `apply.ts` základ
- Brand UI, maskot Jiskřík komponenty
- Tests 17/17 passující

### Poznámky
- Bez externích klíčů se spouští demo mód s mock AI
- Všechny tabulky mají RLS, audit log a append-only triggery

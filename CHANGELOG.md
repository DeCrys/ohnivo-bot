# Changelog

## Oprava oprávnění bota – 2026-11-25

### Opraveno
- Bot s oprávněním **Administrator** teď správně pozná, že smí přidělit všechna staff oprávnění. Dřív se kontroloval jen syrový bitfield (`permissions.bitfield`), který se u Administratora nerozšiřuje, takže build nesmyslně selhal na „bot nemůže přidělit některá požadovaná oprávnění staff rolím“.
- Instalační odkaz bota (`BOT_INSTALL_PERMISSIONS`) nově žádá všechna staff oprávnění, která bot přiděluje rolím. Discord nedovolí botovi rozdávat oprávnění, která sám nemá, takže bez toho nešly postavit role moderátorů/staffu.
- Nahrazení (`replace`) už nezastaví celou stavbu kvůli staff oprávněním, která bot nemá. Oprávnění se vynechají, stavba doběhne a uživatel dostane srozumitelné upozornění s výčtem vynechaných oprávnění.
- Preflight před stavbou: pokud botovi chybí `Spravovat kanály` nebo `Spravovat role`, job hned selže s výčtem chybějících oprávnění a odkazem na nové pozvání bota; kredity se vrátí.
- Role jako `Majitel`, `Vlastník`, `Zakladatel`, `Šéf`, `Ředitel`, `Owner` nebo `Founder` se teď považují za staff. Dřív je heuristika podle názvu neznala, takže AI sice dala `Majitel`ovi `KICK_MEMBERS`/`BAN_MEMBERS`/`MANAGE_MESSAGES`, ale normalizace je vyhodnotila jako „odebratá oprávnění“ a zahodila. Názvy rolí se navíc porovnávají bez diakritiky (`Moderátor` = `Moderator`, `Vlastník` = `Vlastnik`).
- Apply stránka má nového grafického průvodce pro chybu hierarchie rolí: mock Discord seznamu rolí (červené role nad botem, zelená role bota, šipka „přetáhni Ohnivo sem“), tři kroky a odkazy na Discord a dokumentaci. Zobrazí se automaticky, když job selže na hierarchii rolí. Role `Ohnivo` se v mocku sama animovaně přetahuje nahoru nad blokované role (smyčka, respektuje `prefers-reduced-motion`).
- Chybové hlášky z bota se v dashboardu zobrazují v jazyce UI, ne v jazyce serveru. Bot píše chyby podle locale guildy (často `cs`), takže anglické UI dřív ukazovalo český text. Nový `apps/web/lib/apply-errors.ts` rozpozná preflight chyby nahrazení (hierarchie rolí, kanály bez `Manage Channels`, chybějící `Manage Roles`) v češtině i angličtině a `apply-progress.tsx` je znovu vykreslí přes překlady `ai.apply.failure` včetně správného českého plurálu (1 role / 3 role / 7 rolí).

## Phase 2 – 2026-11-24

### Přidáno
- Administrace pro AI testování: lokální vývojářský přístup, kontrola konfigurace AI a auditované připsání testovacích kreditů
- Administrátoři mohou v AI builderu a apply flow testovat i bez předplatného; nadále platí odečet kreditů
- Apply nabízí pouze režim přidání nebo potvrzeného nahrazení; nahrazení nejdřív vytvoří novou strukturu a až poté odstraní původní kanály a spravovatelné role
- Snapshot původní struktury pro bezpečné opakování úklidu; `@everyone`, spravované role a role nad botem se zachovají
- Staff oprávnění, která bot sám nemá, se bezpečně vynechají; replace se při jejich výskytu zastaví ještě před smazáním původní struktury
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

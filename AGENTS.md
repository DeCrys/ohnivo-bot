# AGENTS.md

Pravidla pro každého agenta, který pracuje v tomhle repozitáři (Claude Code,
OpenCode, Codex, Cursor…). Platí pro všechny modely a všechny session.

Produkt: **Ohnivo** – AI builder pro Discord komunity. Web dashboard (`apps/web`,
Next.js App Router + Tailwind + next-intl) + Discord bot (`apps/bot`, discord.js).
Monorepo npm workspaces: `apps/web`, `apps/bot`, `packages/shared`.

---

## 1. Před každou UI prací

1. Přečti **`DESIGN.md`** – tam jsou tokeny, existující komponenty, motion pravidla
   a i18n pravidla. Není to volitelné.
2. **Načti 1–3 relevantní UI skill** (viz `UI-SKILLS.md` pro přehled). Skill
   neurčuje design za tebe, ale dává konkrétní pravidla a hodnoty.
   - Router skill pro výběr: `ibelick-ui-skills-root`
   - Vyhledávání v katalogu: `C:\Users\hry15\.config\opencode\skills\CATALOG.md`
     (844 skillů) nebo `npx ui-skills list --category <téma>`
   - Načítání: skill tool s ID, nebo `@skill-id` v promptu
   - **Nevymýšlej si ID** – pokud si nejsi jistý, grepni `CATALOG.md`
3. **Znovu použij existující komponenty** (`apps/web/components/ui/*`), tokeny
   z `apps/web/tailwind.config.ts` a helper classy z `globals.css`
   (`.surface`, `.surface-muted`, `.gradient-text`, `.focus-ring`). Nová barva,
   stín nebo radius musí nejdřív přijít do `tailwind.config.ts`.
4. Po změnách pust `npm test` a `npm run typecheck` – obojí musí zůstat zelené.

Read-only skilly (`ibelick-improve-ui`, `emilkowalski-improve-animations`,
`millionco-improve-react`, `emilkowalski-find-animation-opportunities`) **nemění
kód** – vrací audit + plán. Pokud má úkol vést ke změně kódu, použij implementační
skill, nebo to výslovně uveď.

## 2. i18n – tuhle část obalit

- Všechen text v UI jde z `apps/web/messages/cs.json` a `apps/web/messages/en.json`.
  **Žádný hardcoded text v komponentách.**
- Česky je default, angličtina musí znít jako angličtina, ne jako strojový překlad.
- **Data ze serveru nejsou UI text.** Discord role/kanály (`👑Majitel`, `Owner`, …)
  jsou uživatelská data → vykresluj je jako samostatný badge/chip s štítkem,
  **nikdy uvnitř anglické věty**.
- Chyby z bota chodí v jazyku guildu. Web je překládá přes
  `apps/web/lib/apply-errors.ts` + klíč `ai.apply.failure`. Nový známý tvar chyby
  → rozšíři parser, ne text v komponentě.
- Plurals (1 role / 3 role / 7 rolí) řeš přes `next-intl`, ne skládáním stringů.

## 3. Kód a bezpečnost

- Nikdy nevypisuj do logu, odpovědi ani commitu: Discord bot token, Supabase
  service role key, Stripe secret key, session secret.
- **Supabase DB se bez výslovného pokynu uživatele nesmí měnit** (čtení
  pro diagnostiku je ok).
- Bez potvrzení se neroztahují, nedeployují, nerestartují VPS a neprovádí
  destruktivní Discord akce (mazání rolí/kanálů).
- Stripe běží v **live** režimu. Stale/test-mode `stripe_customer_id` se řeší
  recovery logikou v `apps/web/app/api/stripe/checkout/route.ts` – ne úpravou DB.
- Ceny se berou z `packages/shared/src/plans.ts`; Stripe price lookup keys
  jsou `ohnivo_<plan>_<interval>_<amount>_czk`.

## 4. Git

- `POZNAMKY-POKRACOVANI.md` je **lokální poznámka, nesmí se commitnout**.
- Commit message v tomhle rebu jsou v angličtině a ve tvaru
  `fix: …` / `feat: …` / `docs: …`.
- Necommituj `.env`, `.env.local`, `apps/web/.next`, build artefakty.

## 5. Testy a build

```bash
npm test          # vitest (packages/shared)
npm run typecheck # tsc --noEmit ve všech workspaces
npm run build:web # Next build (při chybě .next/types smaž apps/web/.next a tsconfig.tsbuildinfo)
npm run dev       # web na :3000
npm run dev:bot   # bot worker
```

Testy jsou v `packages/shared/tests` (a `apps/web/lib/*.test.ts`).
`npm test` currently spouští jen shared workspace – když přidáš test do webu,
spusť ho i samostatně (`vitest run` v `apps/web`).

## 6. Kde co leží

| Cesta | Obsah |
| --- | --- |
| `apps/web/app` | routy, API (`app/api/stripe/*`, `app/api/auth/*`) |
| `apps/web/components` | `ui/` primitivy, `dashboard/`, `ai/`, `marketing/`, `admin/`, `brand/` |
| `apps/web/messages` | `cs.json`, `en.json` (next-intl) |
| `apps/web/lib` | supabase, stripe, auth, i18n helpery, testy |
| `apps/bot/src` | `index.ts`, `apply.ts` (blueprint aplikace), Discord logika |
| `packages/shared/src` | `plans.ts`, `permissions.ts`, `blueprint.ts`, `bot-i18n.ts` |
| `DESIGN.md` | design system (tokeny, komponenty, motion, a11y) |
| `UI-SKILLS.md` | přehled UI skillů: „co chceš → který skill“ |

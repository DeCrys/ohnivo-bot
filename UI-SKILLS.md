# UI Skills – co chceš a který skill na to

844 skillů je nainstalovaných globálně v `C:\Users\hry15\.config\opencode\skills`.
Tady je **praktický přehled** toho, co se používá v tomhle projektu.

Nemusíš znát ID. Napiš mi slovy, co chceš (“chci hezčí animaci na role guide”),
a já skill vyberu a použiju. Nebo mi řekni `@skill-id` a načtu ho rovnou.

**Jak to funguje**
- 78 skillů má model v seznamu vidět sám a použije je, když úloha sedí.
- Zbývajících 766 je „skrytých“ – načtu je jen když je výslovně zmíníš.
- Skill je **pravidla a konkrétní hodnoty** (durations, easings, barvy, spacing),
  ne design za tebe. Design drží `DESIGN.md`.
- Některé skilly jsou **read-only** (audit → plán, bez zásahu do kódu).
  Řekni „implementuj to“ a přejdeme na implementační skill.

Hledání v celém katalogu:
```bash
npx ui-skills list --category motion     # seznam skillů v tématu
npx ui-skills get <slug>                 # obsah jednoho skillu
grep -i "pricing" "C:\Users\hry15\.config\opencode\skills\CATALOG.md"
```

---

## 1) „Chci novou/hezčí obrazovku“

| Co chceš | Skill | Co udělá |
| --- | --- | --- |
| Výraznější vizuální styl, ať to nevypadá jako generická AI | `anthropics-frontend-design` | směr, typografie, barvy, skladba |
| Všechno dohromady (hierarchie, text, barvy, motion, i18n) | `pbakaus-impeccable` | komplexní design pass, umí i zapsat `DESIGN.md` |
| Pět různých variant na výběr | `0xdesign-design-lab` | vygeneruje varianty, které porovnáme |
| Design pro dashboard/admin (tohle je náš produkt) | `dammyjay93-interface-design` | UI pro data, hierarchii, stavy |
| Hledat v inspiracích (styly, palety, fonty, UX pravidla) | `nextlevelbuilder-ui-ux-pro-max` | prohledá 80 stylů, 194 palet, 141 pravidel |
| Landing page (jedna nabídka, jedna CTA) | `mengto-landing-page` | struktura, copy, SEO/AEO |
| Cenová tabulka | `mengto-pricing-page` | sazebníky, porovnání plánů |
| „Nebudte nudný“ / „buď odvážnější“ | `pbakaus-bolder`, `pbakaus-delight`, `pbakaus-overdrive` | přidá osobnost, výraz |
| „Uklid to“ / „méně chaosu“ | `pbakaus-quieter`, `pbakaus-distill` | zjednoduší, utlumí |
| Konkrétní vizuální styl (Swiss, minimalistický) | `zeke-swiss-design` | racionální grid, grotesk, hodnoty |

## 2) „Chci animaci / pohyb“

| Co chceš | Skill | Co udělá |
| --- | --- | --- |
| Konkrétní durata, easing, scale, vzdálenost | `jakubkrehel-better-motion` | přesné hodnoty pro daný pohyb |
| Animace od nuly (i s přerušením a exitem) | `emilkowalski-animate` | rozhodne: animovat vůbec, čím, jak |
| Mikrointerakce, feedback, hover/press | `wshobson-interaction-design` | chování UI prvků |
| Hotové CSS přechody (toast, modal, skeleton, taby) | `jakubantalik-transitions-dev` | recepty 1:1 do CSS |
| „Animace jako Stripe/Linear“ | `mengto-animation-systems` | motion systém: easing, délky, choreografie |
| Aby se to nesekala (60 fps) | `iart-ai-60fps-animation` | transform místo width/height, layout thrashing |
| Stránkové přechody v Next.js | `iart-ai-page-transition-animation` | View Transitions API, App Router |
| SVG animace | `iart-ai-svg-animation` | kreslení, morph, scrub |
| Jak se to jmenuje („to efekt s bouncing bublinou“) | `emilkowalski-animation-vocabulary` | překlad popisu na odborný název |
| Spring, nebo ease? | `raphaelsalaja-to-spring-or-not-to-spring` | audit timingů |
| 12 principů animace | `raphaelsalaja-12-principles-of-animation` | Disney principy pro web |

## 3) „Chci to prověřit / zkontrolovat“

| Co chceš | Skill | Co udělá |
| --- | --- | --- |
| Audit UI a návrh plánu (read-only) | `ibelick-improve-ui` | najde reálné problémy, napíše plán pro implementaci |
| Technický audit (a11y, výkon, responzivita) | `pbakaus-audit` | checklist audit |
| Odborný posudek, skóre | `pbakaus-critique` | hodnocení designu |
| Web interface guidelines | `vercel-labs-web-design-guidelines` | pravidla + kontrola kódu |
| Kompletní web audit (Lighthouse, SEO) | `addyosmani-web-quality-audit` | potřebuje Lighthouse/Playwright |
| Přístupnost (WCAG 2.2) | `jakubkrehel-better-accessibility` | keyboard, focus, ARIA, formuláře |
| Přístupnost (detaily) | `ibelick-fixing-accessibility` | ARIA labely, focus management, kontrast |
| Vizuální + a11y review | `rams-design-rams` | průchod obrazovkou |
| Animace: co se hýbe špatně | `emilkowalski-improve-animations` (read-only) | prioritizovaný plán |
| React: co je rozbité | `millionco-react-doctor` | lint, a11y, bundle, architektura |

## 4) „Chci lepší barvy / text / layout“

| Co chceš | Skill | Co udělá |
| --- | --- | --- |
| Barvy jako systém, kontrast, gamut | `jakubkrehel-better-colors` | palety, sémantické tokeny |
| OKLCH (barevný prostor) | `jakubkrehel-oklch-skill` | konverze hex→oklch, dark mode |
| Čitelný text a rytmus | `jakubkrehel-better-typography` | type scale, wrapping, tabular numbers |
| Lepší texty (tlačítka, chyby, prázdné stavy) | `jakubkrehel-better-writing` | microcopy ve hlasu produktu |
| Srozumitelnější popisky | `pbakaus-clarify` | labely, hlášky, CTA |
| Rozmístění a hierarchie | `jakubkrehel-better-layout`, `pbakaus-layout` | spacing, alignment, čtenářské pořadí |
| Responzivita a různé breakpointy | `pbakaus-adapt` | breakpointy, kontext zařízení |
| Detaily, stíny, ikony, border radius | `jakubkrehel-better-ui` | přesné hodnoty pro povrchy |
| Ostré stíny (místo default Tailwind) | `mengto-beautiful-shadows` | vrstvené elevation utility |

## 5) „Chci výkon / stabilitu“

| Co chceš | Skill | Co udělá |
| --- | --- | --- |
| React/Next best practices | `vercel-labs-react-best-practices` | waterfall, re-render, bundle |
| Před commitem: lint + a11y + architektura | `millionco-react-doctor` | sken a triage |
| Pomalá stránka, co brzdí paint | `raphaelsalaja-vitals` | měření na throttled síti (potřebuje browser) |
| Sekaná animace | `ibelick-fixing-motion-performance` | compositor properties, blury |
| Web platform guidelines (dialogy, layout shift, dark mode) | `vercel-labs-modern-web-guidance` | potřebuje agent-browser |

## 6) „Chci design system / Tailwind / shadcn“

| Co chceš | Skill | Co udělá |
| --- | --- | --- |
| Zapsat nebo rozšířit `DESIGN.md` | `pbakaus-impeccable` | tokeny, pravidla, dokumentace |
| shadcn komponenty | `shadcn-ui-shadcn` | přidat, hledat, stylovat, opravit |
| Tailwind bez hádání | `mengto-tailwindcss` | recepty a konvence |
| Jak vybrat správnou komponentu celkově | `ibelick-ui-skills-root` | router – vybere nejmenší správnou sadu skillů |

---

## Rychlé tipy

- **„Něco je tu divný, zkus to zlepšit“** → `ibelick-improve-ui` (read-only) →
  schválíš plán → implementační skill.
- **„Přidej animaci“** → `jakubkrehel-better-motion` (hodnoty) nebo
  `emilkowalski-animate` (když je potřeba rozhodnout, jestli vůbec animovat).
- **„Něco se mi nelíbí na pricingu“** → `mengto-pricing-page` + `pbakaus-critique`.
- **„Máme tam a11y problém“** → `jakubkrehel-better-accessibility`.
- **„Je to pomalé“** → `vercel-labs-react-best-practices` + `raphaelsalaja-vitals`.
- Když nevíš, který skill: napiš to slovy, já grepnu `CATALOG.md` (844 položek)
  a vyberu 1–3 nejvhodnější.

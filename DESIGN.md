# Ohnivo — Design System

Reference for every UI change in this repo. Read it before designing or editing
any screen, and keep new work inside these tokens instead of inventing new ones.

- **Brand:** Ohnivo ("fire" in Czech). Mascot: Jiskřík. Domain: `ohnivo.app`.
- **Stack:** Next.js App Router + React + Tailwind CSS v3 (`apps/web/tailwind.config.ts`),
  TypeScript, `next-intl` for i18n (Czech default, English secondary).
- **Product:** Discord bot + web dashboard for generating and applying Discord
  server blueprints ("AI tools hub", blueprint editor, apply progress).

## Two surfaces, one brand

| Surface | Routes | Language |
| --- | --- | --- |
| **Paper** (editorial, marketing) | `/`, `/pricing`, `/login`, `/privacy`, `/terms` | Warm paper, ink type, hard 1px rules, one accent, serif display |
| **Ink** (application shell) | `/dashboard/**` | Dark `ink-950`, violet `spark`, soft surfaces, rounded cards |

Both are legitimate. Do not mix them: a paper page never gets a glowing card, a
dashboard screen never gets a serif display headline. The only bridge is
`.panel-ink` — a dark product panel embedded inside a paper page (hero blueprint,
CTA band, login aside).

## Tokens (source of truth: `apps/web/tailwind.config.ts`)

### Paper surface (marketing)

| Token | Hex | Use |
| --- | --- | --- |
| `paper` | `#FBFBF2` | page background (also `body` default) |
| `paper-deep` | `#F4F1E6` | inset blocks, form fields |
| `paper-sand` | `#EAE7DB` | full-bleed band (community types) |
| `graphite` | `#1B1B1C` | primary text, ink buttons, 1px rules at `/15` |
| `graphite-500` | `#595959` | body copy, secondary text |
| `graphite-400` | `#8A8A8A` | fine print only (never body copy) |
| `lilac` | `#C6BDFF` | one highlight per view (featured plan, small marks) |
| `acid` | `#FFF96F` | rare badge (yearly saving); never large areas |

Rules are `border-graphite/15` (hairline) and `bg-graphite/15` (1px dividers).
No gradients, no glass, no blurred cards, no rounded corners on paper. Radius is
`0` everywhere on the marketing surface except the mascot and the logo tile.

### Ink surface (dashboard, unchanged)

| Token | Hex | Use |
| --- | --- | --- |
| `ink-950` | `#07070D` | page background, focus-ring offset |
| `ink-900` | `#0B0B14` | muted surfaces |
| `ink-850` | `#10101C` | `.surface` background (80% alpha + blur) |
| `ink-800` | `#141423` | secondary buttons, raised blocks |
| `ink-700` | `#1C1C2E` | hover state of `ink-800` |
| `ink-600` | `#26263B` | deepest raised block |
| `line` | `#2A2A40` | borders, scrollbar thumb |

### Brand — "spark" (violet, primary accent)

`50 #F2EFFF` · `100 #E4DDFF` · `200 #C9BBFF` · `300 #A98FFF` · `400 #8B6BFF` ·
`500 #7450F5` (primary) · `600 #5E3ADB` (active) · `700 #4A2CB0` · `800 #371F86` · `900 #24145C`

On paper, `spark-600` is only a hover state for ink buttons and the full stop in
the wordmark. It never fills a block.

### Accent — "ember" (cyan, secondary highlight)

`400 #54C7FF` · `500 #22A8F0` — dashboard only.

### Effects

- `shadow-glow`, `shadow-card`, `bg-spark-radial`, `.grid-bg` — ink surface only.
- Paper uses no shadow at all. Depth comes from rules, not elevation.

## Typography

Three faces, loaded with `next/font/google` in `apps/web/app/layout.tsx`
(`latin` + `latin-ext`, so Czech diacritics stay in the same family):

| Role | Family | CSS var | Use |
| --- | --- | --- | --- |
| Display | `Instrument Serif` | `--font-serif` | h1/h2, plan prices, the footer wordmark |
| Body | `Inter Tight` | `--font-sans` | paragraphs, buttons, navigation |
| Meta | `IBM Plex Mono` | `--font-mono` | 11px uppercase labels, counters, `/show` |

- `.display` = serif, normal weight, `tracking-display` (`-0.03em`), `leading-[0.98–1.1]`.
- `.mono-label` = 11px mono, uppercase, `tracking-label` (`0.14em`), `graphite/70`.
- Marketing h1: `clamp(2.7rem, 7.2vw, 6.4rem)`, second line in italic `graphite/75`.
- Body copy on paper: 15–17px, `leading-relaxed`, `graphite-500`.
- Numbers in tables: `tabular-nums` mono.
- Dashboard keeps Tailwind's default scale and the existing `gradient-text`.

## Layout

- `.shell` = `max-w-[1680px]`, gutters `20px → 32px → 70px`. Every marketing page
  section sits inside it; full-bleed bands put the background on the section and
  the `.shell` inside.
- Section rhythm: `py-16 lg:py-24`, with 100–140px between blocks.
- `SectionHeader` (`components/marketing/ui.tsx`): mono index + label, serif
  statement, short lead — `10rem | 1fr | 22rem` on `lg`. Indices run `01…06`.
- Lists and ledgers are rows separated by 1px rules, never cards.
- Asymmetry is deliberate: a wide statement with a narrow offset column beats a
  centered stack.

## Components

Reuse before building. Never hand-roll a variant that already exists.

### Paper (marketing)

- `components/marketing/ui.tsx` — `SectionHeader`, `ArrowUpRight`, `ArrowRight`, `Rule`.
- `components/marketing/*` — `site-header`, `hero`, `how-it-works`, `features`,
  `community-types`, `pricing-section`, `faq`, `cta`, `site-footer`,
  `pricing-plans`, `pricing-ledger`, `pricing-faq`, `legal-page`.
- Utilities from `globals.css`: `.shell`, `.hairline`, `.mono-label`, `.display`,
  `.panel-ink`, `.link-rule` (underline that grows on hover/focus), `.reveal-line`,
  `.focus-ring`.
- Buttons on paper are **square** mono uppercase bars: `h-11/h-12`, `px-4/6`,
  `bg-graphite text-paper`, hover `bg-spark-600`. Secondary = `border-graphite/30`,
  hover fills ink.
- `Logo` and `LocaleSwitcher` take `tone="dark" | "light"`. Marketing uses
  `tone="light"`; the dashboard keeps the default.

### Ink (dashboard)

- `components/ui/button.tsx` — `Button` / `buttonClasses`, variants
  `primary | secondary | ghost | danger | outline`, sizes `sm | md | lg`.
  Primary = `bg-spark-500` + `shadow-glow`; `rounded-xl`, `focus-ring`,
  `transition-colors`, disabled at `opacity-50`.
- `components/ui/primitives.tsx` — cards, badges, inputs. `components/ui/field.tsx`
  — label + error wrapper.
- Surfaces: `.surface` (`rounded-2xl`, `border-line/70`, `bg-ink-850/80`,
  `shadow-card`, blur) and `.surface-muted` (`rounded-xl`, `border-line/60`,
  `bg-ink-900/70`).
- `.focus-ring` — `ring-2 ring-spark-400 ring-offset-2 ring-offset-ink-950` on ink;
  on paper it is `outline-2 outline-offset-2 outline-spark-500`.

## Motion

- Paper has **one** authored moment per page: the hero headline rises through a
  mask (`.reveal-line`, 900ms, `cubic-bezier(0.2, 0, 0, 1)`, 90ms stagger).
  Everything else is a 300ms colour or transform change on hover.
- Ambient loops: `animate-float` (6s) and `animate-pulse-soft` (2.4s) on ink.
- The role-hierarchy demo (`.role-drag-clone`, 2.4s) and `.skeleton` shimmer live
  in `globals.css`.
- Motion must explain state or hierarchy. No scroll-triggered reveal on every
  section, no parallax, no animated gradients.
- `prefers-reduced-motion: reduce` is mandatory: every animation/loop needs a
  branch (hide or freeze, never remove meaning). `.reveal-line`, `.link-rule`,
  `animate-float` and the role demo already handle it.

## Internationalization (hard rules)

- All user-facing copy lives in `apps/web/messages/cs.json` and `apps/web/messages/en.json`.
  No hard-coded strings in components; no Czech copy leaking into the English UI.
- Czech is the default locale; English must read as English, not as a translation stub.
- **Server data is not UI copy.** Discord role/channel names are user data
  (`👑Majitel`, `Owner`, …). Render them as separate labelled badges/chips, never
  embedded inside an English sentence.
- Prices use the locale's currency label (`Kč` / `CZK`) and the locale's number
  format; the period is a separate string (`/ měsíc`, `/ month`). Never concatenate
  both into one message key.
- Bot-side errors arrive in the guild locale; the web re-renders them in the
  viewer's locale via `apps/web/lib/apply-errors.ts` plus the `ai.apply.failure`
  message block. Extend that parser when new known error shapes appear.

## Accessibility

- WCAG 2.2 AA target: visible focus rings, 4.5:1 text contrast, 44px hit areas
  for primary actions, real `<button>`/`<a>` semantics, labelled form errors.
- `graphite-400` is for fine print at 11px only; body copy never drops below
  `graphite-500` (4.9:1 on paper).
- Every icon-only control needs a localized accessible name; decorative SVG gets
  `aria-hidden="true"`.
- Respect reduced motion and zoom; never hide content behind hover-only affordances.
- Do not add a third surface or a dark-mode toggle. Paper and ink are fixed roles.

## Guardrails

- Do not add a new color, shadow, or radius outside the token table. If a new
  value is genuinely needed, add it to `tailwind.config.ts` first.
- Keep the `.surface` / `.surface-muted` / `Button` vocabulary on ink; keep
  `.shell` / `.mono-label` / `.display` / `.link-rule` on paper.
- Marketing may be expressive, but only through type, rules and spacing —
  not through effects. Dashboard and admin screens stay quiet, dense and legible.
- Pre-existing `npm test` and `npm run typecheck` must stay green.

# Ohnivo — Design System

Reference for every UI change in this repo. Read it before designing or editing
any screen, and keep new work inside these tokens instead of inventing new ones.

- **Brand:** Ohnivo ("fire" in Czech). Mascot: Jiskřík. Domain: `ohnivo.app`.
- **Stack:** Next.js App Router + React + Tailwind CSS v3 (`apps/web/tailwind.config.ts`),
  TypeScript, `next-intl` for i18n (Czech default, English secondary).
- **Product:** Discord bot + web dashboard for generating and applying Discord
  server blueprints ("AI tools hub", blueprint editor, apply progress).

## One soft, premium surface everywhere

Landing pages, `/dashboard/**`, billing, builder and every component share one
material: a near-black canvas with softly rounded, barely outlined cards. There
is no second "app shell" vocabulary, no blueprint hatch, no hairline frame, no
selection-handle corners and no dashed guides.

The earlier blueprint system (hatched margins, 2px corners, uppercase mono
labels, square markers, inverted rows) and the violet Ink panels were retired.
Their token names survive as aliases so call sites stay stable while the values
come from one place.

### Where the direction comes from

Reference: Raycast's AI core-features cards — near-black canvas, one tonal step
per surface, whisper-thin borders, large radii, inset top highlight, quiet
type and a single restrained violet accent. Direction only; no assets copied.

## Tokens (source of truth: `apps/web/tailwind.config.ts` + `app/globals.css`)

Every colour resolves to a CSS variable declared in `:root` in `globals.css`.
The `*-rgb` channel variables exist so Tailwind opacity modifiers keep working
(`bg-void-900/60`, `text-chalk-400/80`). Add a new token to both files, never
inline in a component.

| CSS variable | Value | Use |
| --- | --- | --- |
| `--bg` | `#08090a` | page canvas, flat, no pattern |
| `--card` | `#0e0f11` | cards, panels, billing plans |
| `--card-2` / `--card-3` | `#121316` / `#17181b` | nested rows, controls, disabled fills |
| `--card-border` | `rgba(255,255,255,0.06)` | every 1px outline |
| `--card-border-hover` | `rgba(255,255,255,0.10)` | hover ceiling |
| `--inner-bg` / `--inner-border` | `rgba(255,255,255,0.03/0.05)` | list rows, inputs |
| `--text` | `#ffffff` | headlines, primary values |
| `--text-secondary` | `#d4d5d9` | supporting copy |
| `--text-muted` | `#9a9ca2` | descriptions, labels |
| `--text-subtle` | `#8b8d93` | fine print, header cells |
| `--accent` | `#8b5cf6` | primary button, active state, small icons only |
| `--accent-soft` | `#a78bfa` | accent text on dark, tiny dots |
| `--radius-card` | `24px` | cards, panels, plan columns |
| `--radius-inner` | `14px` | nested boxes, rows, inputs, alerts, menus |
| `--radius-control` | `10px` | buttons |
| `--radius-pill` | `999px` | badges, tags, toggles, pills |
| `--highlight` | `inset 0 1px 0 rgba(255,255,255,0.04)` | top edge on every card |
| `--shadow-soft` | `0 24px 60px -32px rgba(0,0,0,0.4)` | large soft depth only |

Tailwind aliases: `void` → canvas/cards, `chalk` → text, `wire` → borders,
`ink` → nested fills, `line` → editor separators, `spark` → accent. Radius
utilities: `rounded-card`, `rounded-inner` (`rounded-panel`), `rounded-control`
(`rounded-tick`), `rounded-pill`.

### Effects

- No hatch, grid, dot or diagonal background. `bg-hatch*` and `.grid-bg` are
  retained as class names for compatibility but render as soft tonal washes.
- No square selection handles: `.rule-nodes` and `.rule-nodes-bottom` are plain
  1px separators with no `::before` / `::after` nodes.
- No hard shadows. Cards use `--highlight` plus `--shadow-soft`.
- `.list-fade` / `.carousel-fade` fade long lists and carousels at the edges
  (`mask-image: linear-gradient(...)`). Never clip abruptly.
- `focus-ring` has **no outline at rest**. Keyboard focus only: 2px
  `rgba(139,92,246,0.5)` outline with 2px offset on `:focus-visible`; it inherits
  the element's radius. Mouse clicks never paint an outline.

## Typography

`Inter` (`--font-sans`) is loaded in `apps/web/app/layout.tsx` for `latin` +
`latin-ext`, so Czech diacritics stay in the family. `Fragment Mono`
(`--font-mono`) is reserved for **real code and IDs** — never for labels,
navigation, buttons or headings.

| Role | Treatment |
| --- | --- |
| Card / section heading | Inter, 18–20px (section up to 28px), weight 500–600, `#fff`, no uppercase, `tracking-display` (-0.02em) |
| Description | Inter, 15–16px, weight 400, `#9a9ca2`, line-height ~1.55 |
| Small label | Inter, 12–13px, `#8b8d93`, normal case, no letter-spacing |
| Code / ID only | Fragment Mono, original case, `tracking-mono: 0` |

`.mono-label` and `.display` keep their names but now render in Inter with
normal case. Sentence case everywhere in UI copy.

## Layout

- `.blueprint` / `.app-surface` = the flat `--bg` canvas.
- `.frame` = a centered `max-w-[1280px]` column, no side borders; full-bleed on
  phones.
- `.pad` is the shared horizontal gutter: `20px → 32px → 40px`.
- Sections are separated by `--inner-border` rules or by space, never by
  painted grids or framed cells.
- Card padding 24–32px (`p-6 sm:p-8` on `Card`); gaps between cards 16–24px.
- Nested rows: `--inner-bg` fill, `--inner-border` border, `rounded-inner`.
- Concentric radius rule: outer radius = inner radius + inset padding.

## Components

Reuse before building. Never hand-roll a variant that already exists.

- `components/ui/button.tsx` — `Button` / `buttonClasses`, variants
  `primary | secondary | ghost | danger | outline`, sizes `sm | md | lg`.
  `primary` = `.btn-hatch` (violet gradient, 12px radius, 44px hit area),
  `secondary` = `.btn-wire` (transparent, soft border), the rest are quiet text
  actions. 180ms transitions, subtle press feedback.
- `components/ui/primitives.tsx` — `Card`, `SectionTitle`, `Badge`, `Alert`,
  `Spinner`, `EmptyState`. `Card` owns the 24px surface; `Badge` is a pill.
- `components/ui/field.tsx` — `Label`, `Input`, `Textarea`, `FieldError`. Inputs
  are slightly inset (`--inner-bg`), 14px radius, 15px text.
- `components/ui/page-header.tsx` — `PageHeader` with small label, statement,
  lead and right-aligned actions.
- `globals.css` utilities: `.surface`, `.surface-muted`, `.panel`, `.tag`,
  `.tag-accent`, `.tag-warn`, `.btn-hatch`, `.btn-wire`, `.index-row`,
  `.menu-panel`, `.menu-item`, `.ledger-head`, `.ledger-row`, `.list-fade`,
  `.carousel-fade`, `.focus-ring`, `.gradient-text`.
- `components/marketing/*`, `components/dashboard/*`, `components/ai/*`,
  `components/admin/*` and `components/brand/*` all consume those primitives.

### Billing

Four plans are 24px cards with `--card-border`. The current/recommended plan
gets a soft violet ring (`rgba(139,92,246,0.4)`) or a gentle glow — never a
hard green/violet bar. "Nejčastější volba" is a small pill inside or above the
card, not a framed label on its edge.

### Navigation and history

Top bars are borderless, muted text only; server/navigation actions are pills
with a soft border. Credit history is a plain list: grey sentence-case headers,
`--inner-border` row separators, no inner grids.

## Motion

- 150–200ms colour/filter feedback on interactive elements. No ambient loops
  except the existing diagram twinkle, role-drag demo and skeleton shimmer.
- Only `transform` and `opacity` animate for movement; never `transition: all`.
- `prefers-reduced-motion: reduce` must cover every animation and transition
  (freeze or hide, never remove meaning). Overlay scrolls use
  `overscroll-behavior: contain`.

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
- `--text-subtle` is the dimmest text colour; do not dim it further.
- Every icon-only control needs a localized accessible name; decorative SVG gets
  `aria-hidden="true"`.
- Respect reduced motion and zoom; never hide content behind hover-only affordances.
- Do not add a light-mode toggle. The canvas is fixed and dark.

## Guardrails

- Do not add a new colour, shadow or radius outside the token table. Add it to
  `tailwind.config.ts` and `globals.css` first.
- No `border-radius: 0`, no painted 1px frames with visible colour, no patterns,
  no dashed borders, no uppercase mono labels, no large violet fills.
- Violet is a scarce accent: primary button, active state, tiny icons.
- Pre-existing `npm test` and `npm run typecheck` must stay green.

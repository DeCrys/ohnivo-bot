# Ohnivo — Design System

Reference for every UI change in this repo. Read it before designing or editing
any screen, and keep new work inside these tokens instead of inventing new ones.

- **Brand:** Ohnivo ("fire" in Czech). Mascot: Jiskřík. Domain: `ohnivo.app`.
- **Stack:** Next.js App Router + React + Tailwind CSS v3 (`apps/web/tailwind.config.ts`),
  TypeScript, `next-intl` for i18n (Czech default, English secondary).
- **Product:** Discord bot + web dashboard for generating and applying Discord
  server blueprints ("AI tools hub", blueprint editor, apply progress).

## Tokens (source of truth: `apps/web/tailwind.config.ts`)

### Surfaces — "ink" (dark only, `color-scheme: dark`)

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

### Accent — "ember" (cyan, secondary highlight)

`400 #54C7FF` · `500 #22A8F0`

### Effects

- `shadow-glow` — `0 0 60px -12px rgba(116,80,245,0.55)` (primary buttons, hero)
- `shadow-card` — `0 20px 60px -30px rgba(0,0,0,0.9)` (cards, `.surface`)
- `bg-spark-radial` — violet/cyan radial wash for hero and marketing bands
- Page background glow (from `globals.css`): violet radial at top center
  (`rgba(116,80,245,0.18)`) + cyan radial top right (`rgba(34,168,240,0.08)`)
- `.grid-bg` — 44px violet grid, radially masked; decorative only

## Typography

- Font stack: `Inter, Segoe UI, system-ui, -apple-system, Roboto, Helvetica Neue, Arial, sans-serif`
- Body copy: `text-spark-50` on `bg-ink-950`; muted copy uses `text-spark-100/70` or `text-spark-200/60`.
- Display headings use `.gradient-text` (`spark-200 → spark-300 → ember-400`) sparingly — hero and section titles only.
- Scale is Tailwind defaults. Buttons: `sm` `h-8 text-xs`, `md` `h-10 text-sm`, `lg` `h-12 text-base`.

## Components

Reuse before building. Never hand-roll a variant that already exists.

- `apps/web/components/ui/button.tsx` — `Button` / `buttonClasses`, variants
  `primary | secondary | ghost | danger | outline`, sizes `sm | md | lg`.
  Primary = `bg-spark-500` + `shadow-glow`; all buttons are `rounded-xl`, `focus-ring`,
  `transition-colors`, disabled at `opacity-50`.
- `apps/web/components/ui/primitives.tsx` — shared primitives (cards, badges, inputs).
- `apps/web/components/ui/field.tsx` — form field wrapper with label + error.
- Surfaces: `.surface` (`rounded-2xl`, `border-line/70`, `bg-ink-850/80`, `shadow-card`, blur)
  and `.surface-muted` (`rounded-xl`, `border-line/60`, `bg-ink-900/70`).
- `.focus-ring` — `ring-2 ring-spark-400 ring-offset-2 ring-offset-ink-950`. Every
  interactive element must be keyboard reachable and show it.

## Motion

- Transitions: `transition-colors` for hover/active, ~150–200ms.
- Ambient loops: `animate-float` (6s) and `animate-pulse-soft` (2.4s) from Tailwind config.
- Longer storytelling loops use a dedicated keyframe with an explicit duration and
  easing, e.g. the role-hierarchy demo (`.role-drag-clone`, 4.8s,
  `cubic-bezier(0.4, 0, 0.2, 1)`) in `globals.css`.
- Motion must explain state or hierarchy. One authored moment per surface, not
  repeated section reveals.
- `prefers-reduced-motion: reduce` is mandatory: every animation/loop needs a
  reduced-motion branch (hide or freeze, never remove meaning).

## Internationalization (hard rules)

- All user-facing copy lives in `apps/web/messages/cs.json` and `apps/web/messages/en.json`.
  No hard-coded strings in components; no Czech copy leaking into the English UI.
- Czech is the default locale; English must read as English, not as a translation stub.
- **Server data is not UI copy.** Discord role/channel names are user data
  (`👑Majitel`, `Owner`, …). Render them as separate labelled badges/chips, never
  embedded inside an English sentence.
- Bot-side errors arrive in the guild locale; the web re-renders them in the
  viewer's locale via `apps/web/lib/apply-errors.ts` plus the `ai.apply.failure`
  message block. Extend that parser when new known error shapes appear.

## Accessibility

- WCAG 2.2 AA target: visible focus rings, 4.5:1 text contrast, 44px hit areas
  for primary actions, real `<button>`/`<a>` semantics, labelled form errors.
- Dark theme only — do not introduce a light theme without a full token pass.
- Respect reduced motion and zoom; never hide content behind hover-only affordances.

## Guardrails

- Do not add a new color, shadow, or radius outside the token table. If a new
  value is genuinely needed, add it to `tailwind.config.ts` first.
- Keep the `.surface` / `.surface-muted` / `Button` vocabulary; one button style per intent.
- Marketing surfaces (`components/marketing`) may be more expressive than the dashboard.
  Dashboard and admin screens stay quiet, dense and legible.
- Pre-existing `npm test` and `npm run typecheck` must stay green.

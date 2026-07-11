# English Test Practice — Design System

## Philosophy

**Academic calm, product clarity.** Inspired by refined research UIs (e.g. Papers with Code): warm paper surfaces, serif display type, row-based lists, hairline borders, and zero ornamental noise.

**Row-based by default.** Prefer horizontal lists over card grids. Density is intentional, not sparse marketing layout.

**Dark mode is OLED pure black** (`#000000`) — not slate-tinted gray. Surfaces step up via zinc (`#0a0a0a` → `#141414`). No neon gradients.

## Color

### Light (warm paper)

| Token                      | Hex       | Usage               |
| -------------------------- | --------- | ------------------- |
| `--color-ink`              | `#171717` | Primary text        |
| `--color-ink-secondary`    | `#525252` | Body / descriptions |
| `--color-ink-tertiary`     | `#8a8a8a` | Meta, labels        |
| `--color-surface`          | `#ffffff` | Cards, tables       |
| `--color-surface-elevated` | `#f7f6f3` | Page background     |
| `--color-surface-subtle`   | `#f0efeb` | Badges, chips       |
| `--color-border`           | `#ebe9e4` | Hairline dividers   |
| `--color-accent`           | `#2563eb` | Links, emphasis     |
| `--color-accent-subtle`    | `#eff4ff` | Soft accent fill    |

### Dark (OLED)

| Token                      | Hex       | Usage                        |
| -------------------------- | --------- | ---------------------------- |
| `--color-surface-elevated` | `#000000` | Page background (pure black) |
| `--color-surface`          | `#0a0a0a` | Cards, tables                |
| `--color-surface-subtle`   | `#141414` | Elevated chips               |
| `--color-border`           | `#1f1f1f` | Hairline dividers            |
| `--color-ink`              | `#f5f5f5` | Primary text                 |
| `--color-ink-secondary`    | `#a3a3a3` | Secondary text               |
| `--color-accent`           | `#60a5fa` | Links (brighter on black)    |

Shadows in dark mode are hairline rings (`0 0 0 1px rgba(255,255,255,0.05)`), not drop shadows.

### Section tints (soft chips only)

- Reading: cyan · Writing: emerald · Speaking: amber · Listening: violet · TOEIC: pink

## Typography

| Token          | Value          | Usage                                      |
| -------------- | -------------- | ------------------------------------------ |
| `--font-serif` | Source Serif 4 | Display titles (h1, hero, section headers) |
| `--font-sans`  | Inter          | UI, body, nav                              |
| `--font-mono`  | JetBrains Mono | Metrics, codes, question numbers           |

Hero pattern: roman serif + _italic serif accent_ (Papers with Code cue).

## Layout

- **Header**: sticky, 52px, translucent nav, hairline bottom border. Active nav = underline (not filled pill).
- **Main**: max-width ~880px, generous vertical padding.
- **Lists**: shared `ProblemTable` rows — status | title+meta | badge.

## Components

### Buttons

Pill radius (`--radius-full`) for primary/secondary/accent. Ghost keeps soft square radius.

| Variant       | Style                             |
| ------------- | --------------------------------- |
| **Primary**   | Ink fill, inverse text            |
| **Secondary** | White/surface fill, strong border |
| **Accent**    | Accent fill                       |
| **Ghost**     | Transparent                       |
| **Danger**    | Error fill                        |

Sizes: `sm` 30px · `md` 36px · `lg` 42px.

### Tables / rows

- White (or `#0a0a0a`) surface, hairline borders
- Hover: subtle surface tint
- Completed: accent-subtle wash

## Motion

- Fast 150ms · Base 200ms · Slow 280ms
- Easing: `cubic-bezier(0.16, 1, 0.3, 1)`
- Prefer `opacity` / `background` / `color`. Respect `prefers-reduced-motion`.

## Question / document surfaces

Problem UIs use a **U.S. official-document register** that sits inside the same site chrome (warm paper / pure black OLED):

| Cue                 | Implementation                                                               |
| ------------------- | ---------------------------------------------------------------------------- |
| Letterhead top rule | `border-top: var(--doc-rule)` (2px ink) on passage / question / result cards |
| Sharper corners     | `--radius-doc: 3px` (site chrome stays softer)                               |
| Passage body        | `--font-serif` + `--lh-doc` (~1.8)                                           |
| Item numbers        | Boxed mono numerals, ink outline — not filled accent circles                 |
| Choices             | Left bar selection (`border-left: 3px`), mono A/B labels                     |
| Tags / modules      | Outlined uppercase chips, not filled pills                                   |
| Feedback            | “Marked correct / incorrect”, formal left rule panel                         |
| Timer / scores      | Mono tabular + serif display score                                           |

Shared utilities live in `src/styles/question-document.css` (`.doc-surface`, `.doc-option`, …).

## Anti-patterns

- Filled neon nav pills
- Heavy multi-layer shadows on pure black
- “AI-powered” marketing badges
- Emoji as structural icons
- Card bento grids for primary navigation (keep rows)
- Playful rounded option chips on exam pages (prefer form rows)

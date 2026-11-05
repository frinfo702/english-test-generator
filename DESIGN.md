# Design: Pond

A quiet, plain page with things floating on it. The page is near-white
(near-black in dark mode); whatever you act in sits on it as a frosted panel,
whatever you read sits on it as a solid sheet. Only the home hero is ruled
with a faint 7px grid, under the swimming fish. One
question per screen, asked in large light type. Decoration is text-art, never
illustration, and it lives on the home page only.

## Principles

1. **One question, one box.** A page leads with what it wants from you (home:
   "what do you want to practise?") and one place to answer it. Explanations
   go below the fold, in three steps or fewer.
2. **The canvas is plain.** A grid everywhere flickers; it belongs to the home
   hero only (`--canvas-grid`). Task and index pages sit on flat surface.
3. **Frosted for acting, solid for reading.** Menus, command boxes, lists you
   pick from and the scrolled nav use `.glass`. Passages, questions and answer sheets
   (`.doc-surface`) stay opaque so text never competes with the grid.
4. **Light display type.** Titles are Space Grotesk 300, tight tracking.
   Hierarchy comes from size and space, not weight.
5. **Mono whispers.** Hints, key legends (`↑↓ choose · ↵ open`), counts and
   eyebrows use the mono voice at 10–12px in tertiary ink.
6. **Monochrome UI.** Ink, grey and the grid. Section colours (reading, writing,
   listening, speaking, TOEIC) mark category only; coral is for live/record
   states and the announcement tag.
7. **Motion is ambient or absent.** The home fish drift; nothing else moves on
   its own. Everything respects `prefers-reduced-motion`.

## Tokens (`src/styles/variables.css`)

| Token | Value | Use |
|---|---|---|
| `--grid-size` | 7px | Canvas grid pitch; the home fish use the same cell |
| `--grid-line` | ink at 5% | Grid lines (adapts to theme) |
| `--canvas-grid` | two 1px gradients | Home hero grid only |
| `--glass-bg` | surface at 72% | Frosted panel fill |
| `--glass-blur` | `blur(10px)` | Frosted panel backdrop |
| `--radius-panel` | 14px | Frosted panels, command boxes, lists |
| `--font-light` | 300 | Display titles (`h1`, page titles, home prompt) |

Colour, spacing, type scale and radii otherwise unchanged; see the file.

## Shared classes (`src/styles/global.css`)

- `.glass` — frosted panel: `--glass-bg`, `--glass-blur`, 1px border,
  `--radius-panel`. Add a shadow (`--shadow-md`) only for the one focal box.
- `.micro-label` — mono uppercase eyebrow/caption.
- `.page-narrow` — opt-in reading width (`--max-reading`) with auto margins.
- `.notice-error` — the one page-level error banner.
- `.doc-*` (`question-document.css`) — the exam-sheet register for question
  pages; solid, ink rule on top.

## Components

- **Home prompt** (`HomePage`) — light lowercase question, a `.glass` combobox
  that searches every test/section/drill, starter chips when empty, mono key
  legend underneath. A soft radial halo with backdrop blur sits behind it.
- **ASCII pond** (`components/home/AsciiPond`) — fish drawn as glyphs in grid
  cells on a canvas, swimming along their own path. Home only: on task pages it
  would be noise.
- **Page header** (`SectionHeader`) — round back button, light display title,
  one line of context.
- **Pick lists** (`TaskMenu`, `ProblemTable`) — ruled rows inside one frosted
  panel; hover tints the row, never lifts it.
- **Chips** — pill, 1px border, 13px, ink border on hover.
- **Buttons** (`Button`) — ink pill is the single primary action per screen;
  outline pill for secondary; accent (coral) only for live recording.
- **Header** (`AppShell`) — clear at the top of the page, frosted with a
  hairline once scrolled past 8px. Each nav link has a ⌥+letter shortcut
  (⌥L/⌥R/⌥D/⌥S); it stays hidden and appears after a 1s hover in a small card
  with a few-word hint ("Redo what you missed  ⌥R").
- **Footer** (`SiteFooter`) — frosted strip with a top rule, not a dark band.

## Don't

- Don't put the fish (or any animation) behind reading or answering.
- Don't use heavy shadows, gradients as surfaces, or dark full-width bands.
- Don't bold display titles; don't set body copy in mono.
- Don't add a second competing CTA next to the page's one question.

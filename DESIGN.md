# Design: Pond

A quiet, plain page with things floating on it. The page is near-white
(near-black in dark mode); whatever you act in sits on it as a frosted panel,
whatever you read sits on it as a solid sheet. The home hero and the 404 are
ruled with a faint 7px grid, under the swimming fish. One
question per screen, asked in large light type. Decoration is text-art, never
illustration, and it lives on those two pages only.

## Principles

1. **One question, one box.** A page leads with what it wants from you (home:
   "what do you want to practise?") and one place to answer it. Explanations
   go below the fold, in three steps or fewer.
2. **The canvas is plain.** A grid everywhere flickers; it belongs to the two
   pond pages — the home hero and the 404 — via `.canvas-grid`. Task and index
   pages sit on flat surface.
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
7. **Motion is ambient or absent.** The pond fish drift; nothing else moves on
   its own, and a thing that moves because you moved it is feedback, not
   decoration. Everything respects `prefers-reduced-motion` (the pond then
   draws one still frame).

## Tokens (`src/styles/variables.css`)

| Token                  | Value             | Use                                                        |
| ---------------------- | ----------------- | ---------------------------------------------------------- |
| `--grid-size`          | 7px               | Canvas grid pitch; the home fish use the same cell         |
| `--grid-line`          | ink at 5%         | Grid lines (adapts to theme)                               |
| `--canvas-grid`        | two 1px gradients | Grid of the two pond pages (`.canvas-grid`)                |
| `--glass-bg`           | surface at 72%    | Frosted panel fill                                         |
| `--glass-blur`         | `blur(10px)`      | Frosted panel backdrop                                     |
| `--radius-panel`       | 14px              | Frosted panels, command boxes, lists                       |
| `--control-radius`     | unset → pill      | Button/input corner; a dense page sets it to `--radius-sm` |
| `--font-light`         | 300               | Display titles (`h1`, page titles, home prompt)            |
| `--control-h-sm/md/lg` | 34 / 42 / 52px    | Height of Button sizes and of every control beside them    |

Colour, spacing, type scale and radii otherwise unchanged; see the file.

## Shared classes (`src/styles/global.css`)

- `.glass` — frosted panel: `--glass-bg`, `--glass-blur`, 1px border,
  `--radius-panel`. Add a shadow (`--shadow-md`) only for the one focal box.
- `.micro-label` — mono uppercase eyebrow/caption.
- `.canvas-grid` — the graph-paper background, for the two pond pages only.
- `.page-narrow` — opt-in reading width (`--max-reading`) with auto margins.
- `.notice-error` — the one page-level error banner.
- `.doc-*` (`question-document.css`) — the exam-sheet register for question
  pages; solid, a plain 1px border (no ink rule on top), `--radius-panel`
  corners like every other panel. Inside a sheet, option rows, chips, slots and text fields are
  rounded rects (`--radius-sm`); only tiny marks (item numbers, tags) keep
  `--radius-xs`. Selected, dragged-over and "on" states are ink, not coral.
  Item numbers are outlined mono marks, not ink-filled tiles. A graded
  answer's verdict (`FeedbackPanel`) sits under a hairline on the same sheet:
  a coloured dot and status word, then the answer and explanation in ink — no
  tinted box.

## Components

- **Home prompt** (`HomePage`) — light lowercase question, a `.glass` combobox
  that searches every test/section/drill, starter chips when empty, mono key
  legend underneath. A soft radial halo with backdrop blur sits behind it.
- **ASCII pond** (`components/home/AsciiPond`) — fish drawn as glyphs in grid
  cells on a canvas, swimming along their own path. Home and the 404 only: on
  task pages it would be noise. It takes an optional `obstacle` — a capsule it
  reads once a frame — and the fish steer around it and pass behind it, never
  through it.
- **Not found** (`NotFoundPage`) — the landing page for a URL that isn't there.
  Full-bleed grid and pond, and nothing on it but the word: the `404` alone, in
  light display type at ~21vw, with the fish steering around it. No eyebrow, no
  sentence, no button — and no shell either: the header, the announcement strip
  and the footer are gone, so the water is the whole window. The way out is the
  browser's back button or ⌥L, and a screen reader gets one `sr-only` line
  saying so. It drifts aside from the pointer, drags with a finger or a mouse,
  tilts as it moves, rings the water when picked up, and springs back to its
  place. It never leaves the water: dragging is clamped to the window.
- **Page header** (`SectionHeader`) — round back button, light display title,
  one line of context.
- **Pick lists** (`TaskMenu`, `ProblemTable`) — ruled rows inside one frosted
  panel; hover tints the row, never lifts it.
- **Chips** — pill, 1px border, 13px, ink border on hover.
- **Buttons** (`Button`) — ink is the single primary action per screen;
  outline for secondary; accent (coral) only for live recording.
- **Control shape follows density.** Where controls are few (header, a page's
  one CTA, chips), they are pills. Where many sit together (Settings, forms),
  buttons, inputs, segmented switches and option cards are rounded rects:
  the page root sets `--control-radius: var(--radius-sm)` and everything
  inside inherits it. Never mix both shapes in one panel.
- **Controls on one line share edges.** An input, select, trigger or icon
  button that sits next to a `Button` takes the same `--control-h-*` height as
  that Button's size, never a hand-typed px. Centring a 30px input against a
  34px button still leaves the top and bottom edges 2px apart, and that is
  what the eye catches. A deliberately larger primary (the audio Play button)
  is fine; two near-equal heights are not.
- **Settings** (`SettingsPage`) — each setting is a `.glass` panel with a
  plain-sans label on top; options to pick (models) are small cards side by
  side, the chosen one ringed in ink.
- **Dashboard** (`DashboardPage`) — leads with `EstimateCard`: the estimated
  total band in large light type with "/ goal 4.5" and a gap chip, then one
  1–6 track per section (ink fill = estimate, upright tick = goal, green once
  met). Goals (total and section minimums, each optional) are set in the
  card itself and kept in localStorage (`lib/scoreGoal`). Bands that can't
  add up under the ETS rule (section mean, nearest half) are greyed out, and
  with all four sections set the total fills itself in and locks.
  Below it, the summary numbers, streak calendar, practice-test cards and
  task table each sit in their own `.glass` panel with light display numbers.
- **Header** (`AppShell`) — clear at the top of the page, frosted with a
  hairline once scrolled past 8px. Each nav link has a ⌥+letter shortcut
  (⌥L/⌥R/⌥D/⌥S); it stays hidden and appears after a 1s hover in a small card
  with a few-word hint ("Redo what you missed ⌥R").
- **Full-bleed page** (`useFullBleedPage`) — a page that owns its whole canvas
  (home, the 404) opts out of the shell's padded column from its top level, so
  the grid reaches the window edges. Anything meant to be read stays inside
  `--max-content` regardless.
- **Bare page** (`useBarePage`) — full bleed with nothing of the shell left
  around the page: no header, no announcement strip, no footer. For a page that
  is one thing and nothing else (the 404). Reach for it rarely; a page with any
  way forward of its own needs the header.
- **Announcement strip** (`AppShell`) — subtle surface with a hairline
  under it and ink text; only the "New" tag is coral. Never a black band.
- **Footer** (`SiteFooter`) — frosted strip with a top rule, not a dark band.
- **Results** (`ResultSummary`) — every graded task shows one `.glass`
  panel: mono "Score" eyebrow, the count in light display type with a mono
  percentage, and the actions (retake/back, next question) on the right.
  Speaking results and the practice-test report use the page header plus the
  same kind of panel; score pips are ink blocks, never a colour ramp.
- **Toasts** (`ui/Toaster`, sonner) — one stack bottom-right, mounted in
  AppShell; each toast is a small frosted panel with an optional outline
  action (View, Retry, Undo, Open). For things that happen in passing or out
  of sight (background scoring, a copy, an import, a save that failed after
  the score is on screen) — never for a page's own load error.
- **Selects** — one global `select` rule (`global.css`): `--control-h-sm`
  tall, `--control-radius` shape, own chevron. Pages don't restyle it.
- **Updates chip** (`UpdateNotice`) — a mono "updates" pill under the home
  page that opens the latest-post bubble. No mascots anywhere else.

## Don't

- Don't put the fish (or any animation) behind reading or answering.
- Don't use heavy shadows, gradients as surfaces, or dark full-width bands.
- Don't bold display titles; don't set body copy in mono.
- Don't add a second competing CTA next to the page's one question.

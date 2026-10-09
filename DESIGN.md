# English Test Practice — Design System

## Philosophy

**Field notes.** The app is a study instrument set like a well-made journal:
paper, ink, ruled lines, and one signal colour. The pixel mascots are the only
illustration and get a stage of their own; everything else is typography.

Three ideas hold the system together:

1. **Type carries hierarchy.** Big, quiet display type (Geist 500, tight
   tracking) does the work that boxes, fills and shadows used to do.
2. **Rules, not cards.** Lists and sections open with a 1px ink rule and are
   divided by hairlines. Boxes are reserved for one focused sheet at a time
   (a question, a passage, a recorder).
3. **One signal.** The poodle's collar orange (`#fa500f`) — the same orange
   the pixel art is drawn in — marks progress, focus, the active nav item and
   the live take. Green/red are reserved for grading. Indigo + lime belong to
   the pixel stages only.

## Colour

### Light (paper)

| Token                      | Hex       | Usage                                  |
| -------------------------- | --------- | -------------------------------------- |
| `--color-ink`              | `#131312` | Text, primary button, opening rules    |
| `--color-ink-secondary`    | `#4d4c47` | Body, descriptions                     |
| `--color-ink-tertiary`     | `#6f6d66` | Meta, captions (AA on paper)           |
| `--color-surface-elevated` | `#f4f3ef` | Page background                        |
| `--color-surface`          | `#fbfaf7` | Sheets (question cards, passages)      |
| `--color-surface-subtle`   | `#ecebe5` | Wells, empty calendar cells            |
| `--color-border`           | `#dcdad3` | Hairlines                              |
| `--color-border-strong`    | `#bdbab1` | Control outlines                       |
| `--color-signal`           | `#fa500f` | Non-text marks: bars, dots, fills      |
| `--color-accent`           | `#c23a06` | Signal as text / button fill (AA)      |
| `--color-success`          | `#2c6a4c` | Correct                                |
| `--color-error`            | `#b02f1c` | Incorrect                              |

### Dark (carbon)

`--color-surface-elevated` `#0f0f0e` → `--color-surface` `#161615` →
`--color-surface-subtle` `#1f1f1d`. Signal and accent both lift to `#ff6a2b`.
Same structure, no glows.

### Pixel stage

`--stage-bg` (`#2f2e73`, dark `#24235a`), `--stage-lime` `#eef59a`,
`--stage-ink`. Used only behind the mascots: the home hero plate and the
update page's call to action. Never on tool surfaces.

### Section hues

Reading / Writing / Listening / Speaking / TOEIC keep distinct muted hues,
used only as 8px square marks and chart series — never as tints on surfaces.

## Typography

| Token            | Family     | Usage                                              |
| ---------------- | ---------- | -------------------------------------------------- |
| `--font-display` | Geist      | Titles, task names, big numerals (weight 500)      |
| `--font-sans`    | Geist      | Body, passages, controls                           |
| `--font-mono`    | Geist Mono | Metadata: eyebrows, indexes, counts, timers, tags  |
| `--font-pixel`   | Silkscreen | The mascots' speech only                           |

Scale: `2xs 11 · xs 12 · sm 13 · base 15 · lg 17 · xl 20 · 2xl 24 · 3xl 32 ·
4xl 44 · 5xl 60 · 6xl 76`. Display sizes use `--tracking-tighter` (-0.035em)
or `--tracking-display` (-0.045em).

**The mono voice labels content; it never is content.** Eyebrows, column
headers, question numbers, option letters, counts, timers and tags are mono,
uppercase, `--tracking-meta` (0.04em), 11px. Sentences are never mono. The
shared `.micro-label` class is this voice.

Numbers that count (timers, scores' denominators, percentages, dates) use
mono with `tabular-nums`; headline numerals use the display face.

## Layout

- Header 60px, translucent paper, hairline bottom rule. Nav is plain text
  links; the active one stands on a 2px signal bar on the header rule.
- `--max-content` 1120px; `--gutter` 32px (16px on phones);
  `--max-reading` 720px for a single focused sheet.
- **Index pattern** (home, TOEFL/TOEIC menus, question lists): mono label →
  ink rule → ruled rows of `index | title + meta | count | →`. Grouped menus
  hang the group name in a sticky left column.
- **Page head**: round back button, 32px display title, one line of context.

## Components

### Buttons

Radius `--radius` (4px). **Primary is ink** — the one loud control on a page.

| Variant       | Style                                         |
| ------------- | --------------------------------------------- |
| **Primary**   | Ink fill, inverse text                        |
| **Secondary** | Transparent, strong hairline; ink on hover    |
| **Accent**    | Signal — live actions only (e.g. recording)   |
| **Ghost**     | Transparent                                   |
| **Danger**    | Error fill                                    |

Sizes: `sm` 30px · `md` 38px · `lg` 46px. Every button scales to 0.98 on press.

### Question sheets

`src/styles/question-document.css` and the task modules share one register:
a sheet opens with a 1px ink top rule and square corners; item numbers are
solid ink chips in mono; option letters are mono, tertiary; options are ruled
rows whose selected / correct / wrong state adds a 3px inset bar on the left
(ink / green / red). Large writing boxes frame in ink on focus instead of
showing a ring.

### Audio (ported from ElevenLabs UI, MIT)

| Component       | Role                                                          |
| --------------- | ------------------------------------------------------------- |
| `AudioPlayer`   | Decoded waveform scrubber + ink transport + mono speed chips  |
| `LiveWaveform`  | Canvas waveform; `processing` mode animates without a mic     |
| `MicWaveform`   | Level bars fed by the already-open recorder stream            |
| `VoiceButton`   | Idle → recording → processing → success/error with waveform   |
| `MicSelector`   | Device listbox with the live device marked                    |
| `ScrubBar`      | Fallback transport while a waveform decodes                   |
| `Matrix`        | Dot-matrix display used for loading/empty states              |

Rule: **never open a second microphone stream while recording.** Live levels
come from `useSpeechRecognition().levels`; `LiveWaveform active` is only used
for pre-recording device previews (mic selector).

### Charts and the streak calendar

Recharts, styled from tokens (hairline grid, tertiary ticks, token-coloured
series, hairline tooltip). The chart bundle is loaded lazily and only the
dashboard pulls it. The plot is `aria-hidden`; the same numbers are also
rendered as a visually hidden list, so no data depends on hovering. The
streak calendar is square pixel cells stepped in the signal orange.

### Pixel art

Poodle, hamsters, pixel icons, the pixel clock and score pips are kept as
drawn. They may be restaged (scaled uniformly, framed on a stage; the home
hero's stage enlarges the scene 1.4× on wide screens) but never redrawn or
recoloured.

## Motion

- `--duration-fast` 120ms (press, hover) · `--duration-base` 180ms (state) ·
  `--duration-slow` 260ms (nav bar, panels).
- Easing: `--ease-out` `cubic-bezier(0.23, 1, 0.32, 1)` for enter/UI,
  `--ease-in-out` `cubic-bezier(0.77, 0, 0.175, 1)` for on-screen movement.
- Animate `transform` / `opacity` only. Respect `prefers-reduced-motion`.
- Row arrows nudge 3–4px and turn signal on hover; nothing else moves.
- Keyboard-repeated actions (nav, ⌘D) never animate.

## Anti-patterns

- Rounded cards with drop shadows as the default container
- Tinted fills to group content — use a rule and whitespace
- Section hues as surface tints; gradients; glows
- Semibold/bold display type — display is 500, size does the work
- Mono for sentences; sans for metadata labels
- Emoji as status icons (use SVG, pixel icons or plain words)
- Per-page option/score styling that drifts from the shared sheet register
- Decorative animation, staggered entrances, or motion on frequent actions

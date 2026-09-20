# English Test Practice — Design System

## Philosophy

**Quiet instrument.** The app is a practice tool, not a marketing site: warm
paper, ink-first hierarchy, and rows instead of cards. Nothing on screen should
exist to decorate — if a rule, tint, or icon does not carry state it is removed.

Two ideas hold the system together:

1. **Structure is achromatic.** Warm neutrals carry every surface, border and
   label. Hierarchy comes from type, spacing and hairlines — not colour.
2. **Colour means something.** One ochre signal marks progress, focus and the
   live take; green/red mark grading. Nothing else competes.

## Colour

### Light (warm paper)

| Token                      | Hex                    | Usage                        |
| -------------------------- | ---------------------- | ---------------------------- |
| `--color-ink`              | `#1c1917`              | Primary text, primary button |
| `--color-ink-secondary`    | `#57534e`              | Body, descriptions           |
| `--color-ink-tertiary`     | `#8d857c`              | Meta, labels                 |
| `--color-surface`          | `#fffdfa`              | Cards, rows                  |
| `--color-surface-elevated` | `#faf8f4`              | Page background              |
| `--color-surface-subtle`   | `#f3f0ea`              | Chips, wells, table headers  |
| `--color-border`           | `#e8e3da`              | Hairlines                    |
| `--color-border-strong`    | `#d6cfc4`              | Emphasised borders           |
| `--color-accent`           | `#a15c07`              | Signal: progress, focus, live |
| `--color-success`          | `#2f6b4f`              | Correct                      |
| `--color-error`            | `#a8321f`              | Incorrect                    |

### Dark (soft black, layered)

`--color-surface-elevated` `#121110` → `--color-surface` `#1a1817` →
`--color-surface-subtle` `#232120`. Accent lifts to `#e0a044`; shadows stay
hairline-plus-soft, never glow.

### Section hues

Reading / Writing / Listening / Speaking / TOEIC keep distinct but **muted**
hues, used only as 6px dots, small marks and dashboard series — never as tints
on large surfaces.

## Typography

| Token            | Family           | Usage                                 |
| ---------------- | ---------------- | ------------------------------------- |
| `--font-display` | Inter Tight      | Titles, task names, display numerals  |
| `--font-sans`    | Inter            | Everything else — passages included   |
| `--font-mono`    | system monospace | `<code>`, `<kbd>` — never UI text     |

One sans does the whole job: passages, transcripts, labels and numbers are all
Inter, with Inter Tight only where a tighter optical fit helps (titles, big
scores). Numbers always get `font-variant-numeric: tabular-nums`.

**Never set UI text in a monospace face.** Mono labels, mono metrics and mono
timestamps read as developer decoration and are an anti-pattern here.

Captions use `.micro-label`: 12px sans, sentence case, tertiary ink.

## Layout

- Header 56px, translucent, hairline bottom rule; nav is one hairline strip with
  a sliding surface indicator (measured imperatively, never animated on first
  paint).
- `--max-content` 1040px for pages; `--max-reading` 680px for a single task card.
- Lists are the default navigation surface: index | title + meta | badge.
  Cards are reserved for one focused task at a time.

## Components

### Buttons

Radius `--radius` (8px). **Primary is ink**, not coloured — the ink button is the
only "loud" control on a page, and there is usually one.

| Variant       | Style                        |
| ------------- | ---------------------------- |
| **Primary**   | Ink fill, inverse text       |
| **Secondary** | Surface fill, strong border  |
| **Accent**    | Ochre — signal actions only (e.g. recording) |
| **Ghost**     | Transparent                  |
| **Danger**    | Error fill                   |

Sizes: `sm` 30px · `md` 36px · `lg` 42px. Every button scales to 0.975 on press.

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

Charts use **Recharts**, styled entirely from tokens (hairline grid, tertiary
ticks, token-coloured series). The chart bundle is loaded lazily and only the
dashboard pulls it — practice pages stay free of it.

Rule: **never open a second microphone stream while recording.** Live levels
come from `useSpeechRecognition().levels`; `LiveWaveform active` is only used
for pre-recording device previews (mic selector).

### Charts

Recharts, styled from tokens (hairline grid, tertiary ticks, token-coloured
series, hairline tooltip). The chart bundle is loaded lazily and only the
dashboard pulls it. The plot is `aria-hidden`; the same numbers are also
rendered as a visually hidden list, so no data depends on hovering.

### Documents (question surfaces)

`src/styles/question-document.css` holds the U.S.-official-document register
used by every question page: letterhead top rule, `--radius-doc: 3px`, long
passages at `--lh-doc`, boxed mono item numbers, form-row options
(`.doc-option`), outlined tags, formal score blocks (`.doc-score`).

## Motion

- `--duration-fast` 120ms (press, hover) · `--duration-base` 180ms (state) ·
  `--duration-slow` 260ms (indicator, panels).
- Easing: `--ease-out` `cubic-bezier(0.23, 1, 0.32, 1)` for enter/UI,
  `--ease-in-out` `cubic-bezier(0.77, 0, 0.175, 1)` for on-screen movement.
- Animate `transform` / `opacity` only. Respect `prefers-reduced-motion`.
- Keyboard-repeated actions (nav, ⌘D) never animate.

## Anti-patterns

- Filled blue accent pills for navigation or primary actions
- Rainbow section tints on surfaces, gradient chips, neon glows
- Emoji as status icons (use SVG or plain words)
- Monospace for anything that is not code — labels, metrics, timestamps
- Serif faces: the app is sans-only, one voice for UI and content
- Card grids for navigation — keep rows
- Per-page option/score styling; use the shared `doc-*` classes
- Decorative animation, staggered entrances, or motion on frequent actions

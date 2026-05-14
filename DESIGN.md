# English Test Practice — Frontend Redesign

## Philosophy

**YC-product aesthetic**: ruthlessly functional, high information density, typographic confidence, and zero ornamental noise. Every pixel must earn its place.

**Brand continuity**: keep the existing cobalt-blue trust anchor (`#0071bc` family) and the clean, academic credibility of the original. Do not chase dark-mode trends or neon gradients. This is a test-prep tool, not a social app.

## Design System

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-ink` | `#0f172a` | Primary text, headings, icons |
| `--color-ink-secondary` | `#475569` | Body text, descriptions |
| `--color-ink-tertiary` | `#94a3b8` | Disabled, placeholders, meta |
| `--color-surface` | `#ffffff` | Page background |
| `--color-surface-elevated` | `#f8fafc` | Cards, panels, hover rows |
| `--color-surface-subtle` | `#f1f5f9` | Subtle backgrounds, badges |
| `--color-border` | `#e2e8f0` | Dividers, input borders |
| `--color-border-strong` | `#cbd5e1` | Focus states, active borders |
| `--color-accent` | `#0f62fe` | Primary actions, links, active nav — shifted from `#0071bc` to a deeper, more authoritative cobalt |
| `--color-accent-hover` | `#054ada` | Hover / pressed accent |
| `--color-accent-subtle` | `#eff4ff` | Accent tint backgrounds |
| `--color-success` | `#059669` | Correct answers, positive stats |
| `--color-success-subtle` | `#ecfdf5` | Correct answer background |
| `--color-error` | `#dc2626` | Incorrect answers, destructive actions |
| `--color-error-subtle` | `#fef2f2` | Error background |
| `--color-warning` | `#d97706` | Timers, warnings |
| `--color-warning-subtle` | `#fffbeb` | Warning background |

**TOEFL / TOEIC section tints** (used sparingly as dot/line colors only):
- Reading: `#0ea5e9`
- Writing: `#10b981`
- Speaking: `#f59e0b`
- TOEIC: `#8b5cf6`

### Typography

| Token | Value | Usage |
|-------|-------|-------|
| `--font-sans` | `Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif` | All UI text |
| `--font-mono` | `"SF Mono", ui-monospace, "Cascadia Code", monospace` | Metrics, timestamps, code snippets |
| `--text-xs` | `12px / 1.5` | Badges, captions |
| `--text-sm` | `14px / 1.5` | Secondary text, nav, buttons |
| `--text-base` | `15px / 1.6` | Body copy (reduced from 16px for density) |
| `--text-lg` | `18px / 1.4` | Sub-headings, card titles |
| `--text-xl` | `22px / 1.3` | Page titles |
| `--text-2xl` | `32px / 1.2` | Hero display |
| `--font-normal` | `400` | Body |
| `--font-medium` | `500` | Labels, buttons |
| `--font-semibold` | `600` | Headings, emphasis |
| `--font-bold` | `700` | Display, hero |

### Spacing & Shape

| Token | Value |
|-------|-------|
| `--radius-sm` | `6px` |
| `--radius` | `8px` |
| `--radius-lg` | `12px` |
| `--radius-xl` | `16px` |
| `--shadow-sm` | `0 1px 2px rgba(15,23,42,0.04)` |
| `--shadow` | `0 1px 3px rgba(15,23,42,0.08), 0 1px 2px rgba(15,23,42,0.04)` |
| `--shadow-md` | `0 4px 12px rgba(15,23,42,0.08), 0 2px 4px rgba(15,23,42,0.04)` |
| `--shadow-lg` | `0 12px 24px rgba(15,23,42,0.08), 0 4px 8px rgba(15,23,42,0.04)` |
| `--max-content` | `840px` |

### Animation

- **Duration fast**: `150ms` — button hovers, color transitions
- **Duration base**: `200ms` — card lifts, border transitions
- **Easing**: `cubic-bezier(0.4, 0, 0.2, 1)` (ease-out) for entrances; `cubic-bezier(0.25, 0.1, 0.25, 1)` for layout shifts
- **Motion**: prefer `transform` and `opacity`. No blur/backdrop-filter (performance + simplicity).

## Layout Architecture

### App Shell

- **Header**: height `56px`, white background, 1px bottom-border (`--color-border`). Sticky top.
  - Logo left: wordmark "English Test Practice" in `--text-sm` `--font-semibold` `--color-ink`. No icon.
  - Nav center-right: "TOEFL 2026", "TOEIC" as pill-shaped links. Active state = filled accent pill (`--color-accent` bg, white text). Inactive = `--color-ink-secondary` text, no bg.
  - Rightmost: compact "Dashboard" icon-text link.
- **Main**: `padding: 32px 24px`, max-width `var(--max-content)`, centered.
- **No sidebar**: this is a single-column focused tool.

### Page Hierarchy

1. **Home**: Hero → Two product cards → Quick stats teaser → Footer note
2. **Menu (TOEFL / TOEIC)**: Section header → Grid of task cards
3. **Question Selector**: Header → Random CTA → Number grid/list → Score meta per item
4. **Question Page**: Clean task chrome → Content → Answer area → Feedback panel
5. **Dashboard**: Summary KPIs → Task chart cards → Recent attempts list

## Component Patterns

### Buttons

All buttons are sharp-edged rectangles (`--radius`). No fully-rounded pills except nav active state.

| Variant | Style |
|---------|-------|
| **Primary** | `--color-accent` bg, white text, no border. Hover: `--color-accent-hover`. Active: scale `0.98`. |
| **Secondary** | `--color-surface-elevated` bg, `--color-border` border, `--color-ink` text. Hover: `--color-border-strong` border, `--color-surface-subtle` bg. |
| **Ghost** | Transparent bg, `--color-accent` text. Hover: `--color-accent-subtle` bg. |
| **Danger** | `--color-error` bg, white text. |

Sizes: `sm` (h-32px), `md` (h-40px), `lg` (h-48px). All use `--font-medium`.

### Cards

- Background: `--color-surface-elevated`
- Border: `1px solid --color-border`
- Radius: `--radius-lg`
- Hover: `border-color: --color-border-strong`, `box-shadow: --shadow-md`, `translateY(-1px)`
- Transition: `200ms` all
- No decorative shadows at rest. Shadow appears only on hover to indicate interactivity.

### Inputs / Textareas

- Height: `40px` (input), min `120px` (textarea)
- Border: `1px solid --color-border`, radius `--radius`
- Focus: `border-color: --color-accent`, `box-shadow: 0 0 0 3px --color-accent-subtle`
- No inner shadows. Clean flat aesthetic.

### Badges / Tags

- Small rounded rectangles (`--radius-sm`) with subtle background tint.
- Font: `--text-xs` `--font-semibold`
- Example: "NEW FORMAT" = `--color-accent-subtle` bg, `--color-accent` text.

### Feedback States

- **Correct**: left-border `3px solid --color-success`, bg `--color-success-subtle`, text `--color-success`
- **Incorrect**: left-border `3px solid --color-error`, bg `--color-error-subtle`, text `--color-error`
- **Warning**: left-border `3px solid --color-warning`, bg `--color-warning-subtle`

## Page-Specific Design

### Home Page

**Hero**
- Title: `--text-2xl` `--font-bold` `--color-ink`. "Master the TOEFL iBT 2026 & TOEIC L&R."
- Subtitle: `--text-base` `--color-ink-secondary`. "AI-generated practice questions. No sign-up. No internet required after load."
- Two large cards below (TOEFL / TOEIC), equal width grid.
  - Each card: section-colored top border (`4px`), icon indicator (simple Unicode or CSS shape), title, 3-line feature list, primary CTA button.
  - Hover: lift + shadow.
- **Stats teaser bar** below cards (if history exists): 4 mini KPIs in a row: Total Sessions, Accuracy, Avg Time, Streak. This replaces the old plain "Dashboard" button with functional preview.
- **Note** at bottom: `--text-xs` `--color-ink-tertiary`, minimal, no box.

### Menu Pages

- **Section header**: back-link (arrow + "Back") left, title center-left, subtitle below.
- **TOEFL**: 3 sections (Reading / Writing / Speaking) as labeled groups.
  - Each group: small uppercase label (`--text-xs`, section color), then 3 cards in a row.
  - Cards: task name, one-line description, estimated item count / time.
- **TOEIC**: 3 larger cards (Part 5/6/7) with question count badge top-right.

### Question Selector

- Top bar: "Random Question" primary button left. "Sort / Filter" ghost button right (if implementing).
- Grid of question rows:
  - Each row: `Q001` mono label left, accuracy pill center, time right, chevron far-right.
  - Completed rows get a subtle left accent bar (`3px`) in the task color.
  - Hover: `--color-surface-subtle` bg.

### Dashboard

- **KPI row**: 4 cards, 1 row on desktop, 2x2 on mobile.
  - Big number (`--text-2xl`), small label above (`--text-xs` uppercase `--color-ink-tertiary`).
- **Task cards**: each contains:
  - Header: colored dot + task name + session count
  - Mini stats row: Latest / Best / Avg / Avg Time
  - Line chart (canvas, keep existing logic, restyle colors)
  - Recent attempts: compact list with progress bars
- **Empty state**: centered, illustration-free. Clean text + two CTA buttons.

## Responsive Strategy

- **Desktop** (> 768px): full layouts as described.
- **Tablet** (640–768px): cards go 2-col, charts keep full width.
- **Mobile** (< 640px): single column, stacked cards, reduced padding (`16px`), header collapses to hamburger or simple scrollable nav.

## Asset & Icon Guidelines

- **No icon library dependency**. Use Unicode symbols or minimal inline SVG for:
  - Arrow: `→` / `←`
  - Check: `✓`
  - Chevron: `›`
  - Clock: `◷` or simple SVG
- If icons are needed, prefer 16×16 inline SVG with `currentColor` stroke.

## Implementation Order

1. **Tokens**: rewrite `variables.css`, add Inter font via Google Fonts in `index.html`
2. **Global**: update `global.css` resets, add utility classes if needed
3. **Shell**: restyle `AppShell` — white header, pill nav, border-bottom
4. **Button**: sharper radius, refined colors
5. **Home**: hero + card redesign, add stats teaser
6. **Menus**: TOEFL / TOEIC card grids with section colors
7. **Selector**: row grid with completion accents
8. **Dashboard**: KPI summary strip + restyled task cards
9. **Question pages** (all task types): SectionHeader + content chrome consistency
10. **Polish**: spacing audit, mobile pass, animation consistency

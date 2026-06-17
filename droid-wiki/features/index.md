# Features Overview

The app provides three practice areas: TOEFL iBT 2026, TOEIC L&R, and standalone Shadowing practice. Each area contains multiple task types with a shared question loading system, score tracking, and audio playback infrastructure.

## Practice areas

### TOEFL iBT 2026

| Section   | Tasks                                                            | Task IDs            |
| --------- | ---------------------------------------------------------------- | ------------------- |
| Reading   | Complete the Words, Read in Daily Life, Read an Academic Passage | `toefl/reading/*`   |
| Writing   | Build a Sentence, Write an Email, Academic Discussion            | `toefl/writing/*`   |
| Listening | Conversation, Lecture, Choose a Response, Announcement           | `toefl/listening/*` |
| Speaking  | Listen and Repeat, Take an Interview                             | `toefl/speaking/*`  |

See [TOEFL Reading](toefl-reading.md), [TOEFL Writing](toefl-writing.md), [TOEFL Speaking](toefl-speaking.md), [TOEFL Listening](toefl-listening.md).

### TOEIC L&R

| Part   | Section   | Description           |
| ------ | --------- | --------------------- |
| Part 2 | Listening | Question-Response     |
| Part 3 | Listening | Conversations         |
| Part 4 | Listening | Talks                 |
| Part 5 | Reading   | Incomplete Sentences  |
| Part 6 | Reading   | Text Completion       |
| Part 7 | Reading   | Reading Comprehension |

See [TOEIC](toeic.md).

### Other

- [Shadowing Practice](shadowing.md) -- pronunciation and fluency training
- [Dashboard](dashboard.md) -- score tracking and performance analytics

## Common patterns

### Question loading

All task pages use the `useQuestion<T>` hook (`src/hooks/useQuestion.ts`) to load question data. The hook wraps `src/lib/questions.ts` which fetches JSON files from `public/questions/{taskPath}/`. Each task folder requires:

- `index.json` listing available files: `{ "files": ["001.json", "002.json", ...] }`
- Individual `.json` files containing question data matching a task-specific schema

See [Architecture](../overview/architecture.md) for the full data flow.

### Routing

Routes are defined in `src/App.tsx`. Each task gets two routes:

- `/{taskPath}` -- the [Question Selector Page](../components/question/QuestionSelectorPage.tsx) showing available question numbers with completion status
- `/{taskPath}/:questionNumber` -- the individual question page

### Score tracking

All graded tasks save results via `useScoreHistory` (`src/hooks/useScoreHistory.ts`). Each entry stores:

- `taskId` (e.g., `toefl/reading/complete-words`)
- `date` (ISO string)
- `correct`, `total`, `pct`
- `elapsedSeconds` (if timed)
- `questionFile` (the source file name)

Scores persist in `localStorage` under the key `score-history`.

### Timer patterns

Two timer hooks serve different purposes:

- **`useTimer`** (`src/hooks/useTimer.ts`) -- countdown timer with configurable duration and expiry callback. Used for time-limited tasks (Write Email: 7 min, Academic Discussion: 10 min, Take an Interview: 45 sec per question).
- **`useElapsedTimer`** (`src/hooks/useElapsedTimer.ts`) -- stopwatch that runs forward. Used for untimed tasks to track session duration. Displays via `FloatingElapsedTimer` component.

### Audio playback

The `useTts` hook (`src/hooks/useTts.ts`) provides browser-based audio playback using the Web Audio API. It supports:

- Single audio file playback
- Concatenated segment playback with optional silence gaps
- Playback speed control (0.5x-1.5x)
- Seek, pause, resume

Audio files are stored as MP3 under `public/audio/{taskPath}/{questionFile}/`. For listening tasks, each audio segment is a separate file.

## Key shared components

| Component            | File                                               | Used by                                                             |
| -------------------- | -------------------------------------------------- | ------------------------------------------------------------------- |
| SectionHeader        | `src/components/layout/SectionHeader.tsx`          | All pages -- back button, title, progress bar                       |
| QuestionSelectorPage | `src/components/question/QuestionSelectorPage.tsx` | All task selector pages                                             |
| FeedbackPanel        | `src/components/ui/FeedbackPanel.tsx`              | Reading, TOEIC tasks -- correct/incorrect feedback with explanation |
| FloatingElapsedTimer | `src/components/ui/FloatingElapsedTimer.tsx`       | Timed tasks -- elapsed time overlay                                 |
| ProgressBar          | `src/components/ui/ProgressBar.tsx`                | Section headers and result cards                                    |
| Timer                | `src/components/ui/Timer.tsx`                      | Countdown timers for time-limited tasks                             |
| SpeedControl         | `src/components/ui/SpeedControl.tsx`               | Listening and speaking tasks -- TTS playback speed                  |
| GradingRequestPanel  | `src/components/ui/GradingRequestPanel.tsx`        | Writing and speaking tasks -- answer submission flow                |

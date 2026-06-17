# Dashboard

Performance tracking and score history visualization. The dashboard reads all saved score entries from `localStorage` and renders summary KPIs, per-task charts, and recent attempt lists.

## Data sources

The dashboard reads from two `localStorage` keys:

- **Score history** (`score-history`) -- stores per-attempt results for all graded tasks. Written by `useScoreHistory.saveScore()`.
- **Answer history** (`answer-history`) -- stores writing and speaking response submissions. Written by `saveAnswerSubmission()`.

## Page structure

### Summary KPIs

Four cards in a row (responsive: 2x2 on mobile):

| Metric               | Description                                           |
| -------------------- | ----------------------------------------------------- |
| Total Sessions       | Total number of score entries across all tasks        |
| Tasks Practiced      | Number of distinct task types with at least one entry |
| Overall Avg Accuracy | Mean accuracy percentage across all sessions          |
| Overall Avg Time     | Mean elapsed time across all timed sessions           |

### Per-task cards

Each task with score history gets a card containing:

1. **Header** -- colored dot (from `TASK_COLORS` mapping), task label, session count
2. **Stats row** -- Latest accuracy, Best accuracy, Average accuracy, Latest time, Average time
3. **Line chart** -- Canvas-based chart plotting accuracy over time. Uses `window.devicePixelRatio` for sharp rendering on retina displays.
4. **Recent attempts** -- Last 5 entries shown as horizontal progress bars with date, accuracy percentage, score fraction, and elapsed time

### Line chart details

The `LineChart` component draws on an HTML5 Canvas element:

- Y-axis: 0-100% with grid lines at 25% intervals
- X-axis: dates (MM/DD format), thinned to max 8 labels
- Area fill at 15% opacity under the line
- Series line at 2.5px width
- Data points as white-filled circles with colored stroke
- ResizeObserver handles responsive redrawing
- Empty state shows "No records yet" centered text

### Empty state

When no score history exists, the dashboard shows:

- "No answer history yet." message
- "Scores will appear here after you complete questions on practice pages."
- Two CTA buttons: Practice TOEFL, Practice TOEIC

### Clear history

A "Clear All History" button at the bottom requires a confirmation click (double-click to delete). This calls `useScoreHistory.clearAll()` and resets the local state.

### Answer history section

If any answer submissions exist (writing/speaking responses), a separate section lists them with:

- Date
- Problem ID (e.g., `toefl/writing/email/001`)
- Preview of the response text (truncated to 80 characters)

## Task labeling

Task IDs are mapped to display labels via `TASK_LABELS` in `DashboardPage.tsx`. Task-specific colors are defined in `TASK_COLORS` for chart rendering.

## Entry points

To add a new task to the dashboard:

1. Add the `taskId` to the `TaskId` type in `src/hooks/useScoreHistory.ts`
2. Add a label to `TASK_LABELS` in `DashboardPage.tsx`
3. Optionally add a color to `TASK_COLORS` for the chart

## Key source files

| File                           | Purpose                                                       |
| ------------------------------ | ------------------------------------------------------------- |
| `src/pages/DashboardPage.tsx`  | Dashboard page with KPI cards, task charts, and attempt lists |
| `src/hooks/useScoreHistory.ts` | Score data persistence and retrieval                          |
| `src/lib/answerSubmission.ts`  | Answer history retrieval (`getAllAnswers()`)                  |
| `src/lib/time.ts`              | Time formatting utility (`formatSecondsAsMmSs`)               |

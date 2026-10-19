import type { ScoreEntry, TaskId } from "../hooks/useScoreHistory";

/**
 * The one task to suggest practising next, or null when nothing stands out.
 * Recent runs only, so an old bad streak you've since fixed stops counting;
 * under 3 runs is too noisy to call, and 85%+ everywhere isn't worth a nag.
 */
export function pickFocusTask(
  byTask: Partial<Record<TaskId, ScoreEntry[]>>,
): TaskId | null {
  let focus: TaskId | null = null;
  let lowest = 85;
  for (const [id, entries] of Object.entries(byTask) as [
    TaskId,
    ScoreEntry[],
  ][]) {
    if (entries.length < 3) continue;
    const recent =
      entries.slice(-5).reduce((s, e) => s + e.pct, 0) /
      Math.min(entries.length, 5);
    if (recent < lowest) [focus, lowest] = [id, recent];
  }
  return focus;
}

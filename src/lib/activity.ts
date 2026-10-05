/** Daily activity aggregation for the streak calendar (local time, Sunday-start weeks). */

export interface ActivityDay {
  /** Local date key, YYYY-MM-DD. */
  key: string;
  date: Date;
  count: number;
  /** 0 = none, 1–4 = increasing intensity. */
  level: 0 | 1 | 2 | 3 | 4;
  /** Day lies after `today` (padding at the end of the last week). */
  future: boolean;
}

export interface ActivitySummary {
  weeks: ActivityDay[][];
  /** Days with at least one session, within the grid. */
  activeDays: number;
  /** Sessions within the grid. */
  totalSessions: number;
  currentStreak: number;
  longestStreak: number;
}

const DAY_MS = 86_400_000;

export function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

export function countByDay(dates: string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const iso of dates) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) continue;
    const k = dayKey(d);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return counts;
}

function levelFor(count: number): ActivityDay["level"] {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 6) return 3;
  return 4;
}

/**
 * Build a GitHub-style grid ending in the week that contains `today`.
 * The current streak counts back from today, or from yesterday if today
 * has no sessions yet — so the streak doesn't "break" until a full day is missed.
 */
export function buildActivity(
  dates: string[],
  today: Date = new Date(),
  weekCount = 53,
): ActivitySummary {
  const counts = countByDay(dates);
  const end = startOfDay(today);
  const lastSunday = addDays(end, -end.getDay());
  const first = addDays(lastSunday, -(weekCount - 1) * 7);

  let activeDays = 0;
  let totalSessions = 0;
  const weeks: ActivityDay[][] = [];
  for (let w = 0; w < weekCount; w++) {
    const week: ActivityDay[] = [];
    for (let d = 0; d < 7; d++) {
      const date = addDays(first, w * 7 + d);
      const key = dayKey(date);
      const count = counts.get(key) ?? 0;
      if (count > 0) {
        activeDays++;
        totalSessions += count;
      }
      week.push({
        key,
        date,
        count,
        level: levelFor(count),
        future: date.getTime() > end.getTime(),
      });
    }
    weeks.push(week);
  }

  let currentStreak = 0;
  let cursor = counts.has(dayKey(end)) ? end : addDays(end, -1);
  while (counts.has(dayKey(cursor))) {
    currentStreak++;
    cursor = addDays(cursor, -1);
  }

  const sortedDays = [...counts.keys()].sort();
  let longestStreak = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const k of sortedDays) {
    const [y, m, d] = k.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    // Round to absorb DST shifts in the day difference.
    run =
      prev && Math.round((date.getTime() - prev.getTime()) / DAY_MS) === 1
        ? run + 1
        : 1;
    longestStreak = Math.max(longestStreak, run);
    prev = date;
  }

  return {
    weeks,
    activeDays,
    totalSessions,
    currentStreak,
    longestStreak,
  };
}

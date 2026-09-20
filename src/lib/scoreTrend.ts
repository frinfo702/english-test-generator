import type { ScoreEntry } from "../hooks/useScoreHistory";

export interface TrendPoint {
  /** Unique per session — two sessions on one day must not share an x value. */
  id: string;
  label: string;
  date: string;
  /** "2nd session" when the same day holds more than one attempt. */
  session: string | null;
  pct: number;
  time: string | null;
}

function shortDate(iso: string) {
  const date = new Date(iso);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

export function shortClock(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function ordinal(n: number) {
  const suffixes = ["th", "st", "nd", "rd"];
  const value = n % 100;
  return `${n}${suffixes[(value - 20) % 10] ?? suffixes[value] ?? suffixes[0]}`;
}

/**
 * Build the chart series and its axis labels.
 *
 * X values are session ids, not dates: a category axis collapses identical
 * dates into one tick, which silently kills the hover lookup when someone
 * practises twice in a day. Repeated days therefore print one date label, and
 * the tooltip names the session.
 */
export function buildScoreTrend(entries: ScoreEntry[]): {
  data: TrendPoint[];
  tickLabel: Map<string, string>;
} {
  const perDay = new Map<string, number>();
  const tickLabel = new Map<string, string>();

  const data = entries.map((entry, index) => {
    const day = shortDate(entry.date);
    const count = (perDay.get(day) ?? 0) + 1;
    perDay.set(day, count);
    const id = `s${index}`;
    tickLabel.set(id, count === 1 ? day : "");
    return {
      id,
      label: day,
      date: new Date(entry.date).toLocaleDateString(),
      session: count > 1 ? `${ordinal(count)} session` : null,
      pct: entry.pct,
      time:
        typeof entry.elapsedSeconds === "number"
          ? shortClock(entry.elapsedSeconds)
          : null,
    };
  });

  return { data, tickLabel };
}

import { overallBand, type SectionKey } from "./trial";

/**
 * Target TOEFL bands. Schools ask for a total plus section minimums, so each
 * is optional on its own. Kept in this browser only, like the rest of history.
 */
export interface ScoreGoal {
  overall: number | null;
  sections: Record<SectionKey, number | null>;
}

const KEY = "score-goal";
const SECTION_KEYS: SectionKey[] = [
  "reading",
  "listening",
  "writing",
  "speaking",
];

/** 1–6 in half bands, the 2026 score scale. */
export const BAND_STEPS = Array.from({ length: 11 }, (_, i) => 1 + i * 0.5);

const band = (v: unknown): number | null =>
  typeof v === "number" && BAND_STEPS.includes(v) ? v : null;

export function emptyGoal(): ScoreGoal {
  return {
    overall: null,
    sections: { reading: null, listening: null, writing: null, speaking: null },
  };
}

export function loadScoreGoal(): ScoreGoal {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "null");
    if (!raw || typeof raw !== "object") return emptyGoal();
    const goal = emptyGoal();
    goal.overall = band(raw.overall);
    for (const k of SECTION_KEYS) goal.sections[k] = band(raw.sections?.[k]);
    // Saved before the bands were checked against each other.
    const [lo, hi] = totalRange(goal.sections);
    if (goal.overall !== null && (goal.overall < lo || goal.overall > hi))
      goal.overall = null;
    return withDerivedTotal(goal);
  } catch {
    return emptyGoal();
  }
}

export function saveScoreGoal(goal: ScoreGoal): void {
  try {
    const empty =
      goal.overall === null &&
      SECTION_KEYS.every((k) => goal.sections[k] === null);
    if (empty) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, JSON.stringify(goal));
  } catch {
    // Storage blocked (private mode): the goal just won't survive a reload.
  }
}

/**
 * The totals the section goals still allow. ETS rounds the section mean to
 * the nearest half band, so an unset section can be anything from 1 to 6;
 * with all four set the total is fixed. Every half band in between is
 * reachable, since one half-band step in a section moves the mean by 0.125.
 */
export function totalRange(
  sections: ScoreGoal["sections"],
): [min: number, max: number] {
  const vals = SECTION_KEYS.map((k) => sections[k]);
  const lo = overallBand(vals.map((v) => v ?? BAND_STEPS[0]))!;
  const hi = overallBand(
    vals.map((v) => v ?? BAND_STEPS[BAND_STEPS.length - 1]),
  )!;
  return [lo, hi];
}

/** Would this section goal still leave the total goal reachable? */
export function sectionGoalFits(
  goal: ScoreGoal,
  key: SectionKey,
  value: number,
): boolean {
  if (goal.overall === null) return true;
  const [lo, hi] = totalRange({ ...goal.sections, [key]: value });
  return goal.overall >= lo && goal.overall <= hi;
}

/** With all four sections set the total follows from them, so fill it in. */
export function withDerivedTotal(goal: ScoreGoal): ScoreGoal {
  const [lo, hi] = totalRange(goal.sections);
  return lo === hi && SECTION_KEYS.every((k) => goal.sections[k] !== null)
    ? { ...goal, overall: lo }
    : goal;
}

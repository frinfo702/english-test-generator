/**
 * How "Next Question" picks the following problem, like a music player:
 * shuffle or in order (exactly one is on), plus an independent
 * "unsolved only" filter.
 */
export type NextOrder = "shuffle" | "order";

export interface NextMode {
  order: NextOrder;
  unsolvedOnly: boolean;
}

const ORDER_KEY = "next-question-mode";
const UNSOLVED_KEY = "next-question-unsolved-only";

export function loadNextMode(): NextMode {
  try {
    return {
      order:
        localStorage.getItem(ORDER_KEY) === "shuffle" ? "shuffle" : "order",
      unsolvedOnly: localStorage.getItem(UNSOLVED_KEY) === "1",
    };
  } catch {
    return { order: "order", unsolvedOnly: false };
  }
}

export function saveNextMode(mode: NextMode): void {
  try {
    localStorage.setItem(ORDER_KEY, mode.order);
    localStorage.setItem(UNSOLVED_KEY, mode.unsolvedOnly ? "1" : "0");
  } catch {
    // ignore quota / private mode
  }
}

/**
 * Picks the problem number to go to after `current`, or null when there is
 * nothing to go to (the button then hides).
 *
 * @param numbers  every problem number of the task, ascending
 * @param solved   problem numbers that already have a saved score
 */
export function pickNext(
  { order, unsolvedOnly }: NextMode,
  numbers: readonly number[],
  current: number,
  solved: ReadonlySet<number>,
): number | null {
  const candidates = numbers.filter(
    (n) => n !== current && !(unsolvedOnly && solved.has(n)),
  );
  if (order === "shuffle") {
    return candidates.length
      ? candidates[Math.floor(Math.random() * candidates.length)]
      : null;
  }
  const after = candidates.find((n) => n > current);
  // Unsolved ones before `current` still need doing, so wrap around for them.
  return after ?? (unsolvedOnly ? (candidates[0] ?? null) : null);
}

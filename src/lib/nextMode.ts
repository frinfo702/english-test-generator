/** How "Next Question" picks the following problem, like a music player. */
export type NextMode = "shuffle" | "order" | "unsolved";

export const NEXT_MODES: readonly NextMode[] = ["shuffle", "order", "unsolved"];

export const NEXT_MODE_LABELS: Record<NextMode, string> = {
  shuffle: "Shuffle",
  order: "In order",
  unsolved: "Unsolved",
};

const STORAGE_KEY = "next-question-mode";

export function loadNextMode(): NextMode {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return NEXT_MODES.includes(value as NextMode) ? (value as NextMode) : "order";
  } catch {
    return "order";
  }
}

export function saveNextMode(mode: NextMode): void {
  try {
    localStorage.setItem(STORAGE_KEY, mode);
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
  mode: NextMode,
  numbers: readonly number[],
  current: number,
  solved: ReadonlySet<number>,
): number | null {
  const others = numbers.filter((n) => n !== current);
  if (mode === "shuffle") {
    return others.length
      ? others[Math.floor(Math.random() * others.length)]
      : null;
  }
  if (mode === "order") {
    return numbers.find((n) => n > current) ?? null;
  }
  // unsolved: the next unsolved one after current, wrapping to the start.
  const unsolved = others.filter((n) => !solved.has(n));
  return unsolved.find((n) => n > current) ?? unsolved[0] ?? null;
}

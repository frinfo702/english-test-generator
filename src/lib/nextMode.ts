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

function readNextMode(): NextMode {
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

// One shared value, not per-component state: pages render two
// NextQuestionButtons, and toggling one must update the other.
let cached: NextMode | null = null;
const listeners = new Set<() => void>();

export function subscribeNextMode(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getNextMode(): NextMode {
  return (cached ??= readNextMode());
}

export function setNextMode(mode: NextMode): void {
  cached = mode;
  try {
    localStorage.setItem(ORDER_KEY, mode.order);
    localStorage.setItem(UNSOLVED_KEY, mode.unsolvedOnly ? "1" : "0");
  } catch {
    // ignore quota / private mode
  }
  listeners.forEach((l) => l());
}

/**
 * Picks the problem ID to go to after `current`, or null when there is
 * nothing to go to (the button then hides).
 *
 * @param ids     every problem ID of the task, ascending
 * @param solved  problem IDs that already have a saved score
 */
export function pickNext(
  { order, unsolvedOnly }: NextMode,
  ids: readonly string[],
  current: string,
  solved: ReadonlySet<string>,
): string | null {
  const candidates = ids.filter(
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

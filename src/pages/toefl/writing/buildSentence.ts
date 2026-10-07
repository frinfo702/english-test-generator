/** Chunk index placed in each answer blank, or null when the blank is empty. */
export type Slots = (number | null)[];

export type DragSource =
  { kind: "pool"; chunk: number } | { kind: "slot"; index: number };

export type DropTarget = { kind: "pool" } | { kind: "slot"; index: number };

export function emptySlots(length: number): Slots {
  return Array.from({ length }, () => null);
}

/**
 * Apply a drop and return the new slots.
 * Dropping onto a filled blank swaps: a pool chunk sends the occupant back to
 * the pool, a placed chunk trades places with it.
 */
export function applyDrop(
  slots: Slots,
  source: DragSource,
  target: DropTarget,
): Slots {
  const next = [...slots];

  if (target.kind === "pool") {
    if (source.kind === "slot") next[source.index] = null;
    return next;
  }

  if (source.kind === "pool") {
    next[target.index] = source.chunk;
    return next;
  }

  if (source.index === target.index) return slots;
  next[target.index] = slots[source.index];
  next[source.index] = slots[target.index];
  return next;
}

/** Chunks not yet placed in any blank, in their original order. */
export function poolChunks(chunkCount: number, slots: Slots): number[] {
  const placed = new Set(slots);
  return Array.from({ length: chunkCount }, (_, i) => i).filter(
    (i) => !placed.has(i),
  );
}

export function isFilled(slots: Slots, chunkCount: number): boolean {
  return slots.length === chunkCount && slots.every((s) => s !== null);
}

export function isCorrectOrder(slots: Slots, correctOrder: number[]): boolean {
  return (
    slots.length === correctOrder.length &&
    slots.every((chunk, pos) => chunk === correctOrder[pos])
  );
}

const QUESTION_STARTERS = new Set([
  "am",
  "is",
  "are",
  "was",
  "were",
  "do",
  "does",
  "did",
  "have",
  "has",
  "had",
  "can",
  "could",
  "will",
  "would",
  "shall",
  "should",
  "may",
  "might",
  "must",
  "what",
  "where",
  "when",
  "why",
  "who",
  "whom",
  "whose",
  "which",
  "how",
]);

/**
 * Terminal mark shown after the last blank. `fullSentence` is stored without
 * it, so use one if present, else "?" for a sentence opening with an
 * auxiliary or wh-word ("Do you know where…"), else ".".
 */
export function endPunctuation(fullSentence: string): string {
  const trimmed = fullSentence.trim();
  const mark = /[.?!]$/.exec(trimmed);
  if (mark) return mark[0];
  const first = trimmed.split(/\s+/)[0]?.toLowerCase() ?? "";
  return QUESTION_STARTERS.has(first) ? "?" : ".";
}

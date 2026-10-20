/**
 * Seconds before the answer shows itself: about the time a fluent speaker
 * needs to start and finish the sentence. A flat budget would let short
 * sentences be translated in the head first, which is what the drill trains out.
 */
export function thinkSeconds(english: string): number {
  const words = english.trim().split(/\s+/).length;
  return Math.min(9, 2 + words * 0.4);
}

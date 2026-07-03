/**
 * Dictation helper logic — word tokenisation, pool generation, and ordering.
 *
 * A dictation sentence is split into individual words. Distractor words
 * (provided in the question data) are added to the pool so the learner
 * must listen carefully to distinguish correct words from fakes.
 *
 * Each word in the pool carries a unique id so that duplicate words
 * (e.g. repeated words in a sentence) can be tracked independently.
 */

export interface WordToken {
  /** Unique identifier for this token instance (e.g. "w0", "w1", "d0") */
  id: string;
  /** The display text (preserves original capitalisation/punctuation) */
  text: string;
  /** Normalised form used for comparison (lowercase, stripped punctuation) */
  normalised: string;
  /** Index into the correct sentence order, or null if a distractor */
  correctIndex: number | null;
}

/**
 * Extract trailing sentence-ending punctuation (. ? !) from the last word
 * of a sentence. Returns the words (with mid-sentence punctuation like commas
 * preserved) and the trailing punctuation as a separate string.
 *
 * Example: "Please turn off the lights before you leave." →
 *   { words: ["Please", "turn", "off", "the", "lights", "before", "you", "leave"],
 *     trailingPunct: "." }
 *
 * "The coffee shop opens at seven on weekdays." →
 *   { words: ["The", "coffee", "shop", "opens", "at", "seven", "on", "weekdays"],
 *     trailingPunct: "." }
 */
export function splitTrailingPunctuation(
  text: string,
): { words: string[]; trailingPunct: string } {
  const raw = text.trim().split(/\s+/).filter(Boolean);
  if (raw.length === 0) return { words: [], trailingPunct: "" };

  const lastWord = raw[raw.length - 1];
  // Match trailing . ? ! only (sentence-ending marks). Commas stay attached.
  const match = lastWord.match(/^(.*?)([.?!]+)$/);
  if (match) {
    const stripped = [...raw.slice(0, -1), match[1]];
    return { words: stripped, trailingPunct: match[2] };
  }
  return { words: raw, trailingPunct: "" };
}

/**
 * Split a sentence into word tokens, preserving mid-sentence punctuation
 * (e.g. commas) attached to words. Sentence-ending punctuation (. ? !)
 * is NOT included — use splitTrailingPunctuation() to get it separately.
 */
export function tokenizeSentence(text: string): string[] {
  return splitTrailingPunctuation(text).words;
}

/**
 * Normalise a word for comparison: lowercase and strip non-alphanumeric
 * characters (except apostrophes inside words like "don't").
 */
export function normalizeWord(word: string): string {
  return word.toLowerCase().replace(/[^a-z0-9']/g, "");
}

/**
 * Build the full pool of word tokens: correct words + distractor words.
 * Distractors are appended after the correct words.
 */
export function buildWordPool(
  sentenceText: string,
  distractors: string[],
): WordToken[] {
  const words = tokenizeSentence(sentenceText);
  const tokens: WordToken[] = [];

  words.forEach((word, i) => {
    tokens.push({
      id: `w${i}`,
      text: word,
      normalised: normalizeWord(word),
      correctIndex: i,
    });
  });

  distractors.forEach((word, i) => {
    tokens.push({
      id: `d${i}`,
      text: word,
      normalised: normalizeWord(word),
      correctIndex: null,
    });
  });

  return tokens;
}

/**
 * Fisher–Yates shuffle (deterministic with a seed for reproducible tests).
 * If no seed is provided, uses Math.random.
 */
export function shuffleWithSeed<T>(items: T[], seed?: number): T[] {
  const result = [...items];
  let s = seed ?? Date.now();

  // Simple LCG for deterministic shuffling
  const next = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Shuffle the word pool for display. Ensures the first word is not already
 * in the correct position (to avoid trivially easy layouts).
 */
export function shufflePool(tokens: WordToken[], seed?: number): WordToken[] {
  let shuffled = shuffleWithSeed(tokens, seed);
  // Avoid the trivial case where the first pool item is the first correct word
  if (
    shuffled.length > 1 &&
    shuffled[0].correctIndex === 0 &&
    seed === undefined
  ) {
    // Swap first two
    [shuffled[0], shuffled[1]] = [shuffled[1], shuffled[0]];
  }
  return shuffled;
}

/**
 * Check whether a sequence of selected tokens matches the correct sentence
 * order up to the given position.
 *
 * Returns true if every token so far is the correct word at that position.
 */
export function isCorrectSoFar(
  selected: WordToken[],
  correctWords: string[],
): boolean {
  for (let i = 0; i < selected.length; i++) {
    const expected = normalizeWord(correctWords[i]);
    if (selected[i].normalised !== expected) {
      return false;
    }
  }
  return true;
}

/**
 * Check whether the full selection is complete and correct.
 */
export function isCompleteAndCorrect(
  selected: WordToken[],
  correctWords: string[],
): boolean {
  if (selected.length !== correctWords.length) return false;
  return isCorrectSoFar(selected, correctWords);
}

/**
 * Reconstruct the sentence text from the original words.
 */
export function reconstructSentence(words: string[]): string {
  return words.join(" ");
}

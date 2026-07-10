import { describe, it, expect } from "vitest";
import {
  tokenizeSentence,
  splitTrailingPunctuation,
  normalizeWord,
  buildWordPool,
  shuffleWithSeed,
  shufflePool,
  isCorrectSoFar,
  isCompleteAndCorrect,
  reconstructSentence,
} from "./dictation";

describe("splitTrailingPunctuation", () => {
  it("extracts trailing period from last word", () => {
    expect(splitTrailingPunctuation("The meeting starts now.")).toEqual({
      words: ["The", "meeting", "starts", "now"],
      trailingPunct: ".",
    });
  });

  it("extracts trailing question mark", () => {
    expect(
      splitTrailingPunctuation(
        "Could you reschedule the appointment for Tuesday?",
      ),
    ).toEqual({
      words: [
        "Could",
        "you",
        "reschedule",
        "the",
        "appointment",
        "for",
        "Tuesday",
      ],
      trailingPunct: "?",
    });
  });

  it("preserves mid-sentence commas attached to words", () => {
    expect(splitTrailingPunctuation("Well, that is interesting.")).toEqual({
      words: ["Well,", "that", "is", "interesting"],
      trailingPunct: ".",
    });
  });

  it("returns empty trailingPunct when no sentence-ending mark", () => {
    expect(splitTrailingPunctuation("Hello world today")).toEqual({
      words: ["Hello", "world", "today"],
      trailingPunct: "",
    });
  });

  it("handles empty string", () => {
    expect(splitTrailingPunctuation("")).toEqual({
      words: [],
      trailingPunct: "",
    });
  });
});

describe("tokenizeSentence", () => {
  it("splits a sentence into words (without trailing punctuation)", () => {
    expect(tokenizeSentence("Hello world today")).toEqual([
      "Hello",
      "world",
      "today",
    ]);
  });

  it("strips trailing period from last word", () => {
    expect(tokenizeSentence("The meeting starts now.")).toEqual([
      "The",
      "meeting",
      "starts",
      "now",
    ]);
  });

  it("strips trailing question mark", () => {
    expect(tokenizeSentence("Is it ready?")).toEqual(["Is", "it", "ready"]);
  });

  it("preserves mid-sentence commas", () => {
    expect(tokenizeSentence("Well, that is interesting.")).toEqual([
      "Well,",
      "that",
      "is",
      "interesting",
    ]);
  });

  it("handles extra whitespace", () => {
    expect(tokenizeSentence("  too   much  space  ")).toEqual([
      "too",
      "much",
      "space",
    ]);
  });
});

describe("normalizeWord", () => {
  it("lowercases and strips punctuation", () => {
    expect(normalizeWord("Hello!")).toBe("hello");
    expect(normalizeWord("TODAY.")).toBe("today");
  });

  it("preserves apostrophes inside words", () => {
    expect(normalizeWord("don't")).toBe("don't");
    expect(normalizeWord("It's")).toBe("it's");
  });
});

describe("buildWordPool", () => {
  it("creates tokens for correct words with correctIndex", () => {
    const pool = buildWordPool("I walk home", []);
    expect(pool).toHaveLength(3);
    expect(pool[0]).toEqual({
      id: "w0",
      text: "I",
      normalised: "i",
      correctIndex: 0,
    });
    expect(pool[2].correctIndex).toBe(2);
  });

  it("appends distractor tokens with null correctIndex", () => {
    const pool = buildWordPool("I walk home", ["run", "school"]);
    expect(pool).toHaveLength(5);
    expect(pool[3]).toEqual({
      id: "d0",
      text: "run",
      normalised: "run",
      correctIndex: null,
    });
    expect(pool[4].correctIndex).toBeNull();
  });
});

describe("shuffleWithSeed", () => {
  it("produces deterministic output for the same seed", () => {
    const items = [1, 2, 3, 4, 5];
    const a = shuffleWithSeed(items, 42);
    const b = shuffleWithSeed(items, 42);
    expect(a).toEqual(b);
  });

  it("does not mutate the original array", () => {
    const items = [1, 2, 3];
    const original = [...items];
    shuffleWithSeed(items, 99);
    expect(items).toEqual(original);
  });

  it("preserves all elements", () => {
    const items = [1, 2, 3, 4, 5];
    const shuffled = shuffleWithSeed(items, 7);
    expect(shuffled.sort()).toEqual(items.sort());
  });
});

describe("shufflePool", () => {
  it("returns all tokens", () => {
    const pool = buildWordPool("one two three", ["four"]);
    const shuffled = shufflePool(pool, 123);
    expect(shuffled).toHaveLength(4);
  });
});

describe("isCorrectSoFar", () => {
  const correctWords = ["I", "walk", "home"];

  it("returns true for a correct prefix", () => {
    const pool = buildWordPool("I walk home", []);
    expect(isCorrectSoFar([pool[0]], correctWords)).toBe(true);
    expect(isCorrectSoFar([pool[0], pool[1]], correctWords)).toBe(true);
  });

  it("returns false when a wrong word is selected", () => {
    const pool = buildWordPool("I walk home", ["run"]);
    const runToken = pool[3];
    expect(isCorrectSoFar([pool[0], runToken], correctWords)).toBe(false);
  });

  it("returns true for empty selection", () => {
    expect(isCorrectSoFar([], correctWords)).toBe(true);
  });
});

describe("isCompleteAndCorrect", () => {
  it("returns true when all words match", () => {
    const pool = buildWordPool("I walk home", []);
    expect(
      isCompleteAndCorrect([pool[0], pool[1], pool[2]], ["I", "walk", "home"]),
    ).toBe(true);
  });

  it("returns false when incomplete", () => {
    const pool = buildWordPool("I walk home", []);
    expect(
      isCompleteAndCorrect([pool[0], pool[1]], ["I", "walk", "home"]),
    ).toBe(false);
  });

  it("returns false when wrong word included", () => {
    const pool = buildWordPool("I walk home", ["run"]);
    expect(
      isCompleteAndCorrect([pool[0], pool[1], pool[3]], ["I", "walk", "home"]),
    ).toBe(false);
  });
});

describe("reconstructSentence", () => {
  it("joins words with spaces", () => {
    expect(reconstructSentence(["I", "walk", "home"])).toBe("I walk home");
  });
});

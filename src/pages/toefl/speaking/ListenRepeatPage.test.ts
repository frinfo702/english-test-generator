import { describe, expect, it } from "vitest";
import {
  alignWords,
  countCorrectWords,
  countOriginalWords,
  normalizeWord,
} from "./listenRepeat";

describe("alignWords", () => {
  it("matches identical sentences", () => {
    const result = alignWords("Hello world", "hello world");
    expect(result).toEqual([
      { type: "match", original: "Hello", recognized: "hello", correct: true },
      { type: "match", original: "world", recognized: "world", correct: true },
    ]);
    expect(countCorrectWords(result)).toBe(2);
    expect(countOriginalWords(result)).toBe(2);
  });

  it("ignores casing and punctuation", () => {
    const result = alignWords("Hello, world!", "hello world");
    expect(result.every((a) => a.correct)).toBe(true);
    expect(countCorrectWords(result)).toBe(2);
  });

  it("flags substitutions, deletions, and insertions", () => {
    const result = alignWords("Please sit down", "please stand up");
    expect(result).toEqual([
      {
        type: "match",
        original: "Please",
        recognized: "please",
        correct: true,
      },
      {
        type: "substitution",
        original: "sit",
        recognized: "stand",
        correct: false,
      },
      {
        type: "substitution",
        original: "down",
        recognized: "up",
        correct: false,
      },
    ]);
    expect(countCorrectWords(result)).toBe(1);
    expect(countOriginalWords(result)).toBe(3);
  });

  it("handles missing words", () => {
    const result = alignWords("The quick brown fox", "the brown");
    expect(result).toContainEqual({
      type: "match",
      original: "The",
      recognized: "the",
      correct: true,
    });
    expect(result).toContainEqual({
      type: "deletion",
      original: "quick",
      recognized: null,
      correct: false,
    });
    expect(result).toContainEqual({
      type: "match",
      original: "brown",
      recognized: "brown",
      correct: true,
    });
    expect(result).toContainEqual({
      type: "deletion",
      original: "fox",
      recognized: null,
      correct: false,
    });
  });

  it("handles extra words", () => {
    const result = alignWords("The brown fox", "the quick brown fox");
    expect(result).toContainEqual({
      type: "insertion",
      original: null,
      recognized: "quick",
      correct: false,
    });
  });

  it("handles empty recognized input", () => {
    const result = alignWords("Hello world", "");
    expect(result).toEqual([
      { type: "deletion", original: "Hello", recognized: null, correct: false },
      { type: "deletion", original: "world", recognized: null, correct: false },
    ]);
    expect(countCorrectWords(result)).toBe(0);
  });
});

describe("normalizeWord", () => {
  it("lowercases and strips punctuation", () => {
    expect(normalizeWord("Hello!")).toBe("hello");
    expect(normalizeWord("don't")).toBe("don't");
    expect(normalizeWord("123")).toBe("123");
  });
});

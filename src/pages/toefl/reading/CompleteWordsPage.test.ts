import { describe, expect, it } from "vitest";
import {
  escapeRegExp,
  findAnswerPosition,
  getAnswerMatches,
  getExpectedSuffix,
} from "./completeWords";

describe("CompleteWordsPage helpers", () => {
  it("extracts only the suffix after a case-insensitive hint", () => {
    expect(getExpectedSuffix({ index: 1, hint: "pre", answer: "prefix" })).toBe(
      "fix",
    );
    expect(getExpectedSuffix({ index: 2, hint: "APP", answer: "apple" })).toBe(
      "le",
    );
    expect(getExpectedSuffix({ index: 3, hint: "mis", answer: "apple" })).toBe(
      "apple",
    );
  });

  it("escapes regular-expression metacharacters", () => {
    expect(escapeRegExp("a+b?c.*")).toBe("a\\+b\\?c\\.\\*");
  });

  it("finds whole-answer matches without matching substrings", () => {
    const matches = getAnswerMatches("cat scatter cat", "cat");
    expect(matches).toEqual([{ start: 0 }, { start: 12 }]);
  });

  it("finds the next unused answer position and falls back to earlier matches", () => {
    const usedStarts = new Set([0]);
    expect(findAnswerPosition("cat scatter cat", "cat", 1, usedStarts)).toBe(12);
    expect(findAnswerPosition("cat scatter cat", "cat", 20, usedStarts)).toBe(12);
    usedStarts.add(12);
    expect(findAnswerPosition("cat scatter cat", "cat", 0, usedStarts)).toBe(-1);
  });
});

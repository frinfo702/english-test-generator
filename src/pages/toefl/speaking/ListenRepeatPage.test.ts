import { describe, expect, it } from "vitest";
import { diffWords } from "./listenRepeat";

describe("ListenRepeatPage helpers", () => {
  it("ignores casing and punctuation when diffing words", () => {
    expect(diffWords("Hello, world!", "hello world")).toEqual([
      { word: "Hello,", correct: true, inputWord: "hello" },
      { word: "world!", correct: true, inputWord: "world" },
    ]);
  });

  it("marks missing or incorrect words", () => {
    expect(diffWords("Please sit down", "please stand")).toEqual([
      { word: "Please", correct: true, inputWord: "please" },
      { word: "sit", correct: false, inputWord: "stand" },
      { word: "down", correct: false, inputWord: "" },
    ]);
  });
});

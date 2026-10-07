import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const QUESTION_DIR = path.resolve(
  __dirname,
  "../../public/questions/toefl/reading/complete-words",
);

interface CompleteWordsItem {
  index: number;
  hint: string;
  answer: string;
}

interface CompleteWordsData {
  paragraph: string;
  items: CompleteWordsItem[];
}

/**
 * 2026 layout: sentence 1 intact, blanks on every other word from the 2nd
 * word of sentence 2, first floor(len/2) letters shown. A 1-letter word,
 * number or proper noun can't be blanked, so the run may step over one.
 */
function expectCTestBlank(
  item: CompleteWordsItem,
  words: string[],
  wordIdx: number,
  prevWordIdx: number,
  itemIdx: number,
  firstSentenceWords: number,
) {
  const answer = item.answer;
  expect(item.hint).toBe(answer.slice(0, Math.floor(answer.length / 2)));
  if (itemIdx === 0) {
    expect(wordIdx).toBe(firstSentenceWords + 1);
    return;
  }
  const gap = wordIdx - prevWordIdx;
  if (gap === 3) {
    const skipped = words[prevWordIdx + 2].replace(/[^A-Za-z0-9]/g, "");
    expect(skipped.length === 1 || /^[0-9A-Z]/.test(skipped)).toBe(true);
  } else {
    expect(gap).toBe(2);
  }
}

function getQuestionFiles(): string[] {
  return fs
    .readdirSync(QUESTION_DIR)
    .filter((f) => f.endsWith(".json") && f !== "index.json")
    .sort();
}

function loadJson(file: string): CompleteWordsData {
  const raw = fs.readFileSync(path.join(QUESTION_DIR, file), "utf-8");
  return JSON.parse(raw) as CompleteWordsData;
}

describe("TOEFL Reading: Complete the Words JSON structure", () => {
  const files = getQuestionFiles();

  it("has files", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files)("%s is valid JSON", (file) => {
    expect(() => loadJson(file)).not.toThrow();
  });

  it.each(files)("%s has paragraph and items fields", (file) => {
    const data = loadJson(file);
    expect(data).toHaveProperty("paragraph");
    expect(typeof data.paragraph).toBe("string");
    expect(data.paragraph.trim()).not.toBe("");
    expect(data).toHaveProperty("items");
    expect(Array.isArray(data.items)).toBe(true);
  });

  // Word count: 65-100
  it.each(files)("%s paragraph is 65〜100 words", (file) => {
    const data = loadJson(file);
    const wc = data.paragraph.split(/\s+/).filter(Boolean).length;
    expect(wc).toBeGreaterThanOrEqual(65);
    expect(wc).toBeLessThanOrEqual(100);
  });

  // Items: exactly 10
  it.each(files)("%s has exactly 10 items", (file) => {
    const data = loadJson(file);
    expect(data.items.length).toBe(10);
  });

  // Items in order, hint 2-3 chars, hint matches start of answer, at least 3 words gap
  it.each(files)("%s items have valid structure", (file) => {
    const data = loadJson(file);
    const words = data.paragraph.split(/\s+/).filter(Boolean);
    // Date-named files follow the 2026 C-test layout; NNN.json are legacy.
    const isNew = /^\d{8}-/.test(file);
    const firstSentenceWords = data.paragraph.split(/(?<=[.!?])\s/)[0]
      .split(/\s+/).length;
    // Sentence 1 has no blanks, so an answer word there is not the blank.
    let prevWordIdx = isNew ? firstSentenceWords - 1 : -10;

    for (let i = 0; i < data.items.length; i++) {
      const item = data.items[i];

      // index must match position
      expect(item.index).toBe(i);

      // hint must match start of answer (case-insensitive)
      expect(item.answer.toLowerCase()).toMatch(
        new RegExp(`^${item.hint.toLowerCase()}`),
      );

      // answer must exist in paragraph
      const foundIdx = words.findIndex((w, idx) => {
        const cleaned = w
          .replace(/'s$/, "")
          .replace(/[.,;:!?'"()[\]]/g, "")
          .toLowerCase();
        return cleaned === item.answer.toLowerCase() && idx > prevWordIdx;
      });
      expect(foundIdx).not.toBe(-1);

      if (isNew) {
        expectCTestBlank(
          item,
          words,
          foundIdx,
          prevWordIdx,
          i,
          firstSentenceWords,
        );
      }

      prevWordIdx = foundIdx;
    }
  });
});

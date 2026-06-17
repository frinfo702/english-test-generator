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

  // Word count: 70-100
  it.each(files)("%s paragraph is 70〜100 words", (file) => {
    const data = loadJson(file);
    const wc = data.paragraph.split(/\s+/).filter(Boolean).length;
    expect(wc).toBeGreaterThanOrEqual(70);
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
    const num = parseInt(file.replace(".json", ""), 10);
    const isNew = num >= 16; // strict validation for new files only
    let prevWordIdx = -10;

    for (let i = 0; i < data.items.length; i++) {
      const item = data.items[i];

      // index must match position
      expect(item.index).toBe(i);

      // hint must be 2-3 chars (strict for new files)
      expect(item.hint.length).toBeGreaterThanOrEqual(2);
      if (isNew) {
        expect(item.hint.length).toBeLessThanOrEqual(3);
      }

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

      // at least 3 words gap (strict for new files)
      if (isNew) {
        expect(foundIdx - prevWordIdx).toBeGreaterThanOrEqual(3);
      }

      prevWordIdx = foundIdx;
    }
  });
});

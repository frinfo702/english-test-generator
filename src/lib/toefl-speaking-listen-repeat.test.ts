import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const QUESTION_DIR = path.resolve(
  __dirname,
  "../../public/questions/toefl/speaking/listen-repeat",
);

interface ListenRepeatSentence {
  id: string;
  text: string;
  wordCount: number;
}

interface ListenRepeatData {
  sentences: ListenRepeatSentence[];
}

function getQuestionFiles(): string[] {
  return fs
    .readdirSync(QUESTION_DIR)
    .filter((f) => f.endsWith(".json") && f !== "index.json")
    .sort();
}

function loadJson(file: string): ListenRepeatData {
  const raw = fs.readFileSync(path.join(QUESTION_DIR, file), "utf-8");
  return JSON.parse(raw) as ListenRepeatData;
}

describe("TOEFL Speaking: Listen and Repeat JSON structure", () => {
  const files = getQuestionFiles();

  it("has at least one file", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files)("%s is valid JSON", (file) => {
    expect(() => loadJson(file)).not.toThrow();
  });

  it.each(files)("%s has sentences field", (file) => {
    const data = loadJson(file);
    expect(data).toHaveProperty("sentences");
    expect(Array.isArray(data.sentences)).toBe(true);
  });

  // 7-10 sentences per file
  it.each(files)("%s has 7〜10 sentences", (file) => {
    const data = loadJson(file);
    expect(data.sentences.length).toBeGreaterThanOrEqual(7);
    expect(data.sentences.length).toBeLessThanOrEqual(10);
  });

  it.each(files)("%s sentences have required fields", (file) => {
    const data = loadJson(file);
    const seenIds = new Set<string>();

    for (const s of data.sentences) {
      expect(s).toHaveProperty("id");
      expect(typeof s.id).toBe("string");
      expect(s.id.trim()).not.toBe("");
      expect(seenIds.has(s.id)).toBe(false);
      seenIds.add(s.id);

      expect(s).toHaveProperty("text");
      expect(typeof s.text).toBe("string");
      expect(s.text.trim()).not.toBe("");

      expect(s).toHaveProperty("wordCount");
      expect(typeof s.wordCount).toBe("number");
      expect(s.wordCount).toBeGreaterThan(0);
    }
  });

  // wordCount is a reference value (参考値 per spec); verify it's close
  it.each(files)(
    "%s wordCount is within 1 of actual text word count",
    (file) => {
      const data = loadJson(file);
      for (const s of data.sentences) {
        const actual = s.text.split(/\s+/).filter(Boolean).length;
        expect(Math.abs(s.wordCount - actual)).toBeLessThanOrEqual(1);
      }
    },
  );
});

import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const QUESTION_DIR = path.resolve(
  __dirname,
  "../../public/questions/toefl/reading/daily-life",
);

const VALID_QUESTION_TYPES = ["factual", "inference", "purpose", "vocabulary"];

// 必須仕様: 各テキスト15〜150語
const MIN_TEXT_WORDS = 15;
const MAX_TEXT_WORDS = 150;

interface DailyLifeQuestion {
  id: string;
  stem: string;
  options: string[];
  correctIndex: number;
  type: string;
  explanation: string;
}

interface DailyLifeText {
  id: string;
  textType: string;
  content: string;
  questions: DailyLifeQuestion[];
}

interface DailyLifeData {
  texts: DailyLifeText[];
}

function getQuestionFiles(): string[] {
  return fs
    .readdirSync(QUESTION_DIR)
    .filter((f) => f.endsWith(".json") && f !== "index.json")
    .sort();
}

function loadJson(file: string): DailyLifeData {
  const raw = fs.readFileSync(path.join(QUESTION_DIR, file), "utf-8");
  return JSON.parse(raw) as DailyLifeData;
}

describe("TOEFL Reading: Daily Life JSON structure", () => {
  const files = getQuestionFiles();

  it("has at least one question file", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files)("%s is valid JSON", (file) => {
    expect(() => loadJson(file)).not.toThrow();
  });

  it.each(files)("%s has required top-level shape", (file) => {
    const data = loadJson(file);
    expect(data).toHaveProperty("texts");
    expect(Array.isArray(data.texts)).toBe(true);
    // 1〜3 texts (schema says 2〜3, but "1〜2テキストの場合もある")
    expect(data.texts.length).toBeGreaterThanOrEqual(1);
    expect(data.texts.length).toBeLessThanOrEqual(3);
  });

  it.each(files)("%s texts have required fields", (file) => {
    const data = loadJson(file);
    for (const text of data.texts) {
      expect(text).toHaveProperty("id");
      expect(typeof text.id).toBe("string");
      expect(text.id.trim()).not.toBe("");

      expect(text).toHaveProperty("textType");
      expect(typeof text.textType).toBe("string");
      expect(text.textType.trim()).not.toBe("");

      expect(text).toHaveProperty("content");
      expect(typeof text.content).toBe("string");
      expect(text.content.trim()).not.toBe("");

      expect(text).toHaveProperty("questions");
      expect(Array.isArray(text.questions)).toBe(true);
      // schema says 2〜3 questions per text
      expect(text.questions.length).toBeGreaterThanOrEqual(2);
      expect(text.questions.length).toBeLessThanOrEqual(3);
    }
  });

  it.each(files)("%s questions have required fields", (file) => {
    const data = loadJson(file);
    for (const text of data.texts) {
      for (const q of text.questions) {
        expect(q).toHaveProperty("id");
        expect(typeof q.id).toBe("string");
        expect(q.id.trim()).not.toBe("");

        expect(q).toHaveProperty("stem");
        expect(typeof q.stem).toBe("string");
        expect(q.stem.trim()).not.toBe("");

        expect(q).toHaveProperty("options");
        expect(Array.isArray(q.options)).toBe(true);
        expect(q.options.length).toBe(4);
        for (const opt of q.options) {
          expect(typeof opt).toBe("string");
        }

        expect(q).toHaveProperty("correctIndex");
        expect(typeof q.correctIndex).toBe("number");
        expect(q.correctIndex).toBeGreaterThanOrEqual(0);
        expect(q.correctIndex).toBeLessThanOrEqual(3);

        expect(q).toHaveProperty("type");
        expect(typeof q.type).toBe("string");
        expect(VALID_QUESTION_TYPES).toContain(q.type);

        expect(q).toHaveProperty("explanation");
        expect(typeof q.explanation).toBe("string");
        expect(q.explanation.trim()).not.toBe("");
      }
    }
  });

  it.each(files)("%s has 4〜9 total questions", (file) => {
    const data = loadJson(file);
    const total = data.texts.reduce((sum, t) => sum + t.questions.length, 0);
    expect(total).toBeGreaterThanOrEqual(4);
    expect(total).toBeLessThanOrEqual(9);
  });

  it.each(files)("%s question IDs are unique within file", (file) => {
    const data = loadJson(file);
    const ids = data.texts.flatMap((t) => t.questions.map((q) => q.id));
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it.each(files)("%s text IDs are unique within file", (file) => {
    const data = loadJson(file);
    const ids = data.texts.map((t) => t.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  // ─── 単語数・設問数の範囲検証 ───

  it.each(files)(
    "%s each text is within word count range (15〜150 words)",
    (file) => {
      const data = loadJson(file);
      for (const text of data.texts) {
        const wordCount = text.content.split(/\s+/).filter(Boolean).length;
        expect(wordCount).toBeGreaterThanOrEqual(MIN_TEXT_WORDS);
        expect(wordCount).toBeLessThanOrEqual(MAX_TEXT_WORDS);
      }
    },
  );

  it.each(files)("%s each text has 2〜3 questions", (file) => {
    const data = loadJson(file);
    for (const text of data.texts) {
      expect(text.questions.length).toBeGreaterThanOrEqual(2);
      expect(text.questions.length).toBeLessThanOrEqual(3);
    }
  });

  it("all files combined have texts within word count range (15〜150 words)", () => {
    for (const file of files) {
      const data = loadJson(file);
      for (const text of data.texts) {
        const wordCount = text.content.split(/\s+/).filter(Boolean).length;
        expect(wordCount).toBeGreaterThanOrEqual(MIN_TEXT_WORDS);
        expect(wordCount).toBeLessThanOrEqual(MAX_TEXT_WORDS);
      }
    }
  });

  // ─── Question type distribution tests ───

  it.each(files)(
    "%s has at least one inference or purpose question",
    (file) => {
      const data = loadJson(file);
      const types = data.texts.flatMap((t) => t.questions.map((q) => q.type));
      expect(types).toEqual(expect.arrayContaining(["inference", "purpose"]));
    },
  );

  it.each(files)("%s uses at least 2 different question types", (file) => {
    const data = loadJson(file);
    const types = new Set(
      data.texts.flatMap((t) => t.questions.map((q) => q.type)),
    );
    expect(types.size).toBeGreaterThanOrEqual(2);
  });

  it("all 4 question types are used across all files combined", () => {
    const allTypes = new Set<string>();
    for (const file of files) {
      const data = loadJson(file);
      for (const text of data.texts) {
        for (const q of text.questions) {
          allTypes.add(q.type);
        }
      }
    }
    for (const expectedType of VALID_QUESTION_TYPES) {
      expect(allTypes).toContain(expectedType);
    }
  });

  it("each question type appears in at least half of the files", () => {
    const typeFileCount: Record<string, number> = {};
    for (const type of VALID_QUESTION_TYPES) {
      typeFileCount[type] = 0;
    }
    for (const file of files) {
      const data = loadJson(file);
      const fileTypes = new Set(
        data.texts.flatMap((t) => t.questions.map((q) => q.type)),
      );
      for (const type of VALID_QUESTION_TYPES) {
        if (fileTypes.has(type)) {
          typeFileCount[type]++;
        }
      }
    }
    const threshold = Math.ceil(files.length / 2);
    for (const type of VALID_QUESTION_TYPES) {
      expect(typeFileCount[type]).toBeGreaterThanOrEqual(threshold);
    }
  });
});

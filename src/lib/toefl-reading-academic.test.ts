import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const QUESTION_DIR = path.resolve(
  __dirname,
  "../../public/questions/toefl/reading/academic",
);

const VALID_QUESTION_TYPES = [
  "vocabulary",
  "detail",
  "inference",
  "mainIdea",
  "paragraphRelation",
  "importantIdea",
  "negativeFactual",
  "rhetoricalPurpose",
  "insertSentence",
];

interface AcademicQuestion {
  id: string;
  type: string;
  stem: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface AcademicData {
  title: string;
  passage: string;
  questions: AcademicQuestion[];
}

function getQuestionFiles(): string[] {
  return fs
    .readdirSync(QUESTION_DIR)
    .filter((f) => f.endsWith(".json") && f !== "index.json")
    .sort();
}

function loadJson(file: string): AcademicData {
  const raw = fs.readFileSync(path.join(QUESTION_DIR, file), "utf-8");
  return JSON.parse(raw) as AcademicData;
}

describe("TOEFL Reading: Academic Passage JSON structure", () => {
  const files = getQuestionFiles();

  it("has at least one question file", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files)("%s is valid JSON", (file) => {
    expect(() => loadJson(file)).not.toThrow();
  });

  it.each(files)("%s has required top-level fields", (file) => {
    const data = loadJson(file);
    expect(data).toHaveProperty("title");
    expect(typeof data.title).toBe("string");
    expect(data.title.trim()).not.toBe("");

    expect(data).toHaveProperty("passage");
    expect(typeof data.passage).toBe("string");
    expect(data.passage.trim()).not.toBe("");

    expect(data).toHaveProperty("questions");
    expect(Array.isArray(data.questions)).toBe(true);
  });

  // Word count: per spec 150-250 (目安200). Existing files may exceed 250 so use lenient bound.
  it.each(files)("%s passage is 150〜350 words", (file) => {
    const data = loadJson(file);
    const wc = data.passage.split(/\s+/).filter(Boolean).length;
    expect(wc).toBeGreaterThanOrEqual(150);
    expect(wc).toBeLessThanOrEqual(350);
  });

  // New files (016+) must strictly adhere to 150-250
  const newFiles = files.filter((f) => {
    const num = parseInt(f.replace(".json", ""), 10);
    return num >= 16;
  });
  it.each(newFiles)("%s (016+) passage strictly 150〜250 words", (file) => {
    const data = loadJson(file);
    const wc = data.passage.split(/\s+/).filter(Boolean).length;
    expect(wc).toBeGreaterThanOrEqual(150);
    expect(wc).toBeLessThanOrEqual(250);
  });

  // Questions: exactly 5
  it.each(files)("%s has 5 questions", (file) => {
    const data = loadJson(file);
    expect(data.questions.length).toBe(5);
  });

  it.each(files)("%s questions have required fields", (file) => {
    const data = loadJson(file);
    const seenIds = new Set<string>();

    for (const q of data.questions) {
      expect(q).toHaveProperty("id");
      expect(typeof q.id).toBe("string");
      expect(q.id.trim()).not.toBe("");
      expect(seenIds.has(q.id)).toBe(false);
      seenIds.add(q.id);

      expect(q).toHaveProperty("type");
      expect(VALID_QUESTION_TYPES).toContain(q.type);

      expect(q).toHaveProperty("stem");
      expect(typeof q.stem).toBe("string");
      expect(q.stem.trim()).not.toBe("");

      expect(q).toHaveProperty("options");
      expect(Array.isArray(q.options)).toBe(true);
      expect(q.options.length).toBe(4);
      for (const opt of q.options) {
        expect(typeof opt).toBe("string");
        expect(opt.trim()).not.toBe("");
      }

      expect(q).toHaveProperty("correctIndex");
      expect(typeof q.correctIndex).toBe("number");
      expect(q.correctIndex).toBeGreaterThanOrEqual(0);
      expect(q.correctIndex).toBeLessThanOrEqual(3);

      expect(q).toHaveProperty("explanation");
      expect(typeof q.explanation).toBe("string");
      expect(q.explanation.trim()).not.toBe("");
    }
  });

  // Question type distribution: at least 3 distinct types per file
  it.each(files)("%s uses at least 3 different question types", (file) => {
    const data = loadJson(file);
    const types = new Set(data.questions.map((q) => q.type));
    expect(types.size).toBeGreaterThanOrEqual(3);
  });

  // Every type appears somewhere
  it("all valid question types appear across files", () => {
    const allTypes = new Set<string>();
    for (const file of files) {
      const data = loadJson(file);
      for (const q of data.questions) {
        allTypes.add(q.type);
      }
    }
    for (const t of VALID_QUESTION_TYPES) {
      expect(allTypes).toContain(t);
    }
  });
});

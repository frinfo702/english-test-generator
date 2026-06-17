import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const QUESTION_DIR = path.resolve(
  __dirname,
  "../../public/questions/toefl/speaking/interview",
);

const VALID_QUESTION_TYPES = [
  "personal",
  "opinion",
  "hypothetical",
  "comparison",
];

interface InterviewQuestion {
  id: string;
  type: string;
  question: string;
  modelAnswer: string;
  evaluationPoints: string[];
}

interface InterviewData {
  questions: InterviewQuestion[];
}

function getQuestionFiles(): string[] {
  return fs
    .readdirSync(QUESTION_DIR)
    .filter((f) => f.endsWith(".json") && f !== "index.json")
    .sort();
}

function loadJson(file: string): InterviewData {
  const raw = fs.readFileSync(path.join(QUESTION_DIR, file), "utf-8");
  return JSON.parse(raw) as InterviewData;
}

describe("TOEFL Speaking: Take an Interview JSON structure", () => {
  const files = getQuestionFiles();

  it("has at least one file", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files)("%s is valid JSON", (file) => {
    expect(() => loadJson(file)).not.toThrow();
  });

  it.each(files)("%s has questions field", (file) => {
    const data = loadJson(file);
    expect(data).toHaveProperty("questions");
    expect(Array.isArray(data.questions)).toBe(true);
  });

  // 4 questions fixed
  it.each(files)("%s has exactly 4 questions", (file) => {
    const data = loadJson(file);
    expect(data.questions.length).toBe(4);
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

      expect(q).toHaveProperty("question");
      expect(typeof q.question).toBe("string");
      expect(q.question.trim()).not.toBe("");

      expect(q).toHaveProperty("modelAnswer");
      expect(typeof q.modelAnswer).toBe("string");
      expect(q.modelAnswer.trim()).not.toBe("");

      expect(q).toHaveProperty("evaluationPoints");
      expect(Array.isArray(q.evaluationPoints)).toBe(true);
      expect(q.evaluationPoints.length).toBeGreaterThanOrEqual(2);
      for (const pt of q.evaluationPoints) {
        expect(typeof pt).toBe("string");
        expect(pt.trim()).not.toBe("");
      }
    }
  });

  // All 4 types should appear once per file
  it.each(files)("%s contains all 4 question types", (file) => {
    const data = loadJson(file);
    const types = data.questions.map((q) => q.type);
    for (const t of VALID_QUESTION_TYPES) {
      expect(types).toContain(t);
    }
  });

  // Each type appears exactly once per file
  it.each(files)("%s has each type exactly once", (file) => {
    const data = loadJson(file);
    const types = data.questions.map((q) => q.type);
    for (const t of VALID_QUESTION_TYPES) {
      expect(types.filter((x) => x === t).length).toBe(1);
    }
  });
});

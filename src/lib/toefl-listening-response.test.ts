import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const QUESTION_DIR = path.resolve(
  __dirname,
  "../../public/questions/toefl/listening/response",
);

interface ResponseQuestion {
  id: string;
  context: string;
  stem: string;
  options: Record<string, string>;
  correct: string;
  explanation: string;
}

interface AudioSegment {
  role: string;
  text: string;
}

interface ResponseData {
  title: string;
  questions: ResponseQuestion[];
  audioSegments: AudioSegment[];
}

function getQuestionFiles(): string[] {
  return fs
    .readdirSync(QUESTION_DIR)
    .filter((f) => f.endsWith(".json") && f !== "index.json")
    .sort();
}

function loadJson(file: string): ResponseData {
  const raw = fs.readFileSync(path.join(QUESTION_DIR, file), "utf-8");
  return JSON.parse(raw) as ResponseData;
}

describe("TOEFL Listening: Choose a Response JSON structure", () => {
  const files = getQuestionFiles();

  it("has at least one file", () => {
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
    expect(data).toHaveProperty("questions");
    expect(Array.isArray(data.questions)).toBe(true);
    expect(data.questions.length).toBeGreaterThan(0);
    expect(data).toHaveProperty("audioSegments");
    expect(Array.isArray(data.audioSegments)).toBe(true);
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

      expect(q).toHaveProperty("context");
      expect(typeof q.context).toBe("string");
      expect(q.context.trim()).not.toBe("");

      expect(q).toHaveProperty("stem");
      expect(typeof q.stem).toBe("string");
      expect(q.stem.trim()).not.toBe("");

      expect(q).toHaveProperty("options");
      expect(typeof q.options).toBe("object");
      const keys = Object.keys(q.options);
      expect(keys.length).toBe(3);
      expect(keys).toEqual(["A", "B", "C"]);
      for (const key of keys) {
        expect(typeof q.options[key]).toBe("string");
        expect(q.options[key].trim()).not.toBe("");
      }

      expect(q).toHaveProperty("correct");
      expect(["A", "B", "C"]).toContain(q.correct);

      expect(q).toHaveProperty("explanation");
      expect(typeof q.explanation).toBe("string");
      expect(q.explanation.trim()).not.toBe("");
    }
  });

  // Each question should have a matching audio segment
  it.each(files)("%s has matching audio for each question", (file) => {
    const data = loadJson(file);
    expect(data.questions.length).toBeGreaterThanOrEqual(1);
    // audioSegments should have at least as many entries as questions
    // (some files may have fewer if audio hasn't been generated yet)
    expect(data.audioSegments.length).toBeGreaterThanOrEqual(
      data.questions.length,
    );
  });

  it.each(files)("%s audio segments have role and text", (file) => {
    const data = loadJson(file);
    for (const seg of data.audioSegments) {
      expect(seg).toHaveProperty("role");
      expect(typeof seg.role).toBe("string");
      expect(seg.role.trim()).not.toBe("");
      expect(seg).toHaveProperty("text");
      expect(typeof seg.text).toBe("string");
      expect(seg.text.trim()).not.toBe("");
    }
  });
});

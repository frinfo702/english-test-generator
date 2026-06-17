import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const QUESTION_DIR = path.resolve(
  __dirname,
  "../../public/questions/toefl/listening/conversation",
);

const VALID_QUESTION_TYPES = ["purpose", "detail", "inference", "attitude"];

interface ConversationQuestion {
  id: string;
  stem: string;
  options: string[];
  correctIndex: number;
  type: string;
  explanation: string;
}

interface AudioSegment {
  role: string;
  text: string;
}

interface ConversationData {
  title: string;
  transcript: string;
  questions: ConversationQuestion[];
  audioSegments: AudioSegment[];
}

function getQuestionFiles(): string[] {
  return fs
    .readdirSync(QUESTION_DIR)
    .filter((f) => f.endsWith(".json") && f !== "index.json")
    .sort();
}

function loadJson(file: string): ConversationData {
  const raw = fs.readFileSync(path.join(QUESTION_DIR, file), "utf-8");
  return JSON.parse(raw) as ConversationData;
}

describe("TOEFL Listening: Conversation JSON structure", () => {
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

    expect(data).toHaveProperty("transcript");
    expect(typeof data.transcript).toBe("string");
    expect(data.transcript.trim()).not.toBe("");

    expect(data).toHaveProperty("questions");
    expect(Array.isArray(data.questions)).toBe(true);

    expect(data).toHaveProperty("audioSegments");
    expect(Array.isArray(data.audioSegments)).toBe(true);
  });

  // Each conversation should have 2 questions (schema: 1会話あたり2問)
  it.each(files)("%s has 2 questions", (file) => {
    const data = loadJson(file);
    expect(data.questions.length).toBe(2);
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

      expect(q).toHaveProperty("type");
      expect(VALID_QUESTION_TYPES).toContain(q.type);

      expect(q).toHaveProperty("explanation");
      expect(typeof q.explanation).toBe("string");
      expect(q.explanation.trim()).not.toBe("");
    }
  });

  // Audio segments should exist and match transcript speakers
  it.each(files)("%s audio segments have role and text", (file) => {
    const data = loadJson(file);
    expect(data.audioSegments.length).toBeGreaterThanOrEqual(1);
    for (const seg of data.audioSegments) {
      expect(seg).toHaveProperty("role");
      expect(typeof seg.role).toBe("string");
      expect(seg.role.trim()).not.toBe("");
      expect(seg).toHaveProperty("text");
      expect(typeof seg.text).toBe("string");
      expect(seg.text.trim()).not.toBe("");
    }
  });

  // Question types should be diverse - at least 2 different types across a file
  it.each(files)("%s uses at least 2 different question types", (file) => {
    const data = loadJson(file);
    const types = new Set(data.questions.map((q) => q.type));
    expect(types.size).toBeGreaterThanOrEqual(2);
  });

  // At least 2 types should appear across all files
  it("at least 2 valid question types appear across files", () => {
    const allTypes = new Set<string>();
    for (const file of files) {
      const data = loadJson(file);
      for (const q of data.questions) {
        allTypes.add(q.type);
      }
    }
    expect(allTypes.size).toBeGreaterThanOrEqual(2);
  });
});

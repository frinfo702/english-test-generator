import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const QUESTION_DIR = path.resolve(
  __dirname,
  "../../public/questions/toefl/listening/announcement",
);

const VALID_QUESTION_TYPES = ["detail", "inference", "vocabulary", "purpose"];

interface AnnouncementQuestion {
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

interface AnnouncementData {
  title: string;
  transcript: string;
  questions: AnnouncementQuestion[];
  audioSegments: AudioSegment[];
}

function getQuestionFiles(): string[] {
  return fs
    .readdirSync(QUESTION_DIR)
    .filter((f) => f.endsWith(".json") && f !== "index.json")
    .sort();
}

function loadJson(file: string): AnnouncementData {
  const raw = fs.readFileSync(path.join(QUESTION_DIR, file), "utf-8");
  return JSON.parse(raw) as AnnouncementData;
}

describe("TOEFL Listening: Announcement JSON structure", () => {
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

  // Each announcement should have 2-3 questions
  it.each(files)("%s has 2〜3 questions", (file) => {
    const data = loadJson(file);
    expect(data.questions.length).toBeGreaterThanOrEqual(2);
    expect(data.questions.length).toBeLessThanOrEqual(3);
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

  // Audio should have Speaker role
  it.each(files)("%s audio segments have Speaker role", (file) => {
    const data = loadJson(file);
    expect(data.audioSegments.length).toBeGreaterThanOrEqual(1);
    for (const seg of data.audioSegments) {
      expect(seg).toHaveProperty("role");
      expect(seg.role).toBe("Speaker");
      expect(seg).toHaveProperty("text");
      expect(typeof seg.text).toBe("string");
      expect(seg.text.trim()).not.toBe("");
    }
  });
});

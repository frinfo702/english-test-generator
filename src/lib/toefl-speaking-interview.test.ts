import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  INTERVIEW_QUESTION_TYPES,
  interviewAudioUrl,
  interviewChrome,
  interviewScenarioAudioUrl,
  isScenarioStep,
  phasePrompt,
} from "../pages/toefl/speaking/interviewTypes";

const QUESTION_DIR = path.resolve(
  __dirname,
  "../../public/questions/toefl/speaking/interview",
);

interface InterviewQuestion {
  id: string;
  type: string;
  question: string;
  modelAnswer: string;
  evaluationPoints: string[];
}

interface InterviewData {
  scenario: string;
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

  it.each(files)("%s has research-study scenario", (file) => {
    const data = loadJson(file);
    expect(data).toHaveProperty("scenario");
    expect(typeof data.scenario).toBe("string");
    expect(data.scenario.trim()).not.toBe("");
    expect(data.scenario.toLowerCase()).toContain("research study");
    expect(data.scenario.toLowerCase()).toContain("interview");
  });

  it.each(files)("%s has questions field", (file) => {
    const data = loadJson(file);
    expect(data).toHaveProperty("questions");
    expect(Array.isArray(data.questions)).toBe(true);
  });

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
      expect(INTERVIEW_QUESTION_TYPES).toContain(q.type);

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

  it.each(files)("%s follows real-test question type order", (file) => {
    const data = loadJson(file);
    const types = data.questions.map((q) => q.type);
    expect(types).toEqual([...INTERVIEW_QUESTION_TYPES]);
  });

  it.each(files)("%s questions sound like interviewer speech", (file) => {
    const data = loadJson(file);
    const [q1, q2, , q4] = data.questions;

    expect(q1.question.toLowerCase()).toMatch(
      /thank you for your participation|i'd like to ask|i would like to ask/,
    );
    expect(q2.question.length).toBeGreaterThan(20);
    expect(q4.question.toLowerCase()).toMatch(
      /one more question|do you agree|some people believe/,
    );
  });
});

describe("interviewTypes helpers", () => {
  it("builds scenario and question audio urls", () => {
    expect(interviewScenarioAudioUrl("001")).toBe(
      "/audio/toefl/speaking/interview/001/scenario.mp3",
    );
    expect(interviewAudioUrl("001", 0, "question")).toBe(
      "/audio/toefl/speaking/interview/001/1.mp3",
    );
    expect(interviewAudioUrl("001", 2, "model")).toBe(
      "/audio/toefl/speaking/interview/001/3-model.mp3",
    );
  });

  it("treats only Q1 pre/scenario as the scenario step", () => {
    expect(isScenarioStep("pre", 0, true)).toBe(true);
    expect(isScenarioStep("scenario", 0, true)).toBe(true);
    expect(isScenarioStep("listening", 0, true)).toBe(false);
    expect(isScenarioStep("pre", 1, true)).toBe(false);
    expect(isScenarioStep("pre", 0, false)).toBe(false);
  });

  it("labels chrome as Scenario during the scenario step", () => {
    expect(interviewChrome("scenario", 0, 4, "opening", true)).toEqual({
      tag: "Scenario",
      position: "Scenario",
    });
    expect(interviewChrome("listening", 0, 4, "opening", true)).toEqual({
      tag: "Opening",
      position: "Question 1 / 4",
    });
  });

  it("uses scenario-specific phase prompt", () => {
    expect(phasePrompt("scenario")).toBe("Listening to the scenario…");
    expect(phasePrompt("listening")).toBe("Listening to the question…");
  });
});

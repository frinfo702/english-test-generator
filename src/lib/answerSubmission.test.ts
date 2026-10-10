import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildDraftKey,
  buildGradingMessage,
  buildInterviewQaCopyMessage,
  buildProblemId,
  buildWritingCopyMessage,
  clearDraft,
  copyText,
  loadDraft,
  saveDraft,
  writingCriteria,
} from "./answerSubmission";

describe("answerSubmission", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-01T10:00:00.000Z"));
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("builds problem identifiers from task, file, and sub-question", () => {
    expect(buildProblemId("toeic/part5", "002.json")).toBe("toeic/part5/002");
    expect(buildProblemId("toeic/part5", "002.JSON", "q3")).toBe(
      "toeic/part5/002#q3",
    );
    expect(buildDraftKey("toeic/part5/002#q3")).toBe(
      "answer-draft:toeic/part5/002#q3",
    );
  });

  it("saves, loads, and clears drafts", () => {
    const problemId = "toefl/writing/email/001";

    saveDraft(problemId, "Draft response");
    expect(loadDraft(problemId)).toBe("Draft response");

    clearDraft(problemId);
    expect(loadDraft(problemId)).toBe("");
  });

  it("removes whitespace-only drafts", () => {
    const problemId = "toefl/writing/email/002";

    saveDraft(problemId, "Saved");
    saveDraft(problemId, "   \n  ");

    expect(localStorage.getItem(buildDraftKey(problemId))).toBeNull();
  });

  it("builds grading prompts and copies text when clipboard is available", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    const message = buildGradingMessage("toeic/part5/001", "ans-1");
    expect(message).toBe(
      "I completed problem toeic/part5/001. My answer ID is ans-1. Please grade it.",
    );

    await expect(copyText(message)).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith(message);
  });

  it("returns false when clipboard support is unavailable", async () => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: undefined,
    });

    await expect(copyText("hello")).resolves.toBe(false);
  });

  it("builds interview Q&A copy text for external LLM feedback", () => {
    const message = buildInterviewQaCopyMessage({
      question: "Do you prefer studying alone?",
      userAnswer: "I prefer studying alone because I can focus better.",
      modelAnswer: "While both approaches have merit...",
      evaluationPoints: ["States a clear position", "Gives a reason"],
      questionType: "Comparison / Choice",
    });

    expect(message).toContain("## Question");
    expect(message).toContain("Do you prefer studying alone?");
    expect(message).toContain("## My spoken answer (automatic transcript)");
    expect(message).toContain("I prefer studying alone");
    expect(message).toContain("## Sample answer");
    expect(message).toContain("## Evaluation criteria");
    expect(message).toContain("States a clear position");
    expect(message).toContain("Please evaluate my TOEFL Speaking");
    expect(message).toContain("```toefl-score");
    expect(message).toContain('{"languageUse": 0, "organization": 0}');
  });

  it("numbers the writing criteria and asks for one rating per point", () => {
    const message = buildWritingCopyMessage({
      task: "Write an Email",
      prompt: "Task",
      userAnswer: "Answer",
      criteria: ["Task completion: covers both", "Language use: grammar"],
    });

    expect(message).toContain("1. Task completion: covers both");
    expect(message).toContain("2. Language use: grammar");
    expect(message).toContain(
      '{"criteria": [{"points": 0, "note": "..."}, {"points": 0, "note": "..."}], "score": 0}',
    );
  });

  it("reads the rubric points of each writing task", () => {
    expect(
      writingCriteria("toefl/writing/email", {
        rubric: [{ criterion: "Task completion", description: "Covers it." }],
      }),
    ).toEqual([{ name: "Task completion", detail: "Covers it." }]);
    expect(
      writingCriteria("toefl/writing/discussion", {
        evaluationPoints: ["States a position"],
      }),
    ).toEqual([{ name: "States a position" }]);
  });
});

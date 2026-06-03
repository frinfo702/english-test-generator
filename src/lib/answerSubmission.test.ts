import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildDraftKey,
  buildGradingMessage,
  buildProblemId,
  clearDraft,
  copyText,
  getAllAnswers,
  loadDraft,
  saveAnswerSubmission,
  saveDraft,
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

  it("stores answer history and returns newest answers first", async () => {
    await saveAnswerSubmission({
      taskId: "toeic/part5",
      problemId: "toeic/part5/001",
      response: "First",
    });
    vi.advanceTimersByTime(1500);
    await saveAnswerSubmission({
      taskId: "toeic/part5",
      problemId: "toeic/part5/002",
      response: "Second",
    });

    expect(getAllAnswers()).toEqual([
      {
        answerId: "ans-1772359201500",
        taskId: "toeic/part5",
        problemId: "toeic/part5/002",
        response: "Second",
        date: "2026-03-01T10:00:01.500Z",
      },
      {
        answerId: "ans-1772359200000",
        taskId: "toeic/part5",
        problemId: "toeic/part5/001",
        response: "First",
        date: "2026-03-01T10:00:00.000Z",
      },
    ]);
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
});

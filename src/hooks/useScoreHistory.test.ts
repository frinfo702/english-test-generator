import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useScoreHistory } from "./useScoreHistory";
import {
  clearAttempts,
  getAllAttempts,
  saveAttempt,
  type Attempt,
} from "../lib/attempts";

vi.mock("../lib/attempts", () => ({
  saveAttempt: vi.fn(),
  getAllAttempts: vi.fn(),
  clearAttempts: vi.fn(),
}));

describe("useScoreHistory", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("does not save when total is zero", async () => {
    const { result } = renderHook(() => useScoreHistory());

    await act(async () => {
      await result.current.saveScore({
        taskId: "toeic/part5",
        correct: 0,
        total: 0,
        elapsedSeconds: 12,
        responses: [],
      });
    });

    expect(saveAttempt).not.toHaveBeenCalled();
  });

  it("saves the responses with the score they earned", async () => {
    const { result } = renderHook(() => useScoreHistory());

    await act(async () => {
      await result.current.saveScore({
        taskId: "toeic/part5",
        file: "002.json",
        correct: 7,
        total: 9,
        elapsedSeconds: 12.8,
        responses: [{ itemId: "q1", choice: "C" }],
      });
    });

    expect(saveAttempt).toHaveBeenCalledWith({
      taskId: "toeic/part5",
      problemId: "002",
      elapsedSeconds: 12,
      responses: [{ itemId: "q1", choice: "C" }],
      score: { method: "answer-key", correct: 7, total: 9 },
    });
  });

  it("lists graded attempts as score entries", async () => {
    const graded: Attempt = {
      id: "a",
      taskId: "toeic/part6",
      problemId: "20261007-memo",
      date: "2026-02-18T00:00:00.000Z",
      elapsedSeconds: 90,
      responses: [],
      score: { method: "answer-key", correct: 4, total: 5 },
    };
    const ungraded: Attempt = {
      id: "b",
      taskId: "toefl/writing/email",
      date: "2026-02-19T00:00:00.000Z",
      responses: [{ text: "Hi" }],
    };
    vi.mocked(getAllAttempts).mockResolvedValue([graded, ungraded]);

    const { result } = renderHook(() => useScoreHistory());
    let entries = [] as unknown[];
    await act(async () => {
      entries = await result.current.getAll();
    });

    expect(entries).toEqual([
      {
        taskId: "toeic/part6",
        date: "2026-02-18T00:00:00.000Z",
        correct: 4,
        total: 5,
        pct: 80,
        elapsedSeconds: 90,
        problemId: "20261007-memo",
      },
    ]);
  });

  it("clears all attempts", async () => {
    const { result } = renderHook(() => useScoreHistory());

    await act(async () => {
      await result.current.clearAll();
    });

    expect(clearAttempts).toHaveBeenCalled();
  });
});

import { describe, expect, it } from "vitest";
import type { ScoreEntry, TaskId } from "../hooks/useScoreHistory";
import { pickFocusTask } from "./focusTask";

const runs = (taskId: TaskId, pcts: number[]): ScoreEntry[] =>
  pcts.map((pct, i) => ({
    taskId,
    date: `2026-10-${String(i + 1).padStart(2, "0")}`,
    correct: pct / 10,
    total: 10,
    pct,
  }));

describe("pickFocusTask", () => {
  it("picks the task with the lowest recent average", () => {
    expect(
      pickFocusTask({
        "toeic/part5": runs("toeic/part5", [80, 80, 80]),
        "toeic/part7": runs("toeic/part7", [50, 60, 60]),
      }),
    ).toBe("toeic/part7");
  });

  it("ignores runs older than the last five", () => {
    expect(
      pickFocusTask({
        "toeic/part5": runs("toeic/part5", [0, 0, 0, 70, 70, 70, 70, 70]),
        "toeic/part7": runs("toeic/part7", [60, 60, 60]),
      }),
    ).toBe("toeic/part7");
  });

  it("skips tasks with under three runs and returns null when all are strong", () => {
    expect(
      pickFocusTask({ "toeic/part5": runs("toeic/part5", [10, 10]) }),
    ).toBe(null);
    expect(
      pickFocusTask({ "toeic/part5": runs("toeic/part5", [90, 90, 90]) }),
    ).toBe(null);
  });
});

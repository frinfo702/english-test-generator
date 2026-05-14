import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useScoreHistory } from "./useScoreHistory";

const STORAGE_KEY = "score-history";

describe("useScoreHistory", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-18T00:00:00.000Z"));
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it("does not post when total is zero", async () => {
    const { result } = renderHook(() => useScoreHistory());

    await act(async () => {
      await result.current.saveScore("toeic/part5", 0, 0, 12);
    });

    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("saves normalized score entry", async () => {
    const { result } = renderHook(() => useScoreHistory());

    await act(async () => {
      await result.current.saveScore("toeic/part5", 7, 9, 12.8, "002.json");
    });

    const raw = localStorage.getItem(STORAGE_KEY);
    expect(raw).not.toBeNull();
    const entries = JSON.parse(raw!);
    expect(entries).toHaveLength(1);
    expect(entries[0]).toEqual({
      taskId: "toeic/part5",
      date: "2026-02-18T00:00:00.000Z",
      correct: 7,
      total: 9,
      pct: 78,
      elapsedSeconds: 12,
      questionFile: "002.json",
    });
  });

  it("gets all entries", async () => {
    const expected = [
      {
        taskId: "toeic/part6",
        date: "2026-02-18T00:00:00.000Z",
        correct: 4,
        total: 5,
        pct: 80,
      },
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expected));

    const { result } = renderHook(() => useScoreHistory());

    let entries = [] as unknown[];
    await act(async () => {
      entries = await result.current.getAll();
    });

    expect(entries).toEqual(expected);
  });

  it("clears all entries", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([{ taskId: "test" }]));
    const { result } = renderHook(() => useScoreHistory());

    await act(async () => {
      await result.current.clearAll();
    });

    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});

import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useQuestion } from "./useQuestion";
import {
  fetchQuestionByFileWithMeta,
  fetchQuestionByNumberWithMeta,
  fetchRandomQuestionWithMeta,
} from "../lib/questions";

vi.mock("../lib/questions", () => ({
  fetchQuestionByFileWithMeta: vi.fn(),
  fetchQuestionByNumberWithMeta: vi.fn(),
  fetchRandomQuestionWithMeta: vi.fn(),
}));

describe("useQuestion", () => {
  beforeEach(() => {
    vi.mocked(fetchRandomQuestionWithMeta).mockReset();
    vi.mocked(fetchQuestionByFileWithMeta).mockReset();
    vi.mocked(fetchQuestionByNumberWithMeta).mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads a random question with its source file", async () => {
    vi.mocked(fetchRandomQuestionWithMeta).mockResolvedValue({
      file: "002.json",
      data: { id: "q2" },
    });

    const { result } = renderHook(() => useQuestion<{ id: string }>("toeic/part5"));

    await act(async () => {
      await result.current.load();
    });

    expect(fetchRandomQuestionWithMeta).toHaveBeenCalledWith("toeic/part5");
    expect(result.current.data).toEqual({ id: "q2" });
    expect(result.current.file).toBe("002.json");
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it("loads a specific file", async () => {
    vi.mocked(fetchQuestionByFileWithMeta).mockResolvedValue({
      file: "010.json",
      data: { id: "q10" },
    });

    const { result } = renderHook(() => useQuestion<{ id: string }>("toeic/part5"));

    await act(async () => {
      await result.current.loadByFile("010.json");
    });

    expect(fetchQuestionByFileWithMeta).toHaveBeenCalledWith(
      "toeic/part5",
      "010.json",
    );
    expect(result.current.data).toEqual({ id: "q10" });
    expect(result.current.file).toBe("010.json");
  });

  it("clears stale question state when a later load fails", async () => {
    vi.mocked(fetchRandomQuestionWithMeta).mockResolvedValue({
      file: "001.json",
      data: { id: "q1" },
    });
    vi.mocked(fetchQuestionByNumberWithMeta).mockRejectedValue(new Error("boom"));

    const { result } = renderHook(() => useQuestion<{ id: string }>("toeic/part5"));

    await act(async () => {
      await result.current.load();
    });

    expect(result.current.data).toEqual({ id: "q1" });
    expect(result.current.file).toBe("001.json");

    await act(async () => {
      await result.current.loadByQuestionNumber(2);
    });

    expect(fetchQuestionByNumberWithMeta).toHaveBeenCalledWith("toeic/part5", 2);
    expect(result.current.error).toBe("boom");
    expect(result.current.data).toBeNull();
    expect(result.current.file).toBeNull();
    expect(result.current.loading).toBe(false);
  });
});

import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useScoreHistory } from "./useScoreHistory";

const fetchMock = vi.fn();

function mockResponse(body: unknown): Response {
  return {
    ok: true,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response;
}

describe("useScoreHistory", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-18T00:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("does not post when total is zero", async () => {
    const { result } = renderHook(() => useScoreHistory());

    await act(async () => {
      await result.current.saveScore("toeic/part5", 0, 0, 12);
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("posts normalized score entry", async () => {
    const { result } = renderHook(() => useScoreHistory());
    fetchMock.mockResolvedValue(mockResponse({}));

    await act(async () => {
      await result.current.saveScore("toeic/part5", 7, 9, 12.8);
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/scores",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
    );

    const request = fetchMock.mock.calls[0][1] as RequestInit;
    const body = JSON.parse(String(request.body));
    expect(body).toEqual({
      taskId: "toeic/part5",
      date: "2026-02-18T00:00:00.000Z",
      correct: 7,
      total: 9,
      pct: 78,
      elapsedSeconds: 12,
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
    fetchMock.mockResolvedValue(mockResponse(expected));
    const { result } = renderHook(() => useScoreHistory());

    let entries = [] as unknown[];
    await act(async () => {
      entries = await result.current.getAll();
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/scores");
    expect(entries).toEqual(expected);
  });

  it("clears all entries", async () => {
    fetchMock.mockResolvedValue(mockResponse({}));
    const { result } = renderHook(() => useScoreHistory());

    await act(async () => {
      await result.current.clearAll();
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/scores", { method: "DELETE" });
  });
});

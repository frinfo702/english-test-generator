import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useElapsedTimer } from "./useElapsedTimer";

describe("useElapsedTimer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-18T00:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts at 00:00 and increments in seconds", () => {
    const { result } = renderHook(() => useElapsedTimer());
    expect(result.current.display).toBe("00:00");

    act(() => {
      result.current.start();
      vi.advanceTimersByTime(2200);
    });

    expect(result.current.elapsedSeconds).toBe(2);
    expect(result.current.display).toBe("00:02");
  });

  it("stops on demand and does not keep counting", () => {
    const { result } = renderHook(() => useElapsedTimer());

    act(() => {
      result.current.start();
      vi.advanceTimersByTime(4100);
    });

    let stoppedAt = 0;
    act(() => {
      stoppedAt = result.current.stop();
    });
    expect(stoppedAt).toBe(4);
    expect(result.current.elapsedSeconds).toBe(4);

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.elapsedSeconds).toBe(4);
    expect(result.current.running).toBe(false);
  });

  it("resets to zero", () => {
    const { result } = renderHook(() => useElapsedTimer());

    act(() => {
      result.current.start();
      vi.advanceTimersByTime(3000);
      result.current.stop();
      result.current.reset();
    });

    expect(result.current.elapsedSeconds).toBe(0);
    expect(result.current.display).toBe("00:00");
    expect(result.current.running).toBe(false);
  });
});

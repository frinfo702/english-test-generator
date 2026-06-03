import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useTimer } from "./useTimer";

describe("useTimer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("counts down, exposes derived flags, and fires onExpire once", () => {
    const onExpire = vi.fn();
    const { result } = renderHook(() => useTimer(3, onExpire));

    act(() => {
      result.current.start();
    });

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.seconds).toBe(2);
    expect(result.current.display).toBe("00:02");
    expect(result.current.isWarning).toBe(true);
    expect(result.current.isExpired).toBe(false);
    expect(result.current.running).toBe(true);

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.seconds).toBe(0);
    expect(result.current.display).toBe("00:00");
    expect(result.current.isExpired).toBe(true);
    expect(result.current.running).toBe(false);
    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it("stops and resets cleanly", () => {
    const { result } = renderHook(() => useTimer(65));

    act(() => {
      result.current.start();
    });

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    act(() => {
      result.current.stop();
    });

    expect(result.current.seconds).toBe(60);
    expect(result.current.isWarning).toBe(true);
    expect(result.current.running).toBe(false);

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.seconds).toBe(60);

    act(() => {
      result.current.reset();
    });

    expect(result.current.seconds).toBe(65);
    expect(result.current.display).toBe("01:05");
    expect(result.current.running).toBe(false);
  });
});

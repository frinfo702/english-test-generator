import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useAdaptive } from "./useAdaptive";

describe("useAdaptive", () => {
  it("branches to hard module at 70% in module1", () => {
    const { result } = renderHook(() => useAdaptive());

    act(() => {
      for (let i = 0; i < 7; i += 1) {
        result.current.recordModule1Answer(true);
      }
      for (let i = 0; i < 3; i += 1) {
        result.current.recordModule1Answer(false);
      }
      result.current.finishModule1();
    });

    expect(result.current.module1Pct).toBe(70);
    expect(result.current.state.phase).toBe("branching");
    expect(result.current.state.module).toBe("module2Hard");
  });

  it("branches to easy module below 70% in module1", () => {
    const { result } = renderHook(() => useAdaptive());

    act(() => {
      result.current.recordModule1Answer(true);
      result.current.recordModule1Answer(false);
      result.current.recordModule1Answer(false);
      result.current.finishModule1();
    });

    expect(result.current.module1Pct).toBe(33);
    expect(result.current.state.module).toBe("module2Easy");
  });

  it("computes hard-band score from total percentage", () => {
    const { result } = renderHook(() => useAdaptive());

    act(() => {
      for (let i = 0; i < 9; i += 1) {
        result.current.recordModule1Answer(true);
      }
      result.current.recordModule1Answer(false);
      result.current.finishModule1();
      result.current.startModule2();
      for (let i = 0; i < 9; i += 1) {
        result.current.recordModule2Answer(true);
      }
      result.current.recordModule2Answer(false);
      result.current.finishModule2();
    });

    expect(result.current.state.phase).toBe("complete");
    expect(result.current.totalCorrect).toBe(18);
    expect(result.current.totalQuestions).toBe(20);
    expect(result.current.totalPct).toBe(90);
    expect(result.current.getBandScore()).toBe("5.5〜6.0");
  });

  it("resets all counters and phase", () => {
    const { result } = renderHook(() => useAdaptive());

    act(() => {
      result.current.recordModule1Answer(true);
      result.current.finishModule1();
      result.current.startModule2();
      result.current.recordModule2Answer(true);
      result.current.reset();
    });

    expect(result.current.state.phase).toBe("module1");
    expect(result.current.state.module).toBe("module1");
    expect(result.current.totalCorrect).toBe(0);
    expect(result.current.totalQuestions).toBe(0);
    expect(result.current.totalPct).toBe(0);
  });
});

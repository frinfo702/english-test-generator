import { useState, useCallback } from "react";

export type AdaptiveModule = "module1" | "module2Hard" | "module2Easy";
export type AdaptivePhase = "module1" | "branching" | "module2" | "complete";

interface AdaptiveState {
  phase: AdaptivePhase;
  module: AdaptiveModule;
  module1Correct: number;
  module1Total: number;
  module2Correct: number;
  module2Total: number;
}

export function useAdaptive() {
  const [state, setState] = useState<AdaptiveState>({
    phase: "module1",
    module: "module1",
    module1Correct: 0,
    module1Total: 0,
    module2Correct: 0,
    module2Total: 0,
  });

  const recordModule1Answer = useCallback((correct: boolean) => {
    setState((s) => ({
      ...s,
      module1Correct: s.module1Correct + (correct ? 1 : 0),
      module1Total: s.module1Total + 1,
    }));
  }, []);

  const recordModule2Answer = useCallback((correct: boolean) => {
    setState((s) => ({
      ...s,
      module2Correct: s.module2Correct + (correct ? 1 : 0),
      module2Total: s.module2Total + 1,
    }));
  }, []);

  const finishModule1 = useCallback(() => {
    setState((s) => {
      const pct = s.module1Total > 0 ? (s.module1Correct / s.module1Total) * 100 : 0;
      const branch: AdaptiveModule = pct >= 70 ? "module2Hard" : "module2Easy";
      return { ...s, phase: "branching", module: branch };
    });
  }, []);

  const startModule2 = useCallback(() => {
    setState((s) => ({ ...s, phase: "module2" }));
  }, []);

  const finishModule2 = useCallback(() => {
    setState((s) => ({ ...s, phase: "complete" }));
  }, []);

  const reset = useCallback(() => {
    setState({
      phase: "module1",
      module: "module1",
      module1Correct: 0,
      module1Total: 0,
      module2Correct: 0,
      module2Total: 0,
    });
  }, []);

  const module1Pct =
    state.module1Total > 0
      ? Math.round((state.module1Correct / state.module1Total) * 100)
      : 0;

  const totalCorrect = state.module1Correct + state.module2Correct;
  const totalQuestions = state.module1Total + state.module2Total;
  const totalPct = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  const getBandScore = (): string => {
    const isHard = state.module === "module2Hard";
    if (isHard) {
      if (totalPct >= 90) return "5.5〜6.0";
      if (totalPct >= 75) return "4.5〜5.0";
      if (totalPct >= 60) return "3.5〜4.0";
      return "〜3.5";
    } else {
      if (totalPct >= 90) return "3.5〜4.0";
      if (totalPct >= 75) return "3.0〜3.5";
      if (totalPct >= 60) return "2.5〜3.0";
      return "〜2.5";
    }
  };

  return {
    state,
    module1Pct,
    totalCorrect,
    totalQuestions,
    totalPct,
    getBandScore,
    recordModule1Answer,
    recordModule2Answer,
    finishModule1,
    startModule2,
    finishModule2,
    reset,
  };
}

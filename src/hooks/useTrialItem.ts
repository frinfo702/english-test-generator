import { createContext, useContext, useEffect } from "react";
import { useParams } from "react-router-dom";
import type { Attempt } from "../lib/attempts";

export interface TrialItemApi {
  problemId: string;
  /**
   * Call it synchronously in the handler that saves: the runner then hides
   * the page in the same render that would have shown the answers.
   */
  complete: (saved: Promise<Attempt | undefined> | Attempt | undefined) => void;
  /** Registers the page's own submit, run when the section clock runs out. */
  onTimeout: (submit: () => void) => void;
}

export const TrialItemContext = createContext<TrialItemApi | null>(null);

/** Null outside a practice test, which is how pages tell the two apart. */
export function useTrialItem() {
  return useContext(TrialItemContext);
}

export function useTrialTimeout(submit: () => void) {
  const trial = useContext(TrialItemContext);
  useEffect(() => {
    trial?.onTimeout(submit);
  });
}

export function useQuestionId(): string {
  const trial = useContext(TrialItemContext);
  const { questionId = "" } = useParams<{ questionId: string }>();
  return trial?.problemId ?? questionId;
}

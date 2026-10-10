import {
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useRef,
  useSyncExternalStore,
} from "react";
import type { Attempt } from "../lib/attempts";
import {
  getJobs,
  jobFor,
  subscribeAttempts,
  subscribeJobs,
  type ScoringJob,
} from "../lib/backgroundScoring";

/** Every background scoring job, live. */
export function useScoringJobs() {
  return useSyncExternalStore(subscribeJobs, getJobs);
}

/** The background job for one response, if one is running or failed. */
export function useScoringJob(
  attemptId: string,
  index: number,
): ScoringJob | undefined {
  return jobFor(useScoringJobs(), attemptId, index);
}

/** Calls back with each attempt a background score saves. */
export function useAttemptUpdates(listener: (attempt: Attempt) => void) {
  const onUpdate = useEffectEvent(listener);
  useEffect(() => subscribeAttempts((a) => onUpdate(a)), []);
}

/**
 * Several items of one attempt can be scored before the parent re-renders;
 * chaining each update onto the latest result keeps them all.
 */
export function useAttemptUpdater(
  attempt: Attempt,
  onChange: (next: Attempt) => void,
) {
  const latest = useRef(attempt);
  useLayoutEffect(() => {
    latest.current = attempt;
  }, [attempt]);
  return (update: (current: Attempt) => Attempt) => {
    latest.current = update(latest.current);
    onChange(latest.current);
  };
}

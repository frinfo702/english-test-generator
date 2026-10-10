import {
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { autoScoring, scoreWithGateway } from "../lib/aiGateway";
import type { Attempt } from "../lib/attempts";

/**
 * off: no key or manual mode, so the copy & paste panel shows as before.
 * ready: a key is set but this surface waits for a click (see autoStart).
 * manual: the user chose copy & paste for this item after an error.
 */
export type AutoScorePhase =
  "off" | "ready" | "scoring" | "done" | "error" | "manual";

export interface AutoScore {
  phase: AutoScorePhase;
  error: string | null;
  model: string | null;
  start: () => void;
  switchToManual: () => void;
}

/**
 * Scores one response through AI Gateway with the same prompt and parser the
 * copy & paste panel uses, so both paths store the same shape.
 */
export function useAutoScore<T>({
  message,
  parse,
  onApply,
  autoStart = true,
}: {
  message: string;
  parse: (reply: string) => T;
  onApply: (ai: { reply: string; scores: T }) => void;
  /** False where many unscored items render at once and each call costs money. */
  autoStart?: boolean;
}): AutoScore {
  const [config] = useState(autoScoring);
  const [phase, setPhase] = useState<AutoScorePhase>(
    !config ? "off" : autoStart ? "scoring" : "ready",
  );
  const [error, setError] = useState<string | null>(null);
  const apply = useEffectEvent((reply: string) => {
    onApply({ reply, scores: parse(reply) });
  });

  useEffect(() => {
    if (phase !== "scoring" || !config) return;
    const controller = new AbortController();
    scoreWithGateway(message, config, controller.signal)
      .then((reply) => {
        try {
          apply(reply);
        } catch {
          throw new Error(
            "The model replied without a score. Try again, or pick another model in Settings.",
          );
        }
        setPhase("done");
      })
      .catch((e: unknown) => {
        if (controller.signal.aborted) return;
        setError(e instanceof Error ? e.message : String(e));
        setPhase("error");
      });
    return () => controller.abort();
  }, [phase, config, message]);

  return {
    phase,
    error,
    model: config?.model ?? null,
    start: () => {
      setError(null);
      setPhase("scoring");
    },
    switchToManual: () => setPhase("manual"),
  };
}

/**
 * Several items of one attempt can finish scoring before the parent
 * re-renders; chaining each update onto the latest result keeps them all.
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

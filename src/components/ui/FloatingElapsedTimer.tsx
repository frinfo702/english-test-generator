import { useContext } from "react";
import { TrialItemContext } from "../../hooks/useTrialItem";
import styles from "./FloatingElapsedTimer.module.css";

interface FloatingElapsedTimerProps {
  display: string;
  running: boolean;
  /** Countdown states, e.g. the last minute of a writing task. */
  isWarning?: boolean;
  isExpired?: boolean;
}

/** Fixed top-right "TIME" pill; also used for countdowns. */
export function FloatingElapsedTimer({
  display,
  running,
  isWarning,
  isExpired = false,
}: FloatingElapsedTimerProps) {
  const inTrial = useContext(TrialItemContext) !== null;
  // A test shows the section clock; only countdowns (writing tasks) pass isWarning.
  if (inTrial && isWarning === undefined) return null;
  return (
    <div
      className={[
        styles.floatingTimer,
        isWarning ? styles.warning : "",
        isExpired ? styles.expired : "",
      ].join(" ")}
      aria-live="polite"
      role="timer"
    >
      <span className={styles.label}>TIME</span>
      <span className={styles.value}>{display}</span>
      <span
        className={[styles.dot, running ? styles.active : styles.stopped].join(
          " ",
        )}
      />
    </div>
  );
}

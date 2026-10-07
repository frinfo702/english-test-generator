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
  isWarning = false,
  isExpired = false,
}: FloatingElapsedTimerProps) {
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

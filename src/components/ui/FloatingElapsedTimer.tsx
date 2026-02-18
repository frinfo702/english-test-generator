import styles from "./FloatingElapsedTimer.module.css";

interface FloatingElapsedTimerProps {
  display: string;
  running: boolean;
}

export function FloatingElapsedTimer({
  display,
  running,
}: FloatingElapsedTimerProps) {
  return (
    <div className={styles.floatingTimer} aria-live="polite" role="timer">
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

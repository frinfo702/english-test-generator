import type { ReactNode } from "react";
import styles from "./ResultSummary.module.css";

interface ResultSummaryProps {
  correct: number;
  total: number;
  /** What to do next: retake, back to the list, the next question. */
  actions: ReactNode;
  /** Extra material under the score, e.g. a transcript. */
  children?: ReactNode;
}

/**
 * The score once a set is graded, the same on every task: one frosted panel,
 * the count in light display type, and what to do next beside it.
 */
export function ResultSummary({
  correct,
  total,
  actions,
  children,
}: ResultSummaryProps) {
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  return (
    <section className={`glass ${styles.summary}`} aria-label="Result">
      <div className={styles.row}>
        <div>
          <p className="micro-label">Score</p>
          <p className={styles.score}>
            <span className={styles.num}>{correct}</span>
            <span className={styles.den}>/ {total}</span>
            <span className={styles.pct}>{pct}%</span>
          </p>
        </div>
        <div className={styles.actions}>{actions}</div>
      </div>
      {children}
    </section>
  );
}

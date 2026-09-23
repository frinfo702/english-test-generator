import type { CSSProperties } from "react";
import styles from "./LoadingSpinner.module.css";

/**
 * Nine blocks shrinking and growing in a diagonal sweep.
 * Port of loading.dev's Blocks (MIT).
 */
const DIAGONAL_STEPS = Array.from(
  { length: 9 },
  (_, i) => Math.floor(i / 3) + (i % 3),
);

interface LoadingSpinnerProps {
  message?: string;
}

export function LoadingSpinner({
  message = "Generating question...",
}: LoadingSpinnerProps) {
  return (
    <div className={styles.wrapper} role="status">
      <div className={styles.blocks} aria-hidden="true">
        {DIAGONAL_STEPS.map((step, i) => (
          <div
            key={i}
            className={styles.block}
            style={{ "--step": step } as CSSProperties}
          />
        ))}
      </div>
      <p className={styles.message}>{message}</p>
    </div>
  );
}

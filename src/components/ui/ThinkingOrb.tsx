import styles from "./ThinkingOrb.module.css";

const OUTER = 12;
const INNER = 7;

/**
 * Indeterminate "the AI is composing" mark, after the composing state of
 * adrielzimbril's thinking-orb (21st.dev), redrawn as two counter-rotating
 * rings of ink dots with a wave travelling round them. CSS only; under
 * reduced motion it holds one still frame of the wave.
 */
export function ThinkingOrb({ size = "sm" }: { size?: "sm" | "lg" }) {
  return (
    <span
      className={[styles.orb, size === "lg" ? styles.lg : ""].join(" ")}
      aria-hidden="true"
    >
      <span className={styles.outer}>
        {Array.from({ length: OUTER }, (_, i) => (
          <span
            key={i}
            className={styles.dot}
            style={{ "--i": i, "--n": OUTER } as React.CSSProperties}
          />
        ))}
      </span>
      <span className={styles.inner}>
        {Array.from({ length: INNER }, (_, i) => (
          <span
            key={i}
            className={styles.dot}
            style={{ "--i": i, "--n": INNER } as React.CSSProperties}
          />
        ))}
      </span>
      <span className={styles.core} />
    </span>
  );
}

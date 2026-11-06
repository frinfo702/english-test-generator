import styles from "./ScorePips.module.css";

const SIZE = 6;
const GAP = 2;

/** A score as a row of small blocks: ink for each point, an outline for the rest. */
export function ScorePips({
  score,
  max = 5,
  className,
}: {
  score: number | null;
  max?: number;
  className?: string;
}) {
  const filled = score === null ? 0 : Math.round(score);
  return (
    <svg
      className={[styles.pips, className].filter(Boolean).join(" ")}
      viewBox={`0 0 ${max * (SIZE + GAP) - GAP} ${SIZE}`}
      role="img"
      aria-label={score === null ? "Not scored" : `${filled} out of ${max}`}
    >
      {Array.from({ length: max }, (_, i) => (
        <rect
          key={i}
          x={i * (SIZE + GAP) + 0.5}
          y={0.5}
          width={SIZE - 1}
          height={SIZE - 1}
          rx={1}
          className={i < filled ? styles.on : styles.off}
        />
      ))}
    </svg>
  );
}

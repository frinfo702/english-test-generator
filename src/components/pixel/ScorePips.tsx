import styles from "./ScorePips.module.css";

const PIP = 4;
const GAP = 1;

/** Rubric scores as chunky pixel blocks: 3/5 reads at a glance as ■■■□□. */
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
      viewBox={`0 0 ${max * (PIP + GAP) - GAP} ${PIP}`}
      shapeRendering="crispEdges"
      role="img"
      aria-label={score === null ? "Not scored" : `${filled} out of ${max}`}
    >
      {Array.from({ length: max }, (_, i) => (
        <rect
          key={i}
          x={i * (PIP + GAP)}
          width={PIP}
          height={PIP}
          className={i < filled ? styles.on : styles.off}
        />
      ))}
    </svg>
  );
}

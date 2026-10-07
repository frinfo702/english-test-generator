import styles from "./ScorePips.module.css";

const SIZE = 6;
const GAP = 1;

// Red → green across the scale, each as [fill, highlight, shadow], so a
// higher score lights up greener blocks. Fixed hexes like the other sprites.
// prettier-ignore
const RAMP: [string, string, string][] = [
  ["#d0432c", "#f07a5f", "#8f2a1b"],
  ["#e07a26", "#f5a55c", "#a04f12"],
  ["#d9a723", "#f2cd5f", "#966f10"],
  ["#89b13a", "#b3d66a", "#5b7a22"],
  ["#3e9d5a", "#6fcb87", "#256b3b"],
];

function colorsFor(index: number, max: number) {
  const step = max > 1 ? index / (max - 1) : 1;
  return RAMP[Math.round(step * (RAMP.length - 1))];
}

/**
 * One 6×6 block: outline with clipped corners, 4×4 body, a highlight in the
 * top-left and a shadow along the bottom and right, like a game health bar.
 */
function Pip({ x, on, colors }: { x: number; on: boolean; colors: string[] }) {
  const [fill, light, dark] = colors;
  const px = (dx: number, dy: number, w: number, h: number, props: object) => (
    <rect x={x + dx} y={dy} width={w} height={h} {...props} />
  );
  const outline = on
    ? { className: styles.outline }
    : { className: styles.offOutline };
  return (
    <g>
      {px(1, 0, 4, 1, outline)}
      {px(1, 5, 4, 1, outline)}
      {px(0, 1, 1, 4, outline)}
      {px(5, 1, 1, 4, outline)}
      {on ? (
        <>
          {px(1, 1, 4, 4, { fill })}
          {px(1, 4, 4, 1, { fill: dark })}
          {px(4, 1, 1, 4, { fill: dark })}
          {px(1, 1, 2, 1, { fill: light })}
          {px(1, 2, 1, 1, { fill: light })}
        </>
      ) : (
        px(1, 1, 4, 4, { className: styles.offFill })
      )}
    </g>
  );
}

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
      shapeRendering="crispEdges"
      role="img"
      aria-label={score === null ? "Not scored" : `${filled} out of ${max}`}
    >
      {Array.from({ length: max }, (_, i) => (
        <Pip
          key={i}
          x={i * (SIZE + GAP)}
          on={i < filled}
          colors={colorsFor(i, max)}
        />
      ))}
    </svg>
  );
}

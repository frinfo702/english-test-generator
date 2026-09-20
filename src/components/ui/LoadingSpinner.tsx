import { Matrix, type Frame } from "./Matrix";
import styles from "./LoadingSpinner.module.css";

/** Rotating three-dot sweep on a 7x7 grid. */
const loader: Frame[] = (() => {
  const frames: Frame[] = [];
  const positions: [number, number][] = [
    [0, 3],
    [1, 1],
    [3, 0],
    [5, 1],
    [6, 3],
    [5, 5],
    [3, 6],
    [1, 5],
  ];
  for (let f = 0; f < positions.length; f++) {
    const frame: Frame = Array.from({ length: 7 }, () =>
      Array(7).fill(0),
    ) as number[][];
    for (let i = 0; i < 3; i++) {
      const [row, col] = positions[(f + i) % positions.length];
      frame[row][col] = 1 - i * 0.3;
    }
    frames.push(frame);
  }
  return frames;
})();

interface LoadingSpinnerProps {
  message?: string;
}

export function LoadingSpinner({
  message = "Generating question...",
}: LoadingSpinnerProps) {
  return (
    <div className={styles.wrapper} role="status">
      <Matrix
        rows={7}
        cols={7}
        frames={loader}
        fps={12}
        size={6}
        gap={2}
        ariaLabel="Loading"
        className={styles.matrix}
      />
      <p className={styles.message}>{message}</p>
    </div>
  );
}

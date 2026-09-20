import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import styles from "./Matrix.module.css";

export type Frame = number[][];

type MatrixMode = "default" | "vu";

export interface MatrixProps {
  rows: number;
  cols: number;
  pattern?: Frame;
  frames?: Frame[];
  fps?: number;
  autoplay?: boolean;
  loop?: boolean;
  size?: number;
  gap?: number;
  palette?: { on: string; off: string };
  brightness?: number;
  ariaLabel?: string;
  mode?: MatrixMode;
  levels?: number[];
  className?: string;
}

function clamp(value: number) {
  return Math.max(0, Math.min(1, value));
}

/**
 * Dot-matrix display — a trimmed port of ElevenLabs UI's Matrix (MIT).
 * Used for loading and empty states, never for content that must be read fast.
 */
export function Matrix({
  rows,
  cols,
  pattern,
  frames,
  fps = 12,
  autoplay = true,
  loop = true,
  size = 10,
  gap = 2,
  palette,
  brightness = 1,
  ariaLabel,
  mode = "default",
  levels,
  className,
}: MatrixProps) {
  const [frameIndex, setFrameIndex] = useState(0);
  const frameRef = useRef(0);

  useEffect(() => {
    if (!frames || frames.length === 0 || !autoplay || mode === "vu") return;
    const interval = 1000 / fps;
    let raf = 0;
    let last = 0;
    let accumulator = 0;

    const animate = (time: number) => {
      if (!last) last = time;
      accumulator += time - last;
      last = time;
      if (accumulator >= interval) {
        accumulator -= interval;
        frameRef.current += 1;
        if (frameRef.current >= frames.length) {
          if (loop) frameRef.current = 0;
          else frameRef.current = frames.length - 1;
        }
        setFrameIndex(frameRef.current);
      }
      raf = requestAnimationFrame(animate);
    };

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [frames, fps, autoplay, loop, mode]);

  const activeFrame = useMemo(() => {
    if (mode === "vu") {
      const frame: Frame = Array.from({ length: rows }, () =>
        Array(cols).fill(0),
      ) as number[][];
      for (let col = 0; col < cols; col++) {
        const level = clamp(levels?.[col] ?? 0);
        const filled = Math.round(level * rows);
        for (let row = 0; row < filled; row++) {
          frame[rows - 1 - row][col] = 1;
        }
      }
      return frame;
    }
    if (pattern) return pattern;
    if (frames && frames.length > 0) return frames[frameIndex] ?? frames[0];
    return null;
  }, [mode, levels, rows, cols, pattern, frames, frameIndex]);

  const width = cols * size + (cols - 1) * gap;
  const height = rows * size + (rows - 1) * gap;
  const onColor = palette?.on ?? "currentColor";
  const offColor = palette?.off ?? "var(--color-ink-disabled)";

  return (
    <div
      className={[styles.matrix, className].filter(Boolean).join(" ")}
      role="img"
      aria-label={ariaLabel ?? "Dot matrix display"}
      style={{ width, height }}
    >
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        aria-hidden="true"
      >
        {Array.from({ length: rows }).flatMap((_, row) =>
          Array.from({ length: cols }).map((__, col) => {
            const value = clamp((activeFrame?.[row]?.[col] ?? 0) * brightness);
            return (
              <circle
                key={`${row}-${col}`}
                cx={col * (size + gap) + size / 2}
                cy={row * (size + gap) + size / 2}
                r={size / 2}
                fill={value > 0.35 ? onColor : offColor}
                opacity={value > 0.35 ? value : Math.max(0.12, value * 0.9)}
                style={
                  { transition: "opacity 90ms linear" } as CSSProperties
                }
              />
            );
          }),
        )}
      </svg>
    </div>
  );
}

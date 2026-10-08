import { useMemo } from "react";
import { PixelArt } from "../pixel/PixelArt";
import { clockFace } from "./pixelClock";
import styles from "./PixelTimer.module.css";

/** Seconds at which the clock turns to the error colour. */
const URGENT_SECONDS = 10;

/**
 * Countdown as a pixel clock whose wedge sweeps over the elapsed time, with
 * the digits underneath: the face is read at a glance, the text exactly.
 */
export function PixelTimer({
  seconds,
  total,
}: {
  seconds: number;
  total: number;
}) {
  const { ring, wedge } = useMemo(
    () => clockFace(total > 0 ? (total - seconds) / total : 1),
    [seconds, total],
  );
  const urgent = seconds <= URGENT_SECONDS;
  const m = Math.floor(seconds / 60);
  const s = String(seconds % 60).padStart(2, "0");
  return (
    <div
      className={[styles.timer, urgent ? styles.urgent : ""].join(" ")}
      role="timer"
      aria-label={`${seconds} seconds left`}
    >
      <PixelArt
        layers={[wedge, ring]}
        palette={{ w: "var(--clock-sweep)", o: "currentColor" }}
        width={15}
        height={15}
        className={styles.face}
      />
      <span className={styles.digits} aria-hidden="true">
        {m}:{s}
      </span>
    </div>
  );
}

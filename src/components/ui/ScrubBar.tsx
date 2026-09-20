import { useCallback, useRef, type KeyboardEvent, type PointerEvent } from "react";
import { formatClock } from "../../lib/time";
import styles from "./ScrubBar.module.css";

export interface ScrubBarProps {
  duration: number;
  value: number;
  onScrub?: (time: number) => void;
  onScrubStart?: () => void;
  onScrubEnd?: () => void;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
}

/**
 * Thin scrub track with a travelling thumb — the fallback transport while a
 * decoded waveform is not available. Ported from ElevenLabs UI's Scrub Bar
 * (MIT), keeping pointer capture, time labels and keyboard stepping.
 */
export function ScrubBar({
  duration,
  value,
  onScrub,
  onScrubStart,
  onScrubEnd,
  disabled = false,
  className,
  ariaLabel = "Seek",
}: ScrubBarProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const progress = duration > 0 ? (value / duration) * 100 : 0;
  const clampedValue = Math.min(Math.max(value, 0), duration || 0);

  const timeFromClientX = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track || !duration) return null;
      const rect = track.getBoundingClientRect();
      const ratio = (clientX - rect.left) / rect.width;
      return duration * Math.min(Math.max(ratio, 0), 1);
    },
    [duration],
  );

  const handlePointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (disabled || !duration) return;
      event.preventDefault();
      trackRef.current?.setPointerCapture(event.pointerId);
      onScrubStart?.();
      const time = timeFromClientX(event.clientX);
      if (time != null) onScrub?.(time);
    },
    [disabled, duration, timeFromClientX, onScrub, onScrubStart],
  );

  const handlePointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (!trackRef.current?.hasPointerCapture(event.pointerId)) return;
      const time = timeFromClientX(event.clientX);
      if (time != null) onScrub?.(time);
    },
    [timeFromClientX, onScrub],
  );

  const handlePointerUp = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (!trackRef.current?.hasPointerCapture(event.pointerId)) return;
      trackRef.current.releasePointerCapture(event.pointerId);
      onScrubEnd?.();
    },
    [onScrubEnd],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (disabled || !duration) return;
      const step = event.shiftKey ? 10 : 5;
      if (event.key === "ArrowRight" || event.key === "ArrowUp") {
        event.preventDefault();
        onScrub?.(Math.min(duration, clampedValue + step));
      } else if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
        event.preventDefault();
        onScrub?.(Math.max(0, clampedValue - step));
      } else if (event.key === "Home") {
        event.preventDefault();
        onScrub?.(0);
      } else if (event.key === "End") {
        event.preventDefault();
        onScrub?.(duration);
      }
    },
    [disabled, duration, clampedValue, onScrub],
  );

  return (
    <div
      ref={trackRef}
      className={[styles.track, disabled ? styles.disabled : "", className]
        .filter(Boolean)
        .join(" ")}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onKeyDown={handleKeyDown}
      role="slider"
      tabIndex={disabled ? -1 : 0}
      aria-label={ariaLabel}
      aria-valuemin={0}
      aria-valuemax={Math.floor(duration || 0)}
      aria-valuenow={Math.floor(clampedValue)}
      aria-valuetext={formatClock(clampedValue)}
      aria-disabled={disabled || undefined}
    >
      <div className={styles.progress} style={{ width: `${progress}%` }} />
      <div className={styles.thumb} style={{ left: `${progress}%` }} />
    </div>
  );
}

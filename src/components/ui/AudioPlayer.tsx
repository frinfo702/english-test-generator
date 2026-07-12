import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "./Button";
import { SpeedControl } from "./SpeedControl";
import styles from "./AudioPlayer.module.css";

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export interface AudioPlayerProps {
  playing: boolean;
  loading?: boolean;
  error?: string | null;
  currentTime: number;
  duration: number;
  playbackRate: number;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  onPlaybackRateChange: (rate: number) => void;
  /** Disable seeking (e.g. while a timed response is active). Default true. */
  seekable?: boolean;
  showSpeedControl?: boolean;
  playLabel?: string;
  className?: string;
}

export function AudioPlayer({
  playing,
  loading = false,
  error = null,
  currentTime,
  duration,
  playbackRate,
  onPlayPause,
  onSeek,
  onPlaybackRateChange,
  seekable = true,
  showSpeedControl = true,
  playLabel,
  className,
}: AudioPlayerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const getSeekTime = useCallback(
    (clientX: number) => {
      if (!progressBarRef.current || duration <= 0) return null;
      const rect = progressBarRef.current.getBoundingClientRect();
      const ratio = (clientX - rect.left) / rect.width;
      return Math.max(0, Math.min(ratio * duration, duration));
    },
    [duration],
  );

  const handleBarMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!seekable || duration <= 0) return;
      const time = getSeekTime(e.clientX);
      if (time !== null) onSeek(time);
      setIsDragging(true);
    },
    [seekable, duration, getSeekTime, onSeek],
  );

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent) => {
      const time = getSeekTime(e.clientX);
      if (time !== null) onSeek(time);
    };
    const onUp = () => setIsDragging(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isDragging, getSeekTime, onSeek]);

  const label =
    playLabel ??
    (loading
      ? "Loading..."
      : playing
        ? "⏸ Pause"
        : currentTime > 0
          ? "▶ Resume"
          : "▶ Play");

  return (
    <div className={[styles.playerCard, className].filter(Boolean).join(" ")}>
      <div className={styles.playerControls}>
        <Button
          onClick={() => onSeek(Math.max(0, currentTime - 10))}
          disabled={duration <= 0}
          size="sm"
          variant="secondary"
          type="button"
        >
          ⏪ 10s
        </Button>
        <Button
          onClick={onPlayPause}
          disabled={loading}
          size="md"
          variant="accent"
          type="button"
        >
          {label}
        </Button>
        <Button
          onClick={() => onSeek(Math.min(duration, currentTime + 10))}
          disabled={duration <= 0}
          size="sm"
          variant="secondary"
          type="button"
        >
          ⏩ 10s
        </Button>
      </div>
      {(playing || currentTime > 0 || duration > 0) && (
        <div className={styles.playerControls}>
          <span className={styles.timeText}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
          <div
            ref={progressBarRef}
            className={`${styles.progressBar} ${seekable ? styles.progressBarSeekable : ""}`}
            onMouseDown={handleBarMouseDown}
            role="slider"
            aria-label="Seek"
            aria-valuemin={0}
            aria-valuemax={Math.floor(duration)}
            aria-valuenow={Math.floor(currentTime)}
            tabIndex={seekable ? 0 : -1}
          >
            <div
              className={styles.progressFill}
              style={{
                width:
                  duration > 0 ? `${(currentTime / duration) * 100}%` : "0%",
              }}
            />
          </div>
          <span className={styles.timeText} aria-hidden="true" />
        </div>
      )}
      {showSpeedControl && (
        <div className={styles.speedControlRow}>
          <SpeedControl
            playbackRate={playbackRate}
            onChange={onPlaybackRateChange}
          />
        </div>
      )}
      {error && <p className={styles.errorText}>{error}</p>}
    </div>
  );
}

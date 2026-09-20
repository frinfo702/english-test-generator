import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SpeedControl } from "./SpeedControl";
import { ScrubBar } from "./ScrubBar";
import { formatClock } from "../../lib/time";
import styles from "./AudioPlayer.module.css";

const BAR_COUNT = 96;
const waveformCache = new Map<string, Promise<number[]>>();

/** Decode a file into normalised peak buckets for the waveform display. */
function loadWaveform(src: string): Promise<number[]> {
  const cached = waveformCache.get(src);
  if (cached) return cached;

  const promise = (async () => {
    const response = await fetch(src);
    if (!response.ok) throw new Error(`Failed to load audio: ${response.status}`);
    const buffer = await response.arrayBuffer();
    const context = new OfflineAudioContext(1, 1, 44100);
    const audio = await context.decodeAudioData(buffer);

    const channel = audio.getChannelData(0);
    const bucketSize = Math.floor(channel.length / BAR_COUNT) || 1;
    const peaks: number[] = [];
    for (let i = 0; i < BAR_COUNT; i++) {
      let peak = 0;
      const start = i * bucketSize;
      for (let j = start; j < start + bucketSize && j < channel.length; j += 8) {
        const value = Math.abs(channel[j]);
        if (value > peak) peak = value;
      }
      peaks.push(peak);
    }
    const max = Math.max(...peaks, 0.0001);
    return peaks.map((peak) => Math.max(0.06, Math.min(1, peak / max)));
  })();

  waveformCache.set(src, promise);
  promise.catch(() => waveformCache.delete(src));
  return promise;
}

function PlayIcon({ playing }: { playing: boolean }) {
  if (playing) {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <rect x="6.5" y="5" width="3.6" height="14" rx="1" />
        <rect x="13.9" y="5" width="3.6" height="14" rx="1" />
      </svg>
    );
  }
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5.4c0-.9 1-1.5 1.8-1L18 9.9c.7.5.7 1.7 0 2.2l-8.2 5.5c-.8.5-1.8-.1-1.8-1z" />
    </svg>
  );
}

function SkipIcon({ back = false }: { back?: boolean }) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={back ? undefined : { transform: "scaleX(-1)" }}
    >
      <path d="M9.5 5.5 4 12l5.5 6.5" />
      <path d="M19 5.5 13.5 12 19 18.5" />
    </svg>
  );
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
  /** Seconds skipped by the back/forward buttons. Default 10. */
  skipSeconds?: number;
  showSpeedControl?: boolean;
  /** Audio URL — decoded once to draw the waveform. */
  src?: string;
  title?: string;
  /** Accessible label for the transport button (defaults to Play/Pause/Resume). */
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
  skipSeconds = 10,
  showSpeedControl = true,
  src,
  title,
  playLabel,
  className,
}: AudioPlayerProps) {
  const [waveform, setWaveform] = useState<{
    src: string;
    peaks: number[];
  } | null>(null);
  const [hoverRatio, setHoverRatio] = useState<number | null>(null);
  const [scrubbing, setScrubbing] = useState(false);
  const waveformRef = useRef<HTMLDivElement | null>(null);
  const progress = duration > 0 ? Math.min(1, currentTime / duration) : 0;
  const interactive = seekable && duration > 0;

  useEffect(() => {
    if (!src) return;
    let active = true;
    loadWaveform(src)
      .then((next) => {
        if (active) setWaveform({ src, peaks: next });
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [src]);

  const ratioFromEvent = useCallback((clientX: number) => {
    const rect = waveformRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return 0;
    return Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
  }, []);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!interactive) return;
      event.preventDefault();
      waveformRef.current?.setPointerCapture(event.pointerId);
      setScrubbing(true);
      onSeek(ratioFromEvent(event.clientX) * duration);
    },
    [interactive, onSeek, duration, ratioFromEvent],
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const ratio = ratioFromEvent(event.clientX);
      setHoverRatio(ratio);
      if (
        scrubbing &&
        waveformRef.current?.hasPointerCapture(event.pointerId)
      ) {
        onSeek(ratio * duration);
      }
    },
    [scrubbing, onSeek, duration, ratioFromEvent],
  );

  const endPointer = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (waveformRef.current?.hasPointerCapture(event.pointerId)) {
      waveformRef.current.releasePointerCapture(event.pointerId);
    }
    setScrubbing(false);
  }, []);

  const bars = useMemo(
    () => (waveform && waveform.src === src ? waveform.peaks : []),
    [waveform, src],
  );

  return (
    <div
      className={[styles.player, className].filter(Boolean).join(" ")}
      data-playing={playing || undefined}
    >
      {title && <p className={styles.title}>{title}</p>}

      <div className={styles.controls}>
        <button
          type="button"
          className={styles.playButton}
          onClick={onPlayPause}
          disabled={loading}
          aria-label={
            playLabel ??
            (playing ? "Pause" : currentTime > 0 ? "Resume" : "Play")
          }
        >
          <PlayIcon playing={playing} />
        </button>

        <div className={styles.transport}>
          <button
            type="button"
            className={styles.skipButton}
            onClick={() => onSeek(Math.max(0, currentTime - skipSeconds))}
            disabled={duration <= 0}
            aria-label={`Back ${skipSeconds}s`}
          >
            <SkipIcon back />
          </button>
          <button
            type="button"
            className={styles.skipButton}
            onClick={() => onSeek(Math.min(duration, currentTime + skipSeconds))}
            disabled={duration <= 0}
            aria-label={`Forward ${skipSeconds}s`}
          >
            <SkipIcon />
          </button>
        </div>

        <span className={styles.time}>
          <span className={styles.timeCurrent}>
            {formatClock(currentTime)}
          </span>
          <span className={styles.timeDivider}>/</span>
          <span>{formatClock(duration)}</span>
        </span>

        {showSpeedControl && (
          <div className={styles.speed}>
            <SpeedControl
              playbackRate={playbackRate}
              onChange={onPlaybackRateChange}
            />
          </div>
        )}
      </div>

      {bars.length > 0 ? (
        <div
          ref={waveformRef}
          className={[
            styles.waveform,
            interactive ? styles.waveformInteractive : "",
            scrubbing ? styles.waveformScrubbing : "",
          ]
            .filter(Boolean)
            .join(" ")}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endPointer}
          onPointerCancel={endPointer}
          onPointerLeave={() => setHoverRatio(null)}
          role={interactive ? "slider" : undefined}
          tabIndex={interactive ? 0 : undefined}
          aria-label={interactive ? "Seek" : undefined}
          aria-valuemin={interactive ? 0 : undefined}
          aria-valuemax={interactive ? Math.floor(duration) : undefined}
          aria-valuenow={interactive ? Math.floor(currentTime) : undefined}
          aria-valuetext={interactive ? formatClock(currentTime) : undefined}
          onKeyDown={(event) => {
            if (!interactive) return;
            if (event.key === "ArrowRight") {
              event.preventDefault();
              onSeek(Math.min(duration, currentTime + 5));
            } else if (event.key === "ArrowLeft") {
              event.preventDefault();
              onSeek(Math.max(0, currentTime - 5));
            }
          }}
        >
          <div className={styles.barsIdle} aria-hidden="true">
            {bars.map((peak, index) => (
              <span key={index} style={{ height: `${peak * 100}%` }} />
            ))}
          </div>
          <div
            className={styles.barsPlayed}
            aria-hidden="true"
            style={{ clipPath: `inset(0 ${100 - progress * 100}% 0 0)` }}
          >
            {bars.map((peak, index) => (
              <span key={index} style={{ height: `${peak * 100}%` }} />
            ))}
          </div>
          {interactive && (
            <div
              className={styles.playhead}
              style={{ left: `${progress * 100}%` }}
              aria-hidden="true"
            />
          )}
          {interactive && hoverRatio !== null && (
            <div
              className={styles.hoverGuide}
              style={{ left: `${hoverRatio * 100}%` }}
              aria-hidden="true"
            >
              <span className={styles.hoverTime}>
                {formatClock(hoverRatio * duration)}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className={styles.scrub}>
          <ScrubBar
            duration={duration}
            value={currentTime}
            onScrub={onSeek}
            disabled={!interactive}
          />
        </div>
      )}

      {loading && <p className={styles.hint}>Loading audio…</p>}
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}

/** Live RMS bars for mic level visualization. */

import {
  AUDIO_METER_BAR_COUNT,
  computeMeterLevels,
  createMeterState,
  emptyLevels,
  type LevelListener,
} from "./audioLevels";

export { AUDIO_METER_BAR_COUNT, emptyLevels };
export type { LevelListener };

export interface AudioMeterHandle {
  stop: () => void;
}

/**
 * Attach a time-domain RMS meter to a MediaStream.
 * Returns a disposer; safe if Web Audio is unavailable.
 *
 * The meter is self-healing and auto-ranging:
 * - Browsers suspend an AudioContext when the page is backgrounded or audio
 *   focus moves; a suspended context returns silence forever, which used to
 *   freeze the waveform mid-recording. The loop resumes it.
 * - The display follows a rolling peak, so a steady input keeps filling the
 *   meter after the browser's AGC settles to a lower level.
 */
export function startAudioMeter(
  stream: MediaStream,
  onLevels: LevelListener,
): AudioMeterHandle {
  let raf = 0;
  let ctx: AudioContext | null = null;
  let analyser: AnalyserNode | null = null;
  let data: Uint8Array<ArrayBuffer> | null = null;
  let disposed = false;
  const state = createMeterState();

  const resumeIfNeeded = () => {
    if (ctx && ctx.state !== "running") {
      void ctx.resume().catch(() => undefined);
    }
  };

  const schedule = () => {
    if (disposed) return;
    // Idempotent: never let two loops run at once.
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(tick);
  };

  const onVisibilityChange = () => {
    if (document.visibilityState !== "visible") return;
    resumeIfNeeded();
    // rAF does not fire while hidden, so kick the loop back to life.
    schedule();
  };

  const tick = (now = 0) => {
    if (disposed || !analyser || !data) return;
    try {
      resumeIfNeeded();
      analyser.getByteTimeDomainData(data);
      onLevels(computeMeterLevels(data, state, now));
    } catch {
      // Metering is best-effort; never let one bad frame kill the loop.
    }
    schedule();
  };

  const stop = () => {
    disposed = true;
    cancelAnimationFrame(raf);
    raf = 0;
    document.removeEventListener("visibilitychange", onVisibilityChange);
    window.removeEventListener("pageshow", onVisibilityChange);
    analyser = null;
    if (ctx) {
      void ctx.close().catch(() => undefined);
      ctx = null;
    }
    onLevels(emptyLevels());
  };

  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return { stop };

    ctx = new AudioCtx();
    const source = ctx.createMediaStreamSource(stream);
    analyser = ctx.createAnalyser();
    // Time-domain metering is more reliable for USB/headset mics than FFT bins.
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.5;
    source.connect(analyser);
    data = new Uint8Array(new ArrayBuffer(analyser.fftSize));

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pageshow", onVisibilityChange);

    resumeIfNeeded();
    schedule();
  } catch {
    // Meter is best-effort.
  }

  return { stop };
}

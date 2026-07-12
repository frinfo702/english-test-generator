/** Live RMS bars for mic level visualization. */

export const AUDIO_METER_BAR_COUNT = 24;

export type LevelListener = (levels: number[]) => void;

export interface AudioMeterHandle {
  stop: () => void;
}

function emptyLevels(): number[] {
  return Array.from({ length: AUDIO_METER_BAR_COUNT }, () => 0);
}

/**
 * Attach a time-domain RMS meter to a MediaStream.
 * Returns a disposer; safe if Web Audio is unavailable.
 */
export function startAudioMeter(
  stream: MediaStream,
  onLevels: LevelListener,
): AudioMeterHandle {
  let raf = 0;
  let ctx: AudioContext | null = null;
  let analyser: AnalyserNode | null = null;

  const stop = () => {
    if (raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
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

    const data = new Uint8Array(analyser.fftSize);
    const tick = () => {
      if (!analyser) return;
      analyser.getByteTimeDomainData(data);
      const next: number[] = [];
      const segment = Math.floor(data.length / AUDIO_METER_BAR_COUNT);
      for (let i = 0; i < AUDIO_METER_BAR_COUNT; i++) {
        let sumSq = 0;
        const start = i * segment;
        for (let j = 0; j < segment; j++) {
          const v = (data[start + j] - 128) / 128;
          sumSq += v * v;
        }
        const rms = Math.sqrt(sumSq / Math.max(1, segment));
        next.push(Math.min(1, rms * 4));
      }
      onLevels(next);
      raf = requestAnimationFrame(tick);
    };

    if (ctx.state === "suspended") {
      void ctx.resume();
    }
    raf = requestAnimationFrame(tick);
  } catch {
    // Meter is best-effort.
  }

  return { stop };
}

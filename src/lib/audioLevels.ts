/**
 * Level maths for the live microphone meter.
 *
 * Two envelopes drive the display:
 * - a rolling **peak** sets the scale, so a steady input keeps filling the
 *   meter after the browser's automatic gain control settles to a much lower
 *   level (the waveform used to shrink to the minimum bar mid-recording);
 * - a rolling **noise floor** gates the amplification, so a muted track or a
 *   silent room never animates.
 *
 * Both are relative, which avoids having to trust one absolute threshold
 * calibrated for one particular microphone.
 */

export const AUDIO_METER_BAR_COUNT = 24;

export type LevelListener = (levels: number[]) => void;

/** How long a loud moment keeps the display calibrated. */
const REFERENCE_DECAY_MS = 3000;
/** How quickly the noise floor climbs back up after a quiet passage. */
const FLOOR_RISE_MS = 8000;
/** Content below this never counts as signal, even in a perfectly quiet room. */
const ABSOLUTE_GATE = 0.008;
/** Signal must beat the noise floor by this factor to be amplified. */
const CONTRAST = 2;
/** Never amplify more than this, or hiss reads as full scale. */
const MAX_GAIN = 25;

export interface MeterState {
  referencePeak: number;
  noiseFloor: number;
  lastTickAt: number;
}

export function createMeterState(): MeterState {
  return { referencePeak: 0, noiseFloor: 0, lastTickAt: 0 };
}

export function emptyLevels(): number[] {
  return Array.from({ length: AUDIO_METER_BAR_COUNT }, () => 0);
}

/**
 * Turn one time-domain frame (128 = silence) into normalised bar levels.
 * Mutates `state` so both envelopes survive between frames.
 */
export function computeMeterLevels(
  data: Uint8Array,
  state: MeterState,
  now: number,
): number[] {
  if (data.length === 0) return emptyLevels();

  const elapsed = state.lastTickAt ? Math.max(1, now - state.lastTickAt) : 16;
  state.lastTickAt = now;

  const segment = Math.floor(data.length / AUDIO_METER_BAR_COUNT) || 1;
  const raw: number[] = [];
  let framePeak = 0;

  for (let i = 0; i < AUDIO_METER_BAR_COUNT; i++) {
    let sumSq = 0;
    const start = i * segment;
    for (let j = 0; j < segment; j++) {
      const v = (data[start + j] - 128) / 128;
      sumSq += v * v;
    }
    const level = Math.min(1, Math.sqrt(sumSq / segment) * 4);
    raw.push(level);
    if (level > framePeak) framePeak = level;
  }

  // Peak: instant attack, slow release. Floor: instant drop, slow rise, so a
  // transient can never masquerade as the noise floor.
  state.referencePeak =
    Math.max(framePeak, state.referencePeak) * Math.exp(-elapsed / REFERENCE_DECAY_MS);
  state.noiseFloor =
    state.noiseFloor === 0
      ? framePeak
      : Math.min(framePeak, state.noiseFloor * Math.exp(elapsed / FLOOR_RISE_MS));

  const gate = Math.max(ABSOLUTE_GATE, state.noiseFloor * CONTRAST);
  const gain =
    framePeak > gate
      ? Math.min(MAX_GAIN, 1 / Math.max(state.referencePeak, ABSOLUTE_GATE))
      : 1;

  return raw.map((level) => Math.min(1, level * gain));
}

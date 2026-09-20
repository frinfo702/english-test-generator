import { describe, expect, it } from "vitest";
import {
  AUDIO_METER_BAR_COUNT,
  computeMeterLevels,
  createMeterState,
  emptyLevels,
} from "./audioLevels";

const FRAME_SIZE = 2048;

function frame(amplitude: number, size = FRAME_SIZE): Uint8Array {
  const data = new Uint8Array(size);
  for (let i = 0; i < size; i++) {
    data[i] = Math.max(0, Math.min(255, 128 + Math.round(amplitude * 128 * Math.sin(i / 7))));
  }
  return data;
}

function silence(size = FRAME_SIZE): Uint8Array {
  return new Uint8Array(size).fill(128);
}

/** One byte of quantisation noise — a real "silent" track looks like this. */
function noise(size = FRAME_SIZE): Uint8Array {
  const data = new Uint8Array(size);
  for (let i = 0; i < size; i++) data[i] = i % 2 ? 129 : 127;
  return data;
}

const peakOf = (levels: number[]) => Math.max(...levels);

/**
 * Speech is never a steady tone: loud syllables alternate with quieter ones.
 * `loudness` scales a two-frame cycle so the meter sees real contrast.
 */
function speech(loudness: number, phase: number): Uint8Array {
  return frame(loudness * (phase % 3 === 0 ? 0.35 : 1));
}

describe("computeMeterLevels", () => {
  it("returns one level per bar", () => {
    const levels = computeMeterLevels(frame(0.5), createMeterState(), 0);
    expect(levels).toHaveLength(AUDIO_METER_BAR_COUNT);
    expect(emptyLevels()).toHaveLength(AUDIO_METER_BAR_COUNT);
  });

  it("keeps silence flat and never amplifies it", () => {
    const state = createMeterState();
    let now = 0;
    // even after a loud moment, silence must read as silence
    expect(peakOf(computeMeterLevels(frame(0.9), state, (now += 16)))).toBeGreaterThan(0.5);
    expect(peakOf(computeMeterLevels(silence(), state, (now += 16)))).toBe(0);
    // one-bit dither must stay flat even after the reference peak decays
    let dither = 0;
    for (let i = 0; i < 400; i++) {
      dither = peakOf(computeMeterLevels(noise(), state, (now += 16)));
    }
    expect(dither).toBeLessThan(0.05);
  });

  it("keeps quiet speech at full scale after the input level collapses", () => {
    const state = createMeterState();
    let now = 0;
    // loud opening (browser AGC before it adapts) …
    for (let i = 0; i < 60; i++) computeMeterLevels(speech(0.9, i), state, (now += 16));
    // … then the level collapses, which used to shrink the bars to nothing
    let quiet = 0;
    for (let i = 0; i < 500; i++) {
      quiet = peakOf(computeMeterLevels(speech(0.05, i), state, (now += 16)));
    }
    expect(quiet).toBeGreaterThan(0.8);
  });

  it("shows something for quiet speech right away", () => {
    const state = createMeterState();
    let now = 0;
    let visible = 0;
    for (let i = 0; i < 120; i++) {
      visible = peakOf(computeMeterLevels(speech(0.06, i), state, (now += 16)));
    }
    expect(visible).toBeGreaterThan(0.5);
  });

  it("recovers its scale within the decay window after a transient", () => {
    const state = createMeterState();
    let now = 0;
    computeMeterLevels(frame(0.95), state, (now += 16));
    const shortlyAfter = peakOf(computeMeterLevels(speech(0.1, 0), state, (now += 16)));
    // a signal 10x quieter reads low right after the transient …
    expect(shortlyAfter).toBeLessThan(0.3);
    // … and is back to full scale once the reference peak decays. Speech has
    // quiet syllables, so look at the loudest of the recent frames.
    const recent: number[] = [];
    for (let i = 0; i < 400; i++) {
      recent.push(peakOf(computeMeterLevels(speech(0.1, i), state, (now += 16))));
      if (recent.length > 30) recent.shift();
    }
    expect(Math.max(...recent)).toBeGreaterThan(0.9);
  });

  it("does not divide by zero on an empty frame", () => {
    const levels = computeMeterLevels(new Uint8Array(0), createMeterState(), 0);
    expect(levels.every((level) => Number.isFinite(level))).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import {
  computeSpeedMetrics,
  speedScore,
  type SpeedMetrics,
} from "./speakingRate";

const w = (start: number, end: number) => ({ word: "x", start, end });

describe("computeSpeedMetrics", () => {
  it("counts a gap of 0.5 s or more as a long pause that splits runs", () => {
    const m = computeSpeedMetrics([[w(0, 0.5), w(0.5, 1), w(2, 3)]]);
    expect(m.words).toBe(3);
    expect(m.speakingRate).toBeCloseTo(60);
    expect(m.articulationRate).toBeCloseTo(90);
    expect(m.longPausesPerMinute).toBeCloseTo(20);
    expect(m.meanLengthOfRun).toBeCloseTo(1.5);
  });

  it("sums separate recordings without treating the gap between them as a pause", () => {
    const m = computeSpeedMetrics([[w(0, 1)], [w(5, 6)], []]);
    expect(m.words).toBe(2);
    expect(m.speakingRate).toBeCloseTo(60);
    expect(m.longPausesPerMinute).toBe(0);
  });

  it("returns zeros when nothing was spoken", () => {
    expect(computeSpeedMetrics([]).speakingRate).toBe(0);
  });
});

describe("speedScore", () => {
  const metrics = (speakingRate: number, longPausesPerMinute = 0) =>
    ({
      words: 50,
      speakingRate,
      articulationRate: speakingRate,
      longPausesPerMinute,
      meanLengthOfRun: 10,
    }) satisfies SpeedMetrics;

  it("gives 100 inside the 130–160 wpm band", () => {
    expect(speedScore(metrics(130))).toBe(100);
    expect(speedScore(metrics(160))).toBe(100);
  });

  it("falls to 0 at 60 wpm and at 220 wpm", () => {
    expect(speedScore(metrics(95))).toBeCloseTo(50);
    expect(speedScore(metrics(60))).toBe(0);
    expect(speedScore(metrics(190))).toBeCloseTo(50);
    expect(speedScore(metrics(400))).toBe(0);
  });

  it("subtracts 5 points per long pause per minute beyond 4", () => {
    expect(speedScore(metrics(145, 4))).toBe(100);
    expect(speedScore(metrics(145, 10))).toBe(70);
  });

  it("returns 0 when nothing was spoken", () => {
    expect(speedScore({ ...metrics(0), words: 0 })).toBe(0);
  });
});

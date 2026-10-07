import { describe, expect, it } from "vitest";
import { computeSpeedMetrics } from "./speakingRate";

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

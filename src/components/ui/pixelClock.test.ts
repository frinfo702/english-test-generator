import { describe, expect, it } from "vitest";
import { clockFace } from "./pixelClock";

const cells = (rows: string[], ch: string) =>
  rows.flatMap((row, y) =>
    [...row].flatMap((c, x) => (c === ch ? [{ x, y }] : [])),
  );

describe("clockFace", () => {
  it("has an empty face at the start", () => {
    expect(cells(clockFace(0).wedge, "w")).toEqual([]);
  });

  it("fills the whole face when time is up", () => {
    const full = cells(clockFace(1).wedge, "w").length;
    expect(full).toBeGreaterThan(0);
    expect(cells(clockFace(2).wedge, "w")).toHaveLength(full);
  });

  it("sweeps clockwise from 12 o'clock", () => {
    const quarter = cells(clockFace(0.25).wedge, "w");
    expect(quarter.length).toBeGreaterThan(0);
    // centre is (7, 7): a quarter turn covers only the top-right
    expect(quarter.every(({ x, y }) => x >= 7 && y <= 7)).toBe(true);
  });

  it("grows as time passes", () => {
    const counts = [0.1, 0.4, 0.7, 0.95].map(
      (f) => cells(clockFace(f).wedge, "w").length,
    );
    expect(counts).toEqual([...counts].sort((a, b) => a - b));
    expect(new Set(counts).size).toBe(counts.length);
  });

  it("draws a closed ring with a hub", () => {
    const { ring } = clockFace(0);
    expect(ring[7][7]).toBe("o");
    // the four axis cells, where a rounding gap would open
    for (const [x, y] of [
      [7, 1],
      [13, 7],
      [7, 13],
      [1, 7],
    ]) {
      expect(ring[y][x]).toBe("o");
    }
    expect(ring.every((row) => row.length === 15)).toBe(true);
  });
});

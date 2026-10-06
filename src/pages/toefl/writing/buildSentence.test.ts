import { describe, expect, it } from "vitest";
import {
  applyDrop,
  emptySlots,
  isCorrectOrder,
  isFilled,
  poolChunks,
} from "./buildSentence";

describe("buildSentence helpers", () => {
  it("places a pool chunk into an empty blank", () => {
    expect(
      applyDrop(emptySlots(3), { kind: "pool", chunk: 2 }, { kind: "slot", index: 1 }),
    ).toEqual([null, 2, null]);
  });

  it("sends the occupant back to the pool when a pool chunk lands on it", () => {
    const next = applyDrop(
      [0, null, null],
      { kind: "pool", chunk: 1 },
      { kind: "slot", index: 0 },
    );
    expect(next).toEqual([1, null, null]);
    expect(poolChunks(3, next)).toEqual([0, 2]);
  });

  it("moves a placed chunk into an empty blank", () => {
    expect(
      applyDrop([0, null, null], { kind: "slot", index: 0 }, { kind: "slot", index: 2 }),
    ).toEqual([null, null, 0]);
  });

  it("swaps two placed chunks", () => {
    expect(
      applyDrop([0, 1, 2], { kind: "slot", index: 0 }, { kind: "slot", index: 2 }),
    ).toEqual([2, 1, 0]);
  });

  it("returns a placed chunk to the pool", () => {
    expect(
      applyDrop([0, 1, null], { kind: "slot", index: 1 }, { kind: "pool" }),
    ).toEqual([0, null, null]);
  });

  it("checks completeness and order", () => {
    expect(isFilled([0, null], 2)).toBe(false);
    expect(isFilled([1, 0], 2)).toBe(true);
    expect(isCorrectOrder([1, 0], [1, 0])).toBe(true);
    expect(isCorrectOrder([0, 1], [1, 0])).toBe(false);
  });
});

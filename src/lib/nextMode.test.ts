import { describe, expect, it } from "vitest";
import { pickNext, type NextMode } from "./nextMode";

const all = [1, 2, 3, 4];
const none = new Set<number>();
const inOrder: NextMode = { order: "order", unsolvedOnly: false };
const shuffle: NextMode = { order: "shuffle", unsolvedOnly: false };

describe("pickNext", () => {
  it("in order goes to the next number and stops at the last", () => {
    expect(pickNext(inOrder, all, 2, none)).toBe(3);
    expect(pickNext(inOrder, all, 4, none)).toBeNull();
  });

  it("shuffle never returns the current problem", () => {
    for (let i = 0; i < 50; i++) {
      const next = pickNext(shuffle, all, 2, none);
      expect(all).toContain(next);
      expect(next).not.toBe(2);
    }
    expect(pickNext(shuffle, [1], 1, none)).toBeNull();
  });

  it("unsolved only + in order skips solved ones and wraps around", () => {
    const mode: NextMode = { order: "order", unsolvedOnly: true };
    expect(pickNext(mode, all, 1, new Set([2]))).toBe(3);
    expect(pickNext(mode, all, 3, new Set([2, 4]))).toBe(1);
    expect(pickNext(mode, all, 3, new Set([1, 2, 4]))).toBeNull();
  });

  it("unsolved only + shuffle picks only unsolved ones", () => {
    const mode: NextMode = { order: "shuffle", unsolvedOnly: true };
    for (let i = 0; i < 50; i++) {
      expect(pickNext(mode, all, 1, new Set([2, 3]))).toBe(4);
    }
  });
});

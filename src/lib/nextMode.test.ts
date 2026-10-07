import { describe, expect, it } from "vitest";
import { pickNext } from "./nextMode";

const all = [1, 2, 3, 4];
const none = new Set<number>();

describe("pickNext", () => {
  it("order goes to the next number and stops at the last", () => {
    expect(pickNext("order", all, 2, none)).toBe(3);
    expect(pickNext("order", all, 4, none)).toBeNull();
  });

  it("shuffle never returns the current problem", () => {
    for (let i = 0; i < 50; i++) {
      const next = pickNext("shuffle", all, 2, none);
      expect(all).toContain(next);
      expect(next).not.toBe(2);
    }
    expect(pickNext("shuffle", [1], 1, none)).toBeNull();
  });

  it("unsolved skips solved ones and wraps around", () => {
    expect(pickNext("unsolved", all, 1, new Set([2]))).toBe(3);
    expect(pickNext("unsolved", all, 3, new Set([2, 4]))).toBe(1);
    expect(pickNext("unsolved", all, 3, new Set([1, 2, 4]))).toBeNull();
  });
});

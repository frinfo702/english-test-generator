import { describe, expect, it } from "vitest";
import {
  getNextMode,
  pickNext,
  setNextMode,
  subscribeNextMode,
  type NextMode,
} from "./nextMode";

const all = ["001", "002", "20261007-a", "20261007-b"];
const [a, b, c, d] = all;
const none = new Set<string>();
const inOrder: NextMode = { order: "order", unsolvedOnly: false };
const shuffle: NextMode = { order: "shuffle", unsolvedOnly: false };

describe("pickNext", () => {
  it("in order goes to the next ID and stops at the last", () => {
    expect(pickNext(inOrder, all, b, none)).toBe(c);
    expect(pickNext(inOrder, all, d, none)).toBeNull();
  });

  it("shuffle never returns the current problem", () => {
    for (let i = 0; i < 50; i++) {
      const next = pickNext(shuffle, all, b, none);
      expect(all).toContain(next);
      expect(next).not.toBe(b);
    }
    expect(pickNext(shuffle, [a], a, none)).toBeNull();
  });

  it("unsolved only + in order skips solved ones and wraps around", () => {
    const mode: NextMode = { order: "order", unsolvedOnly: true };
    expect(pickNext(mode, all, a, new Set([b]))).toBe(c);
    expect(pickNext(mode, all, c, new Set([b, d]))).toBe(a);
    expect(pickNext(mode, all, c, new Set([a, b, d]))).toBeNull();
  });

  it("unsolved only + shuffle picks only unsolved ones", () => {
    const mode: NextMode = { order: "shuffle", unsolvedOnly: true };
    for (let i = 0; i < 50; i++) {
      expect(pickNext(mode, all, a, new Set([b, c]))).toBe(d);
    }
  });
});

describe("shared next mode", () => {
  it("notifies every subscriber and persists the change", () => {
    const seen: NextMode[] = [];
    const off = subscribeNextMode(() => seen.push(getNextMode()));
    const mode: NextMode = { order: "shuffle", unsolvedOnly: true };
    setNextMode(mode);
    off();
    expect(seen).toEqual([mode]);
    expect(localStorage.getItem("next-question-unsolved-only")).toBe("1");
  });
});

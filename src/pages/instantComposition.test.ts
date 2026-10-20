import { describe, expect, it } from "vitest";
import { thinkSeconds } from "./instantComposition";

describe("thinkSeconds", () => {
  it("gives longer sentences more time", () => {
    expect(thinkSeconds("I get up at six.")).toBeCloseTo(4);
    expect(
      thinkSeconds("I've been meaning to ask you about the seminar next week."),
    ).toBeGreaterThan(6);
  });

  it("caps the wait at nine seconds", () => {
    expect(thinkSeconds("word ".repeat(40))).toBe(9);
  });
});

import { describe, expect, it } from "vitest";
import { formatClock, formatSecondsAsMmSs } from "./time";

describe("formatSecondsAsMmSs", () => {
  it("formats into mm:ss", () => {
    expect(formatSecondsAsMmSs(0)).toBe("00:00");
    expect(formatSecondsAsMmSs(5)).toBe("00:05");
    expect(formatSecondsAsMmSs(65)).toBe("01:05");
    expect(formatSecondsAsMmSs(3599)).toBe("59:59");
  });

  it("normalizes invalid values", () => {
    expect(formatSecondsAsMmSs(-3)).toBe("00:00");
    expect(formatSecondsAsMmSs(12.9)).toBe("00:12");
  });
});

describe("formatClock", () => {
  it("formats audio timestamps without padding minutes", () => {
    expect(formatClock(0)).toBe("0:00");
    expect(formatClock(7.8)).toBe("0:07");
    expect(formatClock(222)).toBe("3:42");
    expect(formatClock(725)).toBe("12:05");
  });

  it("normalizes invalid values", () => {
    expect(formatClock(-1)).toBe("0:00");
    expect(formatClock(Number.NaN)).toBe("0:00");
  });
});

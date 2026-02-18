import { describe, expect, it } from "vitest";
import { formatSecondsAsMmSs } from "./time";

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

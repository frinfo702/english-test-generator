import { afterEach, describe, expect, it } from "vitest";
import {
  buildAudioConstraints,
  isConstraintError,
  loadPreferredMicrophoneId,
  savePreferredMicrophoneId,
} from "./microphonePreference";

describe("microphonePreference", () => {
  afterEach(() => {
    localStorage.clear();
  });

  it("loads and saves preferred device id", () => {
    expect(loadPreferredMicrophoneId()).toBeNull();
    savePreferredMicrophoneId("mic-abc");
    expect(loadPreferredMicrophoneId()).toBe("mic-abc");
    savePreferredMicrophoneId(null);
    expect(loadPreferredMicrophoneId()).toBeNull();
  });

  it("builds default constraints", () => {
    expect(buildAudioConstraints(null)).toMatchObject({
      echoCancellation: true,
      noiseSuppression: true,
    });
  });

  it("builds exact constraints for a selected mic", () => {
    expect(buildAudioConstraints("dev-1", "exact")).toMatchObject({
      deviceId: { exact: "dev-1" },
      echoCancellation: false,
      noiseSuppression: false,
    });
  });

  it("builds ideal constraints as fallback shape", () => {
    expect(buildAudioConstraints("dev-1", "ideal")).toMatchObject({
      deviceId: { ideal: "dev-1" },
    });
  });

  it("detects constraint errors", () => {
    expect(
      isConstraintError(new DOMException("fail", "OverconstrainedError")),
    ).toBe(true);
    expect(isConstraintError(new Error("other"))).toBe(false);
  });
});

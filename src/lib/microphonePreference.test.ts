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

  it("builds default audio constraints without device id", () => {
    expect(buildAudioConstraints(null)).toMatchObject({
      echoCancellation: true,
      noiseSuppression: true,
    });
  });

  it("uses exact deviceId and softens AEC/NS for a selected mic", () => {
    expect(buildAudioConstraints("dev-1")).toMatchObject({
      deviceId: { exact: "dev-1" },
      echoCancellation: false,
      noiseSuppression: false,
    });
  });

  it("detects constraint errors", () => {
    expect(
      isConstraintError(new DOMException("fail", "OverconstrainedError")),
    ).toBe(true);
    expect(isConstraintError(new Error("other"))).toBe(false);
  });
});

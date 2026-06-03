import { describe, expect, it } from "vitest";
import { DEFAULT_VOICE, ROLE_VOICE_MAP, getVoiceForRole } from "./voiceMapping";

describe("voiceMapping", () => {
  it("returns mapped voices for known roles", () => {
    expect(getVoiceForRole("Student")).toBe(ROLE_VOICE_MAP.Student);
    expect(getVoiceForRole("Professor")).toBe(ROLE_VOICE_MAP.Professor);
    expect(getVoiceForRole("Narrator")).toBe(ROLE_VOICE_MAP.Narrator);
  });

  it("falls back to the default voice for unknown roles", () => {
    expect(getVoiceForRole("Unknown")).toBe(DEFAULT_VOICE);
  });
});

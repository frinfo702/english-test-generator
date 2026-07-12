import { describe, expect, it } from "vitest";
import {
  ALL_VOICE_IDS,
  ALL_VOICES,
  DEFAULT_VOICE,
  INTERVIEWER_VOICE_IDS,
  ROLE_VOICE_MAP,
  getInterviewerDisplayName,
  getInterviewerPortraitUrl,
  getVoiceForRole,
  getVoiceInfo,
  pickInterviewerVoice,
} from "./voiceMapping";

describe("voiceMapping", () => {
  it("returns mapped voices for known roles", () => {
    expect(getVoiceForRole("Student")).toBe(ROLE_VOICE_MAP.Student);
    expect(getVoiceForRole("Professor")).toBe(ROLE_VOICE_MAP.Professor);
    expect(getVoiceForRole("Narrator")).toBe(ROLE_VOICE_MAP.Narrator);
  });

  it("falls back to the default voice for unknown roles", () => {
    expect(getVoiceForRole("Unknown")).toBe(DEFAULT_VOICE);
  });

  it("includes expanded xAI TTS voice catalog", () => {
    expect(ALL_VOICES.length).toBeGreaterThanOrEqual(20);
    for (const id of ["ara", "eve", "leo", "rex", "sal", "iris", "atlas"]) {
      expect(ALL_VOICE_IDS).toContain(id);
    }
  });

  it("looks up voice info by id (case-insensitive)", () => {
    expect(getVoiceInfo("Eve")?.name).toBe("Eve");
    expect(getVoiceInfo("eve")?.gender).toBe("female");
    expect(getVoiceInfo("missing")).toBeUndefined();
  });

  it("picks a stable interviewer voice for the same seed", () => {
    const a = pickInterviewerVoice("001");
    const b = pickInterviewerVoice("001");
    expect(a).toBe(b);
    expect(INTERVIEWER_VOICE_IDS).toContain(a);
  });

  it("can pick different interviewers for different seeds", () => {
    const voices = new Set(
      ["001", "002", "003", "004", "005", "006", "007", "008"].map(
        pickInterviewerVoice,
      ),
    );
    expect(voices.size).toBeGreaterThan(1);
  });

  it("builds portrait url and display name from voice id", () => {
    expect(getInterviewerPortraitUrl("eve")).toBe("/images/voices/eve.jpg");
    expect(getInterviewerDisplayName("eve")).toBe("Eve");
    expect(getInterviewerDisplayName("unknown")).toBe("unknown");
  });
});

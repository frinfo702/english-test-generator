import type { VoiceGender } from "./voiceMapping";

/**
 * Who is in each photo under public/images/speakers/{id}.jpg.
 * "pair" photos show one man and one woman (used for Conversation).
 */
export const SPEAKER_PHOTOS: Record<string, VoiceGender | "pair"> = {
  m1: "male",
  m2: "male",
  m3: "male",
  m4: "male",
  m5: "male",
  m6: "male",
  f1: "female",
  f2: "female",
  f3: "female",
  f4: "female",
  c1: "pair",
  c2: "pair",
  c3: "pair",
  c4: "pair",
};

export const ROLE_VOICE_MAP: Record<string, string> = {
  // TOEFL
  Student: "eve",
  Professor: "leo",
  Lecturer: "rex",
  // TOEIC
  Woman: "eve",
  Man: "leo",
  Speaker: "rex",
  Narrator: "ara",
};

export const DEFAULT_VOICE = "ara";

export function getVoiceForRole(role: string): string {
  return ROLE_VOICE_MAP[role] ?? DEFAULT_VOICE;
}

export const ROLE_VOICE_MAP: Record<string, string> = {
  Student: "eve",
  Professor: "leo",
  Lecturer: "rex",
};

export const DEFAULT_VOICE = "ara";

export function getVoiceForRole(role: string): string {
  return ROLE_VOICE_MAP[role] ?? DEFAULT_VOICE;
}

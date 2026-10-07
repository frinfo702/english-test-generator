/**
 * xAI TTS built-in voices (from GET /v1/tts/voices).
 * Keep in sync with the API: `npm run check-voices`.
 */
export type VoiceGender = "male" | "female";

export interface VoiceInfo {
  id: string;
  name: string;
  gender: VoiceGender;
  /** Optional short personality note for interviewer casting. */
  description?: string;
}

/**
 * Full built-in voice catalog from xAI TTS.
 * IDs are case-insensitive on the API; we keep lowercase.
 */
export const ALL_VOICES: VoiceInfo[] = [
  { id: "altair", name: "Altair", gender: "male" },
  { id: "ara", name: "Ara", gender: "female", description: "Warm, clear" },
  {
    id: "atlas",
    name: "Atlas",
    gender: "male",
    description: "Steady, confident",
  },
  { id: "aurora", name: "Aurora", gender: "female" },
  {
    id: "carina",
    name: "Carina",
    gender: "female",
    description: "Friendly, articulate",
  },
  { id: "castor", name: "Castor", gender: "male" },
  {
    id: "celeste",
    name: "Celeste",
    gender: "female",
    description: "Calm, professional",
  },
  { id: "cosmo", name: "Cosmo", gender: "male" },
  {
    id: "eve",
    name: "Eve",
    gender: "female",
    description: "Bright, approachable",
  },
  {
    id: "helios",
    name: "Helios",
    gender: "male",
    description: "Energetic, clear",
  },
  { id: "helix", name: "Helix", gender: "male" },
  {
    id: "iris",
    name: "Iris",
    gender: "female",
    description: "Thoughtful, precise",
  },
  {
    id: "kepler",
    name: "Kepler",
    gender: "male",
    description: "Intellectual, measured",
  },
  {
    id: "leo",
    name: "Leo",
    gender: "male",
    description: "Mature, professorial",
  },
  { id: "liora", name: "Liora", gender: "female" },
  { id: "lumen", name: "Lumen", gender: "male" },
  {
    id: "luna",
    name: "Luna",
    gender: "female",
    description: "Soft, encouraging",
  },
  { id: "lux", name: "Lux", gender: "male" },
  { id: "naksh", name: "Naksh", gender: "male" },
  {
    id: "orion",
    name: "Orion",
    gender: "male",
    description: "Confident, direct",
  },
  { id: "perseus", name: "Perseus", gender: "male" },
  {
    id: "rex",
    name: "Rex",
    gender: "male",
    description: "Deep, authoritative",
  },
  { id: "rigel", name: "Rigel", gender: "male" },
  {
    id: "sal",
    name: "Sal",
    gender: "male",
    description: "Friendly, casual-professional",
  },
  { id: "sirius", name: "Sirius", gender: "male" },
  {
    id: "ursa",
    name: "Ursa",
    gender: "female",
    description: "Experienced, warm",
  },
  { id: "zagan", name: "Zagan", gender: "male" },
  { id: "zenith", name: "Zenith", gender: "male" },
];

export const ALL_VOICE_IDS: string[] = ALL_VOICES.map((v) => v.id);

/**
 * Voices used as Take-an-Interview interviewers.
 * Each has a portrait at /images/voices/{id}.jpg.
 */
export const INTERVIEWER_VOICE_IDS = [
  "ara",
  "eve",
  "carina",
  "celeste",
  "iris",
  "luna",
  "ursa",
  "leo",
  "rex",
  "sal",
  "atlas",
  "orion",
  "helios",
  "kepler",
] as const;

export type InterviewerVoiceId = (typeof INTERVIEWER_VOICE_IDS)[number];

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
  // Interview
  Interviewer: "ara",
};

export const DEFAULT_VOICE = "ara";

export function getVoiceInfo(voiceId: string): VoiceInfo | undefined {
  const id = voiceId.toLowerCase();
  return ALL_VOICES.find((v) => v.id === id);
}

export function getVoiceForRole(role: string): string {
  return ROLE_VOICE_MAP[role] ?? DEFAULT_VOICE;
}

export function getInterviewerPortraitUrl(voiceId: string): string {
  return `/images/voices/${voiceId.toLowerCase()}.jpg`;
}

export function hashText(text: string): number {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Pick a stable interviewer voice for a question set (e.g. file basename "001").
 * Same set always gets the same interviewer.
 */
export function pickInterviewerVoice(seed: string): InterviewerVoiceId {
  const idx = hashText(seed) % INTERVIEWER_VOICE_IDS.length;
  return INTERVIEWER_VOICE_IDS[idx];
}

export function getInterviewerDisplayName(voiceId: string): string {
  return getVoiceInfo(voiceId)?.name ?? voiceId;
}

/** Narration is not a person on screen, so it is excluded from casting. */
export const NARRATOR_ROLE = "Narrator";

/**
 * Cast a voice for each role of a listening set, deterministically from the
 * file basename. Roles never share a voice. With `mixedPair`, the first two
 * on-screen roles get one male and one female voice (Conversation photos
 * always show a man and a woman). `genders` pins a role's voice gender, so a
 * recast keeps matching the photos already chosen for it.
 */
export function assignVoices(
  basename: string,
  roles: string[],
  {
    mixedPair = false,
    genders = {},
  }: { mixedPair?: boolean; genders?: Record<string, VoiceGender> } = {},
): Record<string, string> {
  const used = new Set<string>();
  const voices: Record<string, string> = {};
  const speakers = roles.filter((r) => r !== NARRATOR_ROLE);
  const firstGender: VoiceGender =
    hashText(`${basename}:gender`) % 2 === 0 ? "male" : "female";
  const other = (g: VoiceGender): VoiceGender =>
    g === "male" ? "female" : "male";
  for (const role of roles) {
    // Gender first, 50/50: the catalog has twice as many male voices, so
    // picking straight from it would cast mostly men.
    const idx = speakers.indexOf(role);
    const gender: VoiceGender =
      genders[role] ??
      (mixedPair && idx >= 0 && idx < 2
        ? idx === 0
          ? firstGender
          : other(firstGender)
        : hashText(`${basename}:${role}:gender`) % 2 === 0
          ? "male"
          : "female");
    const pool = ALL_VOICES.filter(
      (v) => !used.has(v.id) && v.gender === gender,
    );
    const voice = pool[hashText(`${basename}:${role}`) % pool.length];
    voices[role] = voice.id;
    used.add(voice.id);
  }
  return voices;
}

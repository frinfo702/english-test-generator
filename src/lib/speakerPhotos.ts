import { NARRATOR_ROLE, type VoiceGender } from "./voiceMapping";

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

/** Photos a new set's speaker is drawn from: professors for lectures, campus people otherwise. */
const SOLO_PHOTOS: Record<
  "lecture" | "campus",
  Record<VoiceGender, string[]>
> = {
  lecture: { male: ["m1", "m2", "m3", "m4"], female: ["f1", "f2"] },
  campus: { male: ["m5", "m6"], female: ["f3", "f4"] },
};

const PAIR_PHOTOS = Object.keys(SPEAKER_PHOTOS).filter(
  (id) => SPEAKER_PHOTOS[id] === "pair",
);

export type ListeningTask =
  "conversation" | "lecture" | "announcement" | "response";

interface CastableSet {
  speaker?: string;
  audioSegments: { role: string }[];
  questions?: { speaker?: string }[];
}

/**
 * Pick photos for a freshly cast listening set, at random but always
 * matching the gender of the voice that speaks (Response: per item).
 */
export function pickSpeakerPhotos(
  task: ListeningTask,
  data: CastableSet,
  genderOfRole: (role: string) => VoiceGender,
  random: () => number = Math.random,
): void {
  const pick = (ids: readonly string[]) =>
    ids[Math.floor(random() * ids.length)];
  if (task === "conversation") {
    data.speaker = pick(PAIR_PHOTOS);
  } else if (task === "response") {
    data.questions?.forEach((q, i) => {
      q.speaker = pick(
        SOLO_PHOTOS.campus[genderOfRole(data.audioSegments[i].role)],
      );
    });
  } else {
    const pool = SOLO_PHOTOS[task === "lecture" ? "lecture" : "campus"];
    const speaker = data.audioSegments.find((s) => s.role !== NARRATOR_ROLE);
    if (speaker) data.speaker = pick(pool[genderOfRole(speaker.role)]);
  }
}

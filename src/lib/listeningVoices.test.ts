import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  NARRATOR_ROLE,
  assignVoices,
  getVoiceInfo,
  type VoiceGender,
} from "./voiceMapping";
import { SPEAKER_PHOTOS } from "./speakerPhotos";

const LISTENING_DIR = path.resolve(
  __dirname,
  "../../public/questions/toefl/listening",
);
const PHOTO_DIR = path.resolve(__dirname, "../../public/images/speakers");

interface ListeningFile {
  speaker?: string;
  voices?: Record<string, string>;
  audioSegments: { role: string; text: string }[];
  questions: { id: string; speaker?: string }[];
}

function load(task: string): [string, ListeningFile][] {
  const dir = path.join(LISTENING_DIR, task);
  return fs
    .readdirSync(dir)
    .filter((f) => /^\d+\.json$/.test(f))
    .sort()
    .map((f) => [
      `${task}/${f}`,
      JSON.parse(fs.readFileSync(path.join(dir, f), "utf-8")),
    ]);
}

const ALL = ["conversation", "lecture", "announcement", "response"].flatMap(
  load,
);

const genderOf = (voice: string): VoiceGender | undefined =>
  getVoiceInfo(voice)?.gender;

function rolesOf(data: ListeningFile): string[] {
  return [...new Set(data.audioSegments.map((s) => s.role))];
}

describe("listening voice settings (the voice ids sent to the TTS API)", () => {
  it.each(ALL)("%s declares a current voice for every role", (_, data) => {
    expect(data.voices).toBeDefined();
    for (const role of rolesOf(data)) {
      const voice = data.voices![role];
      expect(voice, `role "${role}"`).toBeDefined();
      expect(getVoiceInfo(voice), `voice "${voice}"`).toBeDefined();
    }
  });

  it.each(ALL)("%s gives each role its own voice", (_, data) => {
    const voices = rolesOf(data).map((r) => data.voices?.[r]);
    expect(new Set(voices).size).toBe(voices.length);
  });
});

describe("Conversation: one man and one woman", () => {
  it.each(load("conversation"))(
    "%s pairs a male and a female voice",
    (_, data) => {
      const speakers = rolesOf(data).filter((r) => r !== NARRATOR_ROLE);
      expect(speakers).toHaveLength(2);
      const genders = speakers.map((r) => genderOf(data.voices![r]));
      expect(new Set(genders)).toEqual(new Set(["male", "female"]));
    },
  );

  it.each(load("conversation"))("%s shows a man–woman photo", (_, data) => {
    expect(SPEAKER_PHOTOS[data.speaker ?? ""]).toBe("pair");
  });
});

describe("speaker photo matches the voice gender", () => {
  it.each([...load("lecture"), ...load("announcement")])("%s", (_, data) => {
    const [role] = rolesOf(data).filter((r) => r !== NARRATOR_ROLE);
    expect(SPEAKER_PHOTOS[data.speaker ?? ""]).toBe(
      genderOf(data.voices![role]),
    );
  });

  it.each(load("response"))("%s (per item)", (_, data) => {
    data.questions.forEach((q, i) => {
      const role = data.audioSegments[i].role;
      expect(SPEAKER_PHOTOS[q.speaker ?? ""], `${q.id} (${role})`).toBe(
        genderOf(data.voices![role]),
      );
    });
  });
});

describe("speaker photos", () => {
  it.each(Object.keys(SPEAKER_PHOTOS))("%s.jpg exists", (id) => {
    expect(fs.existsSync(path.join(PHOTO_DIR, `${id}.jpg`))).toBe(true);
  });
});

describe("assignVoices", () => {
  it("casts a male–female pair for conversations, deterministically", () => {
    for (const seed of ["001", "002", "003", "042", "100"]) {
      const voices = assignVoices(seed, ["Student", "Professor"], {
        mixedPair: true,
      });
      expect(new Set(Object.values(voices).map(genderOf))).toEqual(
        new Set(["male", "female"]),
      );
      expect(
        assignVoices(seed, ["Student", "Professor"], { mixedPair: true }),
      ).toEqual(voices);
    }
  });

  it("never reuses a voice within a set", () => {
    const voices = assignVoices("007", ["Narrator", "Student", "Friend"]);
    expect(new Set(Object.values(voices)).size).toBe(3);
  });
});

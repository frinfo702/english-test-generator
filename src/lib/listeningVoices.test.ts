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
const AUDIO_DIR = path.resolve(__dirname, "../../public/audio/toefl/listening");

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

describe("casting uses the whole voice catalog", () => {
  // Guards against a fixed role→voice map (e.g. every Lecturer = rex).
  it.each(["conversation", "lecture", "announcement", "response"])(
    "%s: no voice takes more than a quarter of the roles",
    (task) => {
      const counts = new Map<string, number>();
      let total = 0;
      for (const [, data] of load(task)) {
        for (const voice of Object.values(data.voices ?? {})) {
          counts.set(voice, (counts.get(voice) ?? 0) + 1);
          total++;
        }
      }
      expect(Math.max(...counts.values()) / total).toBeLessThanOrEqual(0.25);
    },
  );
});

describe("single-speaker tasks alternate men and women", () => {
  it.each(["lecture", "announcement"])("%s is 40–60% female", (task) => {
    const sets = load(task);
    const women = sets.filter(([, d]) =>
      Object.values(d.voices ?? {}).some((v) => genderOf(v) === "female"),
    ).length;
    expect(women / sets.length).toBeGreaterThanOrEqual(0.4);
    expect(women / sets.length).toBeLessThanOrEqual(0.6);
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

describe("audio was made with the JSON's voices (audio/…/voices.json)", () => {
  // Without this, "voices" can say one thing while the mp3 says another,
  // and the photo-vs-voice test above passes on a lie.
  it.each(ALL)("%s", (name, data) => {
    const dir = path.join(AUDIO_DIR, name.replace(/\.json$/, ""));
    const manifestFile = path.join(dir, "voices.json");
    expect(fs.existsSync(manifestFile), "run npm run generate-audio").toBe(
      true,
    );
    const manifest = JSON.parse(fs.readFileSync(manifestFile, "utf-8"));
    data.audioSegments.forEach((seg, i) => {
      expect(manifest[`${i + 1}.mp3`], `${i + 1}.mp3 (${seg.role})`).toBe(
        data.voices?.[seg.role],
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

  it("casts men and women about equally, despite a male-heavy catalog", () => {
    const seeds = Array.from({ length: 200 }, (_, i) =>
      String(i + 1).padStart(3, "0"),
    );
    const women = seeds.filter(
      (s) => genderOf(assignVoices(s, ["Lecturer"]).Lecturer) === "female",
    ).length;
    expect(women / seeds.length).toBeGreaterThan(0.4);
    expect(women / seeds.length).toBeLessThan(0.6);
  });

  it("never reuses a voice within a set", () => {
    const voices = assignVoices("007", ["Narrator", "Student", "Friend"]);
    expect(new Set(Object.values(voices)).size).toBe(3);
  });
});

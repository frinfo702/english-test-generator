import { config } from "dotenv";
config({ path: ".env.local" });

import fs from "node:fs";
import https from "node:https";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");
const QUESTIONS_DIR = path.join(PROJECT_ROOT, "public/questions");
const AUDIO_OUT_DIR = path.join(PROJECT_ROOT, "public/audio");

const VOICE_MAP: Record<string, string> = {
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
const DEFAULT_VOICE = "ara";
const ALL_SHADOW_VOICES = ["ara", "eve", "leo", "rex"];

function hashText(text: string): number {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getVoiceForRole(role: string): string {
  return VOICE_MAP[role] ?? DEFAULT_VOICE;
}

function sha256(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

interface AudioSegment {
  role: string;
  text: string;
}

function hasAudioSegments(obj: unknown): obj is { audioSegments: AudioSegment[] } {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "audioSegments" in obj &&
    Array.isArray((obj as Record<string, unknown>).audioSegments)
  );
}

function hasTextSentences(obj: unknown): obj is { sentences: { text: string }[] } {
  if (
    typeof obj !== "object" ||
    obj === null ||
    !("sentences" in obj) ||
    !Array.isArray((obj as Record<string, unknown>).sentences)
  ) {
    return false;
  }
  const sentences = (obj as Record<string, unknown>).sentences as unknown[];
  return sentences.length > 0 && typeof sentences[0] === "object" && sentences[0] !== null && "text" in (sentences[0] as Record<string, unknown>);
}

async function fetchTts(text: string, voiceId: string): Promise<Buffer> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    throw new Error("XAI_API_KEY not set in .env.local");
  }

  const payload = JSON.stringify({
    text,
    voice_id: voiceId,
    language: "en",
    output_format: {
      codec: "mp3",
      sample_rate: 24000,
      bit_rate: 128000,
    },
  });

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: "api.x.ai",
        path: "/v1/tts",
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () => {
          const buf = Buffer.concat(chunks);
          if (!res.statusCode || res.statusCode >= 400) {
            reject(new Error(`TTS API error ${res.statusCode} for text "${text.slice(0, 60)}": ${buf.toString("utf-8").slice(0, 200)}`));
          } else {
            resolve(buf);
          }
        });
        res.on("error", reject);
      },
    );
    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

async function generateForQuestion(
  questionPath: string,
  relativePath: string,
): Promise<void> {
  const raw = fs.readFileSync(questionPath, "utf-8");
  const data = JSON.parse(raw) as unknown;
  const dirname = path.dirname(relativePath);
  const basename = path.basename(relativePath, ".json");

  if (hasAudioSegments(data)) {
    const segments = data.audioSegments;
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      const voiceId = getVoiceForRole(seg.role);
      const outDir = path.join(AUDIO_OUT_DIR, dirname, basename);
      const outFile = path.join(outDir, `${i + 1}.mp3`);

      if (fs.existsSync(outFile)) {
        console.log(`  SKIP (exists): ${path.join(dirname, basename, `${i + 1}.mp3`)}`);
        continue;
      }

      const cacheKey = sha256(`${voiceId}:${seg.text}`);
      const audioCacheDir = path.join(PROJECT_ROOT, "public/audio-cache");
      const cacheFile = path.join(audioCacheDir, `${cacheKey}.mp3`);

      let mp3: Buffer;
      if (fs.existsSync(cacheFile)) {
        mp3 = fs.readFileSync(cacheFile);
        console.log(`  CACHE HIT: segment ${i + 1}/${segments.length}`);
      } else {
        console.log(`  FETCH: segment ${i + 1}/${segments.length} (voice=${voiceId})`);
        mp3 = await fetchTts(seg.text, voiceId);
      }

      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(outFile, mp3);
      console.log(`  SAVED: ${path.join(dirname, basename, `${i + 1}.mp3`)}`);
    }
  }

  if (hasTextSentences(data)) {
    const sentences = data.sentences;
    for (let i = 0; i < sentences.length; i++) {
      const outDir = path.join(AUDIO_OUT_DIR, dirname, basename);
      const outFile = path.join(outDir, `${i + 1}.mp3`);

      if (fs.existsSync(outFile)) {
        console.log(`  SKIP (exists): ${path.join(dirname, basename, `${i + 1}.mp3`)}`);
        continue;
      }

      const voiceIdx = Math.abs(hashText(sentences[i].text)) % ALL_SHADOW_VOICES.length;
          const shadowVoice = ALL_SHADOW_VOICES[voiceIdx];
          console.log(`  FETCH: sentence ${i + 1}/${sentences.length} (voice=${shadowVoice})`);
          const mp3 = await fetchTts(sentences[i].text, shadowVoice);

      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(outFile, mp3);
      console.log(`  SAVED: ${path.join(dirname, basename, `${i + 1}.mp3`)}`);
    }
  }
}

async function walkQuestions(dir: string, relativePath: string): Promise<void> {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      await walkQuestions(fullPath, relPath);
    } else if (entry.isFile() && entry.name.endsWith(".json") && entry.name !== "index.json") {
      console.log(`\nProcessing: ${relPath}`);
      await generateForQuestion(fullPath, relPath);
    }
  }
}

async function main() {
  console.log("=== TTS Audio Generator ===");
  console.log(`Questions dir: ${QUESTIONS_DIR}`);
  console.log(`Audio output: ${AUDIO_OUT_DIR}`);

  if (!fs.existsSync(QUESTIONS_DIR)) {
    console.error("Questions directory not found. Run from project root.");
    process.exit(1);
  }

  await walkQuestions(QUESTIONS_DIR, "");

  console.log("\n=== Done ===");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

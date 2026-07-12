import { config } from "dotenv";
config({ path: ".env.local" });

import fs from "node:fs";
import https from "node:https";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import {
  ALL_VOICE_IDS,
  pickInterviewerVoice,
} from "../src/lib/voiceMapping.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");
const QUESTIONS_DIR = path.join(PROJECT_ROOT, "public/questions");
const AUDIO_OUT_DIR = path.join(PROJECT_ROOT, "public/audio");
const AUDIO_CACHE_DIR = path.join(PROJECT_ROOT, "public/audio-cache");

function hashText(text: string): number {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function sha256(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

interface AudioSegment {
  role: string;
  text: string;
}

interface InterviewQuestion {
  question: string;
  modelAnswer: string;
}

function hasAudioSegments(
  obj: unknown,
): obj is { audioSegments: AudioSegment[] } {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "audioSegments" in obj &&
    Array.isArray((obj as Record<string, unknown>).audioSegments)
  );
}

function hasTextSentences(
  obj: unknown,
): obj is { sentences: { text: string }[] } {
  if (
    typeof obj !== "object" ||
    obj === null ||
    !("sentences" in obj) ||
    !Array.isArray((obj as Record<string, unknown>).sentences)
  ) {
    return false;
  }
  const sentences = (obj as Record<string, unknown>).sentences as unknown[];
  return (
    sentences.length > 0 &&
    typeof sentences[0] === "object" &&
    sentences[0] !== null &&
    "text" in (sentences[0] as Record<string, unknown>)
  );
}

function hasInterviewQuestions(
  obj: unknown,
): obj is { scenario?: string; questions: InterviewQuestion[] } {
  if (
    typeof obj !== "object" ||
    obj === null ||
    !("questions" in obj) ||
    !Array.isArray((obj as Record<string, unknown>).questions)
  ) {
    return false;
  }
  const questions = (obj as Record<string, unknown>).questions as unknown[];
  if (questions.length === 0) return false;
  const first = questions[0];
  return (
    typeof first === "object" &&
    first !== null &&
    "question" in first &&
    "modelAnswer" in first &&
    typeof (first as InterviewQuestion).question === "string" &&
    typeof (first as InterviewQuestion).modelAnswer === "string"
  );
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
            reject(
              new Error(
                `TTS API error ${res.statusCode} for text "${text.slice(0, 60)}": ${buf.toString("utf-8").slice(0, 200)}`,
              ),
            );
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

async function getOrFetchMp3(text: string, voiceId: string): Promise<Buffer> {
  const cacheKey = sha256(`${voiceId}:${text}`);
  const cacheFile = path.join(AUDIO_CACHE_DIR, `${cacheKey}.mp3`);
  if (fs.existsSync(cacheFile)) {
    return fs.readFileSync(cacheFile);
  }
  const mp3 = await fetchTts(text, voiceId);
  fs.mkdirSync(AUDIO_CACHE_DIR, { recursive: true });
  fs.writeFileSync(cacheFile, mp3);
  return mp3;
}

async function writeMp3IfMissing(
  outFile: string,
  relativeLabel: string,
  text: string,
  voiceId: string,
): Promise<void> {
  if (fs.existsSync(outFile)) {
    console.log(`  SKIP (exists): ${relativeLabel}`);
    return;
  }
  console.log(`  FETCH: ${relativeLabel} (voice=${voiceId})`);
  const mp3 = await getOrFetchMp3(text, voiceId);
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, mp3);
  console.log(`  SAVED: ${relativeLabel}`);
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
    const voiceForRole = new Map<string, string>();
    const usedVoices = new Set<string>();
    const getVoiceForRole = (role: string): string => {
      if (!voiceForRole.has(role)) {
        const available = ALL_VOICE_IDS.filter((v) => !usedVoices.has(v));
        const pool = available.length > 0 ? available : ALL_VOICE_IDS;
        const idx = Math.abs(hashText(`${basename}:${role}`)) % pool.length;
        const voice = pool[idx];
        voiceForRole.set(role, voice);
        usedVoices.add(voice);
      }
      return voiceForRole.get(role)!;
    };
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      const voiceId = getVoiceForRole(seg.role);
      const outDir = path.join(AUDIO_OUT_DIR, dirname, basename);
      const outFile = path.join(outDir, `${i + 1}.mp3`);
      await writeMp3IfMissing(
        outFile,
        path.join(dirname, basename, `${i + 1}.mp3`),
        seg.text,
        voiceId,
      );
    }
  }

  if (hasTextSentences(data)) {
    const sentences = data.sentences;
    for (let i = 0; i < sentences.length; i++) {
      const outDir = path.join(AUDIO_OUT_DIR, dirname, basename);
      const outFile = path.join(outDir, `${i + 1}.mp3`);
      const voiceIdx =
        Math.abs(hashText(sentences[i].text)) % ALL_VOICE_IDS.length;
      const voiceId = ALL_VOICE_IDS[voiceIdx];
      await writeMp3IfMissing(
        outFile,
        path.join(dirname, basename, `${i + 1}.mp3`),
        sentences[i].text,
        voiceId,
      );
    }
  }

  // Take an Interview: scenario intro + question + model-answer audio
  if (
    relativePath.includes("speaking/interview") &&
    hasInterviewQuestions(data)
  ) {
    const voiceId = pickInterviewerVoice(basename);
    console.log(`  Interviewer voice for ${basename}: ${voiceId}`);
    const outDir = path.join(AUDIO_OUT_DIR, dirname, basename);

    if (typeof data.scenario === "string" && data.scenario.trim()) {
      // Narration may use newlines; speak as natural pauses.
      const scenarioText = data.scenario.replace(/\n+/g, " ").trim();
      await writeMp3IfMissing(
        path.join(outDir, "scenario.mp3"),
        path.join(dirname, basename, "scenario.mp3"),
        scenarioText,
        voiceId,
      );
    }

    for (let i = 0; i < data.questions.length; i++) {
      const q = data.questions[i];
      const n = i + 1;
      await writeMp3IfMissing(
        path.join(outDir, `${n}.mp3`),
        path.join(dirname, basename, `${n}.mp3`),
        q.question,
        voiceId,
      );
      await writeMp3IfMissing(
        path.join(outDir, `${n}-model.mp3`),
        path.join(dirname, basename, `${n}-model.mp3`),
        q.modelAnswer,
        voiceId,
      );
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
    } else if (
      entry.isFile() &&
      entry.name.endsWith(".json") &&
      entry.name !== "index.json"
    ) {
      console.log(`\nProcessing: ${relPath}`);
      await generateForQuestion(fullPath, relPath);
    }
  }
}

async function main() {
  console.log("=== TTS Audio Generator ===");
  console.log(`Questions dir: ${QUESTIONS_DIR}`);
  console.log(`Audio output: ${AUDIO_OUT_DIR}`);
  console.log(`Voice pool: ${ALL_VOICE_IDS.length} voices`);

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

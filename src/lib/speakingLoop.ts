/**
 * The speaking loop: speak on a topic against the clock, measure fluency,
 * have a model rewrite what you meant into natural English, keep the 3–5
 * chunks you were missing, and drill them as spoken cards that are scheduled
 * on how fast the chunk comes out, not only on whether it does.
 */
import type { TimedWord } from "./speakingRate";

export interface Topic {
  id: string;
  kind: "interview" | "opinion" | "experience" | "process" | "rebuttal";
  prompt: string;
}

/** Interview topics first: they pay off on every repeat. */
export const TOPICS: Topic[] = [
  { id: "research", kind: "interview", prompt: "Explain your research to someone outside your field." },
  { id: "novelty", kind: "interview", prompt: "What motivated your research, and what is new about it compared with prior work?" },
  { id: "internship", kind: "interview", prompt: "Describe what you worked on during your internship at PLAID and what you learned." },
  { id: "why-program", kind: "interview", prompt: "Why do you want to join this graduate program, and why now?" },
  { id: "remote-work", kind: "opinion", prompt: "Is remote work better for research teams than working in the same lab? Give your opinion." },
  { id: "failure", kind: "experience", prompt: "Talk about a time a plan of yours failed and what you did next." },
  { id: "experiment", kind: "process", prompt: "Walk someone through how you design and run an experiment, step by step." },
  { id: "ai-languages", kind: "rebuttal", prompt: "Some people say AI translation makes learning English unnecessary. Argue against that view." },
];

/** Nation's 4/3/2: the same talk, with less time each round. */
export const ROUND_SECONDS = [240, 180, 120];
export const RETRY_SECONDS = 120;

/** Gaps at least this long split runs; shorter ones are word boundaries. */
export const PAUSE_SECONDS = 0.25;

export interface Fluency {
  /** Speaking span, first word to last. */
  seconds: number;
  syllablesPerSecond: number;
  /** Syllables between pauses of 250 ms or more. */
  meanLengthOfRun: number;
  pausesPerMinute: number;
  /** Share of pauses that fall inside a clause; null without word timings. */
  midClausePauseShare: number | null;
}

/** Vowel-group heuristic; Japanese (no Latin letters) counts as 0. */
export function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return 0;
  const groups = w
    .replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "")
    .replace(/^y/, "")
    .match(/[aeiouy]{1,2}/g);
  return Math.max(1, groups?.length ?? 0);
}

const CLAUSE_STARTERS = new Set(
  "and but so because which that when if or then who where while although though since after before however".split(
    " ",
  ),
);

const perMinute = (n: number, s: number) => (s > 0 ? (n / s) * 60 : 0);

/**
 * Pauses come from timestamp gaps, not the text: Whisper drops "um" and "uh",
 * so a filled pause shows up as a gap, which is what it is for fluency.
 */
export function fluencyFromWords(words: TimedWord[]): Fluency | null {
  if (words.length === 0) return null;
  const runs = [0];
  let pauses = 0;
  let midClause = 0;
  words.forEach((w, i) => {
    if (i > 0 && w.start - words[i - 1].end >= PAUSE_SECONDS) {
      pauses++;
      runs.push(0);
      const boundary =
        /[.,;:!?。、]$/.test(words[i - 1].word) ||
        CLAUSE_STARTERS.has(w.word.toLowerCase().replace(/[^a-z]/g, ""));
      if (!boundary) midClause++;
    }
    runs[runs.length - 1] += countSyllables(w.word);
  });
  const seconds = words[words.length - 1].end - words[0].start;
  const syllables = runs.reduce((a, b) => a + b, 0);
  return {
    seconds,
    syllablesPerSecond: seconds > 0 ? syllables / seconds : 0,
    meanLengthOfRun: syllables / runs.length,
    pausesPerMinute: perMinute(pauses, seconds),
    midClausePauseShare: pauses ? midClause / pauses : 0,
  };
}

/** Fallback when the transcriber returned no timings: voiced spans from the audio. */
export function fluencyFromSegments(
  segments: [number, number][],
  text: string,
): Fluency | null {
  if (segments.length === 0) return null;
  const seconds = segments[segments.length - 1][1] - segments[0][0];
  const syllables = text
    .split(/\s+/)
    .reduce((n, w) => n + countSyllables(w), 0);
  return {
    seconds,
    syllablesPerSecond: seconds > 0 ? syllables / seconds : 0,
    meanLengthOfRun: syllables / segments.length,
    pausesPerMinute: perMinute(segments.length - 1, seconds),
    midClausePauseShare: null,
  };
}

const FRAME_SECONDS = 0.02;

/**
 * Voiced spans in seconds, with gaps under PAUSE_SECONDS bridged: an RMS
 * energy gate, the fallback when the Silero model can't load (offline, tests).
 */
export function voicedSegments(
  samples: Float32Array,
  sampleRate: number,
): [number, number][] {
  const frame = Math.max(1, Math.round(sampleRate * FRAME_SECONDS));
  const rms: number[] = [];
  for (let i = 0; i + frame <= samples.length; i += frame) {
    let sum = 0;
    for (let j = i; j < i + frame; j++) sum += samples[j] * samples[j];
    rms.push(Math.sqrt(sum / frame));
  }
  if (rms.length === 0) return [];
  const sorted = [...rms].sort((a, b) => a - b);
  const floor = sorted[Math.floor(sorted.length * 0.1)];
  const peak = sorted[Math.floor(sorted.length * 0.98)];
  const threshold = Math.max(floor * 3, peak * 0.15, 0.005);
  const out: [number, number][] = [];
  rms.forEach((v, k) => {
    if (v < threshold) return;
    const t = k * FRAME_SECONDS;
    const last = out[out.length - 1];
    if (last && t - last[1] < PAUSE_SECONDS) last[1] = t + FRAME_SECONDS;
    else out.push([t, t + FRAME_SECONDS]);
  });
  return out.filter(([a, b]) => b - a >= 0.06);
}

/**
 * Silero VAD (via @ricky0123/vad-web), which unlike an energy gate ignores
 * breaths, keyboard clicks and room noise. Model and ONNX runtime come from
 * jsDelivr on first use, so neither weighs on the bundle.
 */
async function sileroSegments(samples: Float32Array): Promise<[number, number][]> {
  const { NonRealTimeVAD } = await import("@ricky0123/vad-web");
  const vad = await NonRealTimeVAD.new({
    modelURL:
      "https://cdn.jsdelivr.net/npm/@ricky0123/vad-web@0.0.31/dist/silero_vad_legacy.onnx",
    ortConfig: (ort) => {
      ort.env.wasm.wasmPaths = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${ort.env.versions.web}/dist/`;
      // Threads need cross-origin isolation, which the app doesn't set up.
      ort.env.wasm.numThreads = 1;
    },
    // A pause is a 250 ms gap; frames are 96 ms, so this bridges anything shorter.
    redemptionMs: PAUSE_SECONDS * 1000,
    preSpeechPadMs: 0,
    minSpeechMs: 96,
  });
  const out: [number, number][] = [];
  for await (const { start, end } of vad.run(samples, 16000))
    out.push([start / 1000, end / 1000]);
  return out;
}

export async function decodeVoiced(blob: Blob): Promise<[number, number][]> {
  const ctx = new OfflineAudioContext(1, 1, 16000);
  const buffer = await ctx.decodeAudioData(await blob.arrayBuffer());
  const samples = buffer.getChannelData(0);
  try {
    return await sileroSegments(samples);
  } catch {
    return voicedSegments(samples, buffer.sampleRate);
  }
}

export async function measureFluency(
  text: string,
  words: TimedWord[] | undefined,
  audio: Blob | null,
): Promise<Fluency | null> {
  if (words?.length) return fluencyFromWords(words);
  if (!audio) return null;
  return fluencyFromSegments(await decodeVoiced(audio).catch(() => []), text);
}

// ---- Analysis prompt --------------------------------------------------------

export interface Chunk {
  /** Situation and intent, in Japanese: the card's front, never a translation. */
  intent: string;
  chunk: string;
  /** The chunk inside a sentence from the natural version. */
  example: string;
  kind: "japanese" | "workaround" | "formula";
}

export interface Analysis {
  natural: string;
  chunks: Chunk[];
}

export function analysisPrompt(topic: string, transcript: string): string {
  return `You are coaching a Japanese graduate student (around TOEFL 90, CEFR B1–B2) to speak English fluently.
They answered the topic below out loud under time pressure. Where they got stuck they were allowed to switch to Japanese, so the transcript mixes English and Japanese. Speech recognition dropped fillers and may contain small errors.

## Topic
${topic}

## Transcript
${transcript}

## Task
1. Recover what the speaker meant, including the Japanese parts, and write it as natural spoken English one step above their level (B2–C1). Keep their content and structure; rewrite as little as possible. This becomes shadowing material, so it should sound like natural speech, not an essay.
2. Pick the 3–5 chunks most worth learning from the difference. Prioritize, in order:
   - "japanese": something they said in Japanese because they couldn't say it in English
   - "workaround": something they said in a long roundabout way
   - "formula": a place where a native speaker would use a fixed expression
   Ignore small grammar mistakes; do not pick chunks for them.
3. For each chunk, write "intent" in Japanese as the situation and what the speaker wants to do (e.g. 「相手の手法を認めつつ、自分の手法の違いを切り出したい」). Do not write a translation of the chunk.

## Output
Reply with JSON only, no code fence:
{"natural": "...", "chunks": [{"intent": "...", "chunk": "...", "example": "...", "kind": "japanese" | "workaround" | "formula"}]}`;
}

function parseJson(reply: string): unknown {
  const start = reply.indexOf("{");
  const end = reply.lastIndexOf("}");
  if (start < 0 || end < start) throw new Error("The reply has no JSON in it.");
  return JSON.parse(reply.slice(start, end + 1));
}

export function parseAnalysis(reply: string): Analysis {
  const body = parseJson(reply) as Partial<Analysis>;
  const chunks = (Array.isArray(body.chunks) ? body.chunks : []).filter(
    (c): c is Chunk =>
      typeof c?.chunk === "string" && typeof c?.intent === "string",
  );
  if (typeof body.natural !== "string" || chunks.length === 0)
    throw new Error("The reply is missing the natural version or the chunks.");
  return { natural: body.natural, chunks };
}

export function judgePrompt(card: Chunk, transcript: string): string {
  return `A learner saw this situation and had to say it out loud in English.
Situation: ${card.intent}
Target chunk: ${card.chunk}
What they said (speech recognition): ${transcript || "(nothing)"}

Correct if they used the target chunk or an equally natural, idiomatic expression for the same intent; minor recognition errors don't matter. Reply with JSON only: {"correct": true | false, "note": "one short sentence"}`;
}

export function parseJudge(reply: string): { correct: boolean; note: string } {
  const body = parseJson(reply) as { correct?: unknown; note?: unknown };
  return { correct: body.correct === true, note: String(body.note ?? "") };
}

// ---- Cards --------------------------------------------------------------------

export interface ChunkCard extends Chunk {
  id: string;
  topic: string;
  created: string;
  due: string;
  intervalDays: number;
  reps: number;
  lapses: number;
  /** Seconds from the card appearing to speech onset, latest last. */
  latencies: number[];
}

export function newCard(chunk: Chunk, topic: string, now: Date): ChunkCard {
  return {
    ...chunk,
    id: crypto.randomUUID(),
    topic,
    created: now.toISOString(),
    due: now.toISOString(),
    intervalDays: 0,
    reps: 0,
    lapses: 0,
    latencies: [],
  };
}

const DAY_MS = 86_400_000;
const RELEARN_MS = 10 * 60_000;

/**
 * Knowing a chunk isn't the goal; saying it without thinking is. A right
 * answer that took 3 s isn't automatic yet, so it comes back sooner; one out
 * within a second stretches the interval a lot.
 */
export function intervalFactor(latencySeconds: number): number {
  if (latencySeconds <= 1) return 3;
  if (latencySeconds <= 2) return 2;
  if (latencySeconds <= 3) return 1.3;
  return 0.6;
}

export function scheduleCard(
  card: ChunkCard,
  correct: boolean,
  latencySeconds: number,
  now: Date,
): ChunkCard {
  const latencies = [...card.latencies, latencySeconds].slice(-20);
  if (!correct) {
    return {
      ...card,
      reps: card.reps + 1,
      lapses: card.lapses + 1,
      intervalDays: 0,
      due: new Date(now.getTime() + RELEARN_MS).toISOString(),
      latencies,
    };
  }
  const intervalDays = Math.max(
    1,
    Math.max(1, card.intervalDays) * intervalFactor(latencySeconds),
  );
  return {
    ...card,
    reps: card.reps + 1,
    intervalDays,
    due: new Date(now.getTime() + intervalDays * DAY_MS).toISOString(),
    latencies,
  };
}

export const dueCards = (cards: ChunkCard[], now: Date) =>
  cards
    .filter((c) => Date.parse(c.due) <= now.getTime())
    .sort((a, b) => Date.parse(a.due) - Date.parse(b.due));

// ---- Storage ------------------------------------------------------------------

export interface LoopSession {
  id: string;
  date: string;
  topic: string;
  /** One per 4/3/2 round; null when nothing could be measured. */
  rounds: (Fluency | null)[];
  retry?: Fluency | null;
  transcript: string;
  natural?: string;
}

const CARDS_KEY = "speak-cards";
const SESSIONS_KEY = "speak-sessions";

function load<T>(key: string): T[] {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function save(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode / full storage */
  }
}

export const loadCards = () => load<ChunkCard>(CARDS_KEY);
export const saveCards = (cards: ChunkCard[]) => save(CARDS_KEY, cards);
export const loadSessions = () => load<LoopSession>(SESSIONS_KEY);

export function saveSession(session: LoopSession): void {
  const rest = loadSessions().filter((s) => s.id !== session.id);
  save(SESSIONS_KEY, [...rest, session]);
}

// ---- Backup ---------------------------------------------------------------------

export interface SpeakingBackup {
  cards: ChunkCard[];
  sessions: LoopSession[];
}

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === "string";
const isDate = (v: unknown) => isStr(v) && !Number.isNaN(Date.parse(v));

function isCard(v: unknown): v is ChunkCard {
  return (
    isObj(v) &&
    isStr(v.id) &&
    isStr(v.intent) &&
    isStr(v.chunk) &&
    isDate(v.due) &&
    typeof v.intervalDays === "number" &&
    Number.isFinite(v.intervalDays) &&
    Array.isArray(v.latencies)
  );
}

function isSession(v: unknown): v is LoopSession {
  return (
    isObj(v) &&
    isStr(v.id) &&
    isDate(v.date) &&
    isStr(v.topic) &&
    Array.isArray(v.rounds) &&
    v.rounds.every((r) => r === null || isObj(r))
  );
}

/**
 * Undefined for a backup made before the section existed; throws on a
 * malformed one, since the file comes from outside the app.
 */
export function parseSpeakingBackup(raw: unknown): SpeakingBackup | undefined {
  if (raw === undefined) return undefined;
  if (
    !isObj(raw) ||
    !Array.isArray(raw.cards) ||
    !Array.isArray(raw.sessions) ||
    !raw.cards.every(isCard) ||
    !raw.sessions.every(isSession)
  )
    throw new Error("The backup contains malformed speaking records; nothing imported.");
  return { cards: raw.cards, sessions: raw.sessions };
}

/** By id, the backup's copy wins, as attempts are put rather than added. */
export function mergeSpeaking({ cards, sessions }: SpeakingBackup): void {
  const merge = <T extends { id: string }>(mine: T[], theirs: T[]) => [
    ...mine.filter((m) => !theirs.some((t) => t.id === m.id)),
    ...theirs,
  ];
  saveCards(merge(loadCards(), cards));
  save(SESSIONS_KEY, merge(loadSessions(), sessions));
}

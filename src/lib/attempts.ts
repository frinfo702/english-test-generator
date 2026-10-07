/**
 * Attempts store what the learner did, not only how it was graded: a score
 * can't be re-graded by a better method (Listen & Repeat speed and pauses need
 * the audio). Scores and transcripts are a cache, labelled with the method
 * that produced them.
 */
import type { TaskId } from "../hooks/useScoreHistory";
import type { AiInterviewScores } from "./interviewScoring";
import type { PronunciationResult } from "./pronunciation";

export interface ItemResponse {
  itemId?: string;
  choice?: string | number;
  text?: string;
  order?: (number | null)[];
  misses?: number;
  audio?: Blob;
  // Wall-clock ms rather than offsets into the audio: latency spans the
  // prompt's playback and the recording, which have separate clocks.
  recordedAt?: number;
  promptEndedAt?: number;
  transcript?: string;
  /** The sentence or question as shown, so a later edit can't change history. */
  prompt?: string;
  assessment?: PronunciationResult;
  assessmentError?: string;
  ai?: { reply: string; scores: AiInterviewScores };
  /** 0–5 on the ETS rubric. */
  itemScore?: number;
}

export interface Attempt {
  id: string;
  taskId: TaskId;
  /** Optional only because the oldest localStorage scores never recorded it. */
  problemId?: string;
  date: string;
  elapsedSeconds?: number;
  responses: ItemResponse[];
  score?: { method: string; correct: number; total: number };
  /** Snapshot of the question JSON; question files get regenerated. */
  question?: unknown;
}

export const RUBRIC_METHOD = "ets-rubric";

/** Undefined until an item is scored: an empty 0/0 score breaks every chart. */
export function rubricScore(
  responses: ItemResponse[],
): Attempt["score"] | undefined {
  const scored = responses.filter((r) => r.itemScore !== undefined);
  if (scored.length === 0) return undefined;
  return {
    method: RUBRIC_METHOD,
    correct: scored.reduce((sum, r) => sum + r.itemScore!, 0),
    total: scored.length * 5,
  };
}

const DB_NAME = "english-test";
const STORE = "attempts";

function request<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function committed(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = tx.onabort = () => reject(tx.error);
  });
}

async function putAll(db: IDBDatabase, attempts: Attempt[]): Promise<void> {
  const tx = db.transaction(STORE, "readwrite");
  const store = tx.objectStore(STORE);
  attempts.forEach((a) => store.put(a));
  await committed(tx);
}

/**
 * Append-only: a shipped step has already run in some browsers, so editing it
 * would leave their data different from a fresh install's.
 */
const UPGRADES: ((db: IDBDatabase, tx: IDBTransaction) => void)[] = [
  (db) => {
    db.createObjectStore(STORE, { keyPath: "id" });
  },
];

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  dbPromise ??= (async () => {
    const req = indexedDB.open(DB_NAME, UPGRADES.length);
    req.onupgradeneeded = (e) => {
      for (const step of UPGRADES.slice(e.oldVersion)) {
        step(req.result, req.transaction!);
      }
    };
    const db = await request(req);
    // Best-effort storage can be evicted, and there is no server copy.
    void navigator.storage?.persist?.().catch(() => undefined);
    return db;
  })().catch((e) => {
    dbPromise = null;
    throw e;
  });
  return dbPromise;
}

export async function saveAttempt(
  attempt: Omit<Attempt, "id" | "date">,
): Promise<Attempt> {
  const saved: Attempt = {
    ...attempt,
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
  };
  await putAll(await openDb(), [saved]);
  return saved;
}

/** put, not add: re-importing a backup must overwrite, not fail on its IDs. */
export async function putAttempts(attempts: Attempt[]): Promise<void> {
  await putAll(await openDb(), attempts);
}

export async function getAttempt(id: string): Promise<Attempt | undefined> {
  const db = await openDb();
  return request<Attempt | undefined>(
    db.transaction(STORE).objectStore(STORE).get(id),
  );
}

export async function getAllAttempts(): Promise<Attempt[]> {
  const db = await openDb();
  const all = await request<Attempt[]>(
    db.transaction(STORE).objectStore(STORE).getAll(),
  );
  // Keys are random UUIDs, so store order says nothing about time.
  return all.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

export async function clearAttempts(): Promise<void> {
  const tx = (await openDb()).transaction(STORE, "readwrite");
  tx.objectStore(STORE).clear();
  await committed(tx);
}

const BACKUP_FORMAT = "english-test-generator/backup";
const BACKUP_VERSION = 1;

/** Audio as data: URLs keeps a backup one self-contained JSON file. */
export type BackupAttempt = Omit<Attempt, "responses"> & {
  responses: (Omit<ItemResponse, "audio"> & { audio?: string })[];
};

async function blobToDataUrl(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = "";
  // Chunked: spreading a whole recording into one call overflows the stack.
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return `data:${blob.type};base64,${btoa(binary)}`;
}

export async function exportBackup(includeAudio: boolean): Promise<Blob> {
  const attempts: BackupAttempt[] = await Promise.all(
    (await getAllAttempts()).map(async (a) => ({
      ...a,
      responses: await Promise.all(
        a.responses.map(async ({ audio, ...rest }) =>
          audio && includeAudio
            ? { ...rest, audio: await blobToDataUrl(audio) }
            : rest,
        ),
      ),
    })),
  );
  const backup = {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    attempts,
  };
  return new Blob([JSON.stringify(backup)], { type: "application/json" });
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const isString = (v: unknown): v is string => typeof v === "string";
const isFiniteNumber = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);
const isOptional = (v: unknown, check: (v: unknown) => boolean) =>
  v === undefined || check(v);

/** The file comes from outside the app, so nothing in it is trusted yet. */
export function isBackupAttempt(value: unknown): value is BackupAttempt {
  if (!isRecord(value)) return false;
  const { id, taskId, date, problemId, elapsedSeconds, responses, score } =
    value;
  return (
    isString(id) &&
    id !== "" &&
    // Any string rather than today's task list: a backup from a newer
    // version would otherwise be refused whole.
    isString(taskId) &&
    isString(date) &&
    !Number.isNaN(Date.parse(date)) &&
    isOptional(problemId, isString) &&
    isOptional(elapsedSeconds, isFiniteNumber) &&
    Array.isArray(responses) &&
    responses.every((r) => isRecord(r) && isOptional(r.audio, isString)) &&
    isOptional(
      score,
      (s) =>
        isRecord(s) &&
        isString(s.method) &&
        isFiniteNumber(s.correct) &&
        isFiniteNumber(s.total) &&
        // A zero total turns the percentage, and every chart using it, NaN.
        s.total > 0,
    )
  );
}

export async function importBackup(file: Blob): Promise<number> {
  let parsed: { format?: unknown; version?: unknown; attempts?: unknown };
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    throw new Error("That file is not valid JSON.");
  }
  if (parsed?.format !== BACKUP_FORMAT || !Array.isArray(parsed.attempts)) {
    throw new Error("That file is not a backup from this app.");
  }
  if (parsed.version !== BACKUP_VERSION) {
    throw new Error(`Unsupported backup version: ${String(parsed.version)}.`);
  }
  const records: unknown[] = parsed.attempts;
  // All or nothing: a half-imported backup is harder to reason about.
  if (!records.every(isBackupAttempt)) {
    throw new Error("The backup contains malformed records; nothing imported.");
  }
  const attempts: Attempt[] = await Promise.all(
    records.map(async (a) => ({
      ...a,
      responses: await Promise.all(
        a.responses.map(async ({ audio, ...rest }) => {
          if (audio === undefined) return rest;
          // Only inline data: never let an imported file make us fetch a URL.
          if (!audio.startsWith("data:")) {
            throw new Error("The backup contains a non-inline audio URL.");
          }
          const bytes = await (await fetch(audio)).blob();
          // fetch() drops MIME parameters such as ";codecs=opus"; keep them.
          const type = audio.slice("data:".length, audio.indexOf(";base64,"));
          return { ...rest, audio: new Blob([bytes], { type }) };
        }),
      ),
    })),
  );
  await putAttempts(attempts);
  return attempts.length;
}

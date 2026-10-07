/**
 * Study history, kept in this browser's IndexedDB. The browser is the
 * account: there is no server copy, so backups go through export/import.
 *
 * An attempt records what the learner actually did (choices, typed text,
 * recordings, timings), not how it was graded. Scores and transcripts are
 * derived from those facts and kept only as a cache, labelled with the method
 * that produced them, so a better scorer can recompute them later.
 */
import type { TaskId } from "../hooks/useScoreHistory";

export interface ItemResponse {
  /** Question/sentence ID in the problem file; absent for single-answer tasks. */
  itemId?: string;
  /** Picked option: a letter ("A") or an index, as the problem file keys them. */
  choice?: string | number;
  /** Typed answer, or the words built so far (Dictation). */
  text?: string;
  /** Chunk index in each slot, in slot order (Build a Sentence). */
  order?: (number | null)[];
  /** Wrong taps before the sentence was finished (Dictation). */
  misses?: number;
  /** Spoken answer. */
  audio?: Blob;
  /** Epoch ms when the recording started: the audio's t=0. */
  recordedAt?: number;
  /** Epoch ms when the prompt audio finished playing, for response latency. */
  promptEndedAt?: number;
  /** Derived: speech-to-text of `audio` at save time. */
  transcript?: string;
}

export interface Attempt {
  id: string;
  taskId: TaskId;
  /** Question file ID. Absent on legacy records saved without one. */
  problemId?: string;
  /** ISO time the attempt finished. */
  date: string;
  elapsedSeconds?: number;
  responses: ItemResponse[];
  /** Derived: what `method` scored at save time. Absent for ungraded tasks. */
  score?: { method: string; correct: number; total: number };
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
 * Database upgrades, one per version, applied in order when the database
 * opens: entry N upgrades version N to N+1, and the database version is the
 * list length. The browser runs pending steps before anything can read, so
 * upgrades are automatic. Never edit a shipped step; append a new one. A step
 * that reshapes records reads and rewrites them through `tx`.
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
    // Ask the browser not to evict our data under storage pressure.
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

/** Stores attempts as they are; one with an existing ID replaces it. */
export async function putAttempts(attempts: Attempt[]): Promise<void> {
  await putAll(await openDb(), attempts);
}

/** Every attempt, oldest first. */
export async function getAllAttempts(): Promise<Attempt[]> {
  const db = await openDb();
  const all = await request<Attempt[]>(
    db.transaction(STORE).objectStore(STORE).getAll(),
  );
  return all.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

export async function clearAttempts(): Promise<void> {
  const tx = (await openDb()).transaction(STORE, "readwrite");
  tx.objectStore(STORE).clear();
  await committed(tx);
}

// ── Backup file ────────────────────────────────────────────────────────────

const BACKUP_FORMAT = "english-test-generator/backup";
const BACKUP_VERSION = 1;

/** An attempt as written to a backup: audio becomes a data: URL, or is dropped. */
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

// ponytail: whole backup is built as one string in memory; stream it (or zip
// audio separately) if exports with audio grow past a few hundred MB.
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

/**
 * Whether one record from an imported backup is safe to store.
 * The file comes from outside the app, so nothing in it is trusted yet.
 */
export function isBackupAttempt(value: unknown): value is BackupAttempt {
  // TODO(human)
  return typeof value === "object" && value !== null;
}

/**
 * Adds a backup's attempts to this browser. Attempts are keyed by ID and never
 * edited, so importing the same file twice changes nothing.
 * @returns how many attempts the file held
 */
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

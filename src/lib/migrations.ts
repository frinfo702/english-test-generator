/**
 * History saved before the move to IndexedDB, still in localStorage.
 *
 * Unlike database upgrades (see UPGRADES in attempts.ts), this move lives in
 * a separate store, so it can wait for the learner: LegacyHistoryNotice asks
 * before running it. Delete this file once nobody has pre-IndexedDB history.
 */
import type { TaskId } from "../hooks/useScoreHistory";
import { putAttempts, type Attempt } from "./attempts";

const LEGACY_SCORES = "score-history";
const LEGACY_ANSWERS = "answer-history";

export interface LegacyScore {
  taskId: TaskId;
  date: string;
  correct: number;
  total: number;
  elapsedSeconds?: number;
  questionFile?: string;
}

export interface LegacyAnswer {
  answerId: string;
  taskId: TaskId;
  /** e.g. "toefl/speaking/interview/001#q2" */
  problemId: string;
  response: string;
  date: string;
}

/** Legacy scores kept no responses, so they carry only the score. */
export function fromLegacyScore(e: LegacyScore): Attempt {
  return {
    // Deterministic, so re-running an interrupted migration can't duplicate.
    id: `legacy-score:${e.date}:${e.taskId}`,
    taskId: e.taskId,
    problemId: e.questionFile?.replace(/\.json$/i, ""),
    date: e.date,
    elapsedSeconds: e.elapsedSeconds,
    responses: [],
    score: { method: "legacy", correct: e.correct, total: e.total },
  };
}

export function fromLegacyAnswer(e: LegacyAnswer): Attempt {
  const [path, itemId] = e.problemId.split("#");
  // Interview answers were speech-to-text output, not typed text.
  const spoken = e.taskId === "toefl/speaking/interview";
  return {
    id: e.answerId,
    taskId: e.taskId,
    problemId: path.slice(path.lastIndexOf("/") + 1),
    date: e.date,
    responses: [
      spoken
        ? { itemId, transcript: e.response }
        : { itemId, text: e.response },
    ],
  };
}

function readLegacy<T>(key: string): T[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(key) ?? "[]");
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

/** How many old records are waiting to be moved; 0 means nothing to ask. */
export function legacyHistoryCount(): number {
  return readLegacy(LEGACY_SCORES).length + readLegacy(LEGACY_ANSWERS).length;
}

export function discardLegacyHistory(): void {
  localStorage.removeItem(LEGACY_SCORES);
  localStorage.removeItem(LEGACY_ANSWERS);
}

/** Copies the old records into IndexedDB, then removes them. */
export async function migrateLegacyHistory(): Promise<number> {
  const legacy = [
    ...readLegacy<LegacyScore>(LEGACY_SCORES).map(fromLegacyScore),
    ...readLegacy<LegacyAnswer>(LEGACY_ANSWERS).map(fromLegacyAnswer),
  ];
  await putAttempts(legacy);
  // Only after the write committed, so a failure keeps the originals.
  discardLegacyHistory();
  return legacy.length;
}

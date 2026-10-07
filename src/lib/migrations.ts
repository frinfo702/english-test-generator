/**
 * Unlike UPGRADES in attempts.ts, this move waits for the learner's consent:
 * the old data sits in localStorage, so nothing is blocked until it runs.
 * Delete this file once nobody has pre-IndexedDB history.
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
  problemId: string;
  response: string;
  date: string;
}

/** Responses stay empty: the old format never kept them. */
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

export function legacyHistoryCount(): number {
  return readLegacy(LEGACY_SCORES).length + readLegacy(LEGACY_ANSWERS).length;
}

export function discardLegacyHistory(): void {
  localStorage.removeItem(LEGACY_SCORES);
  localStorage.removeItem(LEGACY_ANSWERS);
}

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

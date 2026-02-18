import { useCallback } from "react";

// タスク識別子（ルートパスと対応）
export type TaskId =
  | "toefl/reading/complete-words"
  | "toefl/reading/daily-life"
  | "toefl/reading/academic"
  | "toefl/writing/build-sentence"
  | "toefl/writing/email"
  | "toefl/writing/discussion"
  | "toefl/speaking/listen-repeat"
  | "toefl/speaking/interview"
  | "toeic/part5"
  | "toeic/part6"
  | "toeic/part7";

export interface ScoreEntry {
  taskId: TaskId;
  date: string;       // ISO 8601
  correct: number;
  total: number;
  pct: number;        // 0-100
}

const STORAGE_KEY = "eng_score_history";

function readAll(): ScoreEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ScoreEntry[];
  } catch {
    return [];
  }
}

function writeAll(entries: ScoreEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function useScoreHistory() {
  const saveScore = useCallback(
    (taskId: TaskId, correct: number, total: number) => {
      if (total === 0) return;
      const entry: ScoreEntry = {
        taskId,
        date: new Date().toISOString(),
        correct,
        total,
        pct: Math.round((correct / total) * 100),
      };
      const entries = readAll();
      entries.push(entry);
      writeAll(entries);
    },
    []
  );

  const getAll = useCallback((): ScoreEntry[] => {
    return readAll();
  }, []);

  const getByTask = useCallback((taskId: TaskId): ScoreEntry[] => {
    return readAll().filter((e) => e.taskId === taskId);
  }, []);

  const clearAll = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { saveScore, getAll, getByTask, clearAll };
}

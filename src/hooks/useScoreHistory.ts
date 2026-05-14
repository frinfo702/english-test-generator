import { useCallback } from "react";

export type TaskId =
  | "toefl/reading/complete-words"
  | "toefl/reading/daily-life"
  | "toefl/reading/academic"
  | "toefl/listening/conversation"
  | "toefl/listening/lecture"
  | "toefl/listening/response"
  | "toefl/writing/build-sentence"
  | "toefl/writing/email"
  | "toefl/writing/discussion"
  | "toefl/speaking/listen-repeat"
  | "toefl/speaking/interview"
  | "toeic/part2"
  | "toeic/part3"
  | "toeic/part4"
  | "toeic/part5"
  | "toeic/part6"
  | "toeic/part7"
  | "shadowing";

export interface ScoreEntry {
  taskId: TaskId;
  date: string;
  correct: number;
  total: number;
  pct: number;
  elapsedSeconds?: number;
  questionFile?: string;
}

const STORAGE_KEY = "score-history";

function readScores(): ScoreEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ScoreEntry[]) : [];
  } catch {
    return [];
  }
}

function writeScores(entries: ScoreEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function useScoreHistory() {
  const saveScore = useCallback(
    async (
      taskId: TaskId,
      correct: number,
      total: number,
      elapsedSeconds = 0,
      questionFile?: string,
    ) => {
      if (total === 0) return;
      const entry: ScoreEntry = {
        taskId,
        date: new Date().toISOString(),
        correct,
        total,
        pct: Math.round((correct / total) * 100),
        elapsedSeconds: Math.max(0, Math.floor(elapsedSeconds)),
      };
      if (questionFile) {
        entry.questionFile = questionFile;
      }
      const entries = readScores();
      entries.push(entry);
      writeScores(entries);
    },
    [],
  );

  const getAll = useCallback(async (): Promise<ScoreEntry[]> => {
    return readScores();
  }, []);

  const clearAll = useCallback(async () => {
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { saveScore, getAll, clearAll };
}

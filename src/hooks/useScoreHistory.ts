import { useCallback } from "react";

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
  date: string; // ISO 8601
  correct: number;
  total: number;
  pct: number; // 0-100
  elapsedSeconds?: number;
  questionFile?: string;
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
      await fetch("/api/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry),
      });
    },
    [],
  );

  const getAll = useCallback(async (): Promise<ScoreEntry[]> => {
    const res = await fetch("/api/scores");
    return res.json();
  }, []);

  const clearAll = useCallback(async () => {
    await fetch("/api/scores", { method: "DELETE" });
  }, []);

  return { saveScore, getAll, clearAll };
}

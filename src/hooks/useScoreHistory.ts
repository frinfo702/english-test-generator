import { useCallback } from "react";
import {
  clearAttempts,
  getAllAttempts,
  saveAttempt,
  type Attempt,
  type ItemResponse,
} from "../lib/attempts";
import { questionIdFromFile } from "../lib/questions";

export type TaskId =
  | "toefl/reading/complete-words"
  | "toefl/reading/daily-life"
  | "toefl/reading/academic"
  | "toefl/listening/conversation"
  | "toefl/listening/lecture"
  | "toefl/listening/response"
  | "toefl/listening/announcement"
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
  | "shadowing"
  | "dictation";

/** A graded attempt, flattened for charts and lists. */
export interface ScoreEntry {
  taskId: TaskId;
  date: string;
  correct: number;
  total: number;
  pct: number;
  elapsedSeconds?: number;
  problemId?: string;
}

export interface SaveScoreInput {
  taskId: TaskId;
  /** Question file the attempt was on, e.g. "001.json". */
  file?: string;
  correct: number;
  total: number;
  elapsedSeconds?: number;
  /** What the learner actually did, item by item. */
  responses: ItemResponse[];
  /** How correct/total were computed. */
  method?: string;
}

function toScoreEntry(a: Attempt): ScoreEntry[] {
  if (!a.score) return [];
  const { correct, total } = a.score;
  return [
    {
      taskId: a.taskId,
      date: a.date,
      correct,
      total,
      pct: Math.round((correct / total) * 100),
      elapsedSeconds: a.elapsedSeconds,
      problemId: a.problemId,
    },
  ];
}

export function useScoreHistory() {
  const saveScore = useCallback(
    async ({
      taskId,
      file,
      correct,
      total,
      elapsedSeconds = 0,
      responses,
      method = "answer-key",
    }: SaveScoreInput) => {
      if (total === 0) return;
      await saveAttempt({
        taskId,
        problemId: file ? questionIdFromFile(file) : undefined,
        elapsedSeconds: Math.max(0, Math.floor(elapsedSeconds)),
        responses,
        score: { method, correct, total },
      });
    },
    [],
  );

  const getAll = useCallback(
    async (): Promise<ScoreEntry[]> =>
      (await getAllAttempts()).flatMap(toScoreEntry),
    [],
  );

  /** Deletes every attempt, graded or not, recordings included. */
  const clearAll = useCallback(() => clearAttempts(), []);

  return { saveScore, getAll, clearAll };
}

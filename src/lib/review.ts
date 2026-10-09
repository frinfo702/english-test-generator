/**
 * Review and recall over the saved history. FSRS comes from ts-fsrs
 * (open-spaced-repetition, MIT); nothing here is taken from Anki.
 *
 * The schedule is not stored: each attempt is one FSRS review, so a
 * question's card is its attempts replayed oldest first. History saved before
 * this feature therefore schedules like any other, and answering a question
 * anywhere in the app — practice, a practice test, or recall — reschedules it.
 *
 * Only reading and listening are reviewed: their answers are right or wrong,
 * while writing and speaking get rubric scores with no clear pass.
 */
import { createEmptyCard, fsrs, Rating, type Card, type Grade } from "ts-fsrs";
import type { TaskId } from "../hooks/useScoreHistory";
import type { Attempt } from "./attempts";
import { TRIAL_TASK_ID, type SectionKey } from "./trial";

/**
 * Long-term only: same-day learning steps would bring a whole passage back
 * minutes after it was read, while it is still remembered.
 */
const scheduler = fsrs({ enable_short_term: false });

/**
 * Full marks recalled the question (Good). Partial credit, the only other
 * signal the app records, is Hard when at least half was right and Again
 * below that. Unscored attempts rate nothing.
 */
export function ratingFor(score: Attempt["score"]): Grade | null {
  if (!score) return null;
  if (score.correct >= score.total) return Rating.Good;
  return score.correct * 2 >= score.total ? Rating.Hard : Rating.Again;
}

export type Test = "toefl" | "toeic" | "other";
export type Difficulty = "easy" | "medium" | "hard";

export function testOf(taskId: TaskId): Test {
  return taskId.startsWith("toefl/")
    ? "toefl"
    : taskId.startsWith("toeic/")
      ? "toeic"
      : "other";
}

export function sectionOf(taskId: TaskId): SectionKey {
  if (taskId.startsWith("toefl/")) return taskId.split("/")[1] as SectionKey;
  if (taskId === "shadowing") return "speaking";
  if (taskId === "dictation") return "listening";
  return ["toeic/part2", "toeic/part3", "toeic/part4"].includes(taskId)
    ? "listening"
    : "reading";
}

/**
 * Tiers of `readingGrade`, the text difficulty practice tests already route
 * by; the cuts are roughly the terciles of the question bank.
 */
export function difficultyOf(grade: number): Difficulty {
  return grade < 5 ? "easy" : grade < 8.5 ? "medium" : "hard";
}

export interface ReviewItem {
  /** `taskId/problemId`, which is also the question's practice route. */
  key: string;
  taskId: TaskId;
  problemId: string;
  /** Oldest first. */
  attempts: Attempt[];
  latest: Attempt;
  /** Latest graded result; null until an attempt is scored. */
  correct: boolean | null;
  /** Scored attempts that were not full marks. */
  mistakes: number;
  /** Share of scored items answered right; null until an attempt is scored. */
  accuracy: number | null;
  /** Date of the latest scored attempt that was not full marks. */
  lastWrong: string | null;
  /** Null until an attempt is scored: there is nothing to schedule yet. */
  card: Card | null;
}

/** @param attempts oldest first, as `getAllAttempts` returns them */
export function buildReviewItems(attempts: Attempt[]): ReviewItem[] {
  const byKey = new Map<string, Attempt[]>();
  for (const a of attempts) {
    // No problemId (the oldest scores) means no question to show or recall.
    if (a.taskId === TRIAL_TASK_ID || !a.problemId) continue;
    const section = sectionOf(a.taskId);
    if (section === "writing" || section === "speaking") continue;
    const key = `${a.taskId}/${a.problemId}`;
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key)!.push(a);
  }
  return [...byKey].map(([key, group]) => {
    let card: Card | null = null;
    let correct: boolean | null = null;
    let mistakes = 0;
    let lastWrong: string | null = null;
    let right = 0;
    let asked = 0;
    for (const a of group) {
      const grade = ratingFor(a.score);
      if (grade === null) continue;
      const at = new Date(a.date);
      card = scheduler.next(card ?? createEmptyCard(at), at, grade).card;
      correct = grade === Rating.Good;
      right += a.score!.correct;
      asked += a.score!.total;
      if (!correct) {
        mistakes++;
        lastWrong = a.date;
      }
    }
    return {
      key,
      taskId: group[0].taskId,
      problemId: group[0].problemId!,
      attempts: group,
      latest: group[group.length - 1],
      correct,
      mistakes,
      accuracy: asked ? right / asked : null,
      lastWrong,
      card,
    };
  });
}

/** Recall serves a question at this prefix plus its key. */
export const RECALL_PATH = "/review/recall/";

export const isDue = (item: ReviewItem, now: Date) =>
  item.card !== null && item.card.due <= now;

/** What recall serves, most overdue first. */
export function dueItems(items: ReviewItem[], now: Date): ReviewItem[] {
  return items
    .filter((i) => isDue(i, now))
    .sort((a, b) => a.card!.due.getTime() - b.card!.due.getTime());
}

export type ReviewSort = "mistakes" | "accuracy" | "recent-wrong" | "due";

/** Weakest first by the chosen measure; items without one go last. */
const SORT_KEYS: Record<ReviewSort, (i: ReviewItem) => number> = {
  mistakes: (i) => -i.mistakes,
  accuracy: (i) => i.accuracy ?? Infinity,
  "recent-wrong": (i) => (i.lastWrong ? -Date.parse(i.lastWrong) : Infinity),
  due: (i) => i.card?.due.getTime() ?? Infinity,
};

/** A sort named in a URL; anything unknown falls back to most mistakes. */
export const toSort = (value: string | null): ReviewSort =>
  value && Object.hasOwn(SORT_KEYS, value) ? (value as ReviewSort) : "mistakes";

/** Stable, so ties keep the order they came in. */
export function sortItems(items: ReviewItem[], by: ReviewSort): ReviewItem[] {
  const key = SORT_KEYS[by];
  return [...items].sort((a, b) => {
    const x = key(a);
    const y = key(b);
    return x === y ? 0 : x < y ? -1 : 1;
  });
}

/** Every set field must match; unset fields don't filter. */
export interface ReviewFilter {
  test?: Test;
  section?: "reading" | "listening";
  taskId?: TaskId;
  difficulty?: Difficulty;
  minMistakes?: number;
  result?: "correct" | "incorrect";
  dueOnly?: boolean;
}

export function filterItems(
  items: ReviewItem[],
  f: ReviewFilter,
  now: Date,
  /** Known once the question files load; unknown never matches a difficulty. */
  difficulty: ReadonlyMap<string, Difficulty> = new Map(),
): ReviewItem[] {
  return items.filter(
    (i) =>
      (!f.test || testOf(i.taskId) === f.test) &&
      (!f.section || sectionOf(i.taskId) === f.section) &&
      (!f.taskId || i.taskId === f.taskId) &&
      (!f.difficulty || difficulty.get(i.key) === f.difficulty) &&
      i.mistakes >= (f.minMistakes ?? 0) &&
      (!f.result || i.correct === (f.result === "correct")) &&
      (!f.dueOnly || isDue(i, now)),
  );
}

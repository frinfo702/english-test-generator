import { describe, expect, it } from "vitest";
import { Rating, State } from "ts-fsrs";
import type { TaskId } from "../hooks/useScoreHistory";
import type { Attempt } from "./attempts";
import { fromLegacyScore } from "./migrations";
import {
  buildReviewItems,
  difficultyOf,
  dueItems,
  filterItems,
  ratingFor,
  sectionOf,
  sortItems,
  testOf,
  type Difficulty,
} from "./review";

const DAY = 86_400_000;
const T0 = Date.parse("2026-09-01T09:00:00Z");

let n = 0;
function attempt(
  taskId: TaskId,
  problemId: string,
  day: number,
  correct?: number,
  total = 10,
): Attempt {
  return {
    id: `a${n++}`,
    taskId,
    problemId,
    date: new Date(T0 + day * DAY).toISOString(),
    responses: [],
    score:
      correct === undefined
        ? undefined
        : { method: "answer-key", correct, total },
  };
}

const at = (day: number) => new Date(T0 + day * DAY);
const days = (d: Date, day: number) => (d.getTime() - at(day).getTime()) / DAY;

describe("ratingFor", () => {
  it("maps full marks, partial credit and misses to Good, Hard, Again", () => {
    expect(ratingFor({ method: "x", correct: 10, total: 10 })).toBe(
      Rating.Good,
    );
    expect(ratingFor({ method: "x", correct: 5, total: 10 })).toBe(Rating.Hard);
    expect(ratingFor({ method: "x", correct: 4, total: 10 })).toBe(
      Rating.Again,
    );
    expect(ratingFor({ method: "x", correct: 0, total: 1 })).toBe(Rating.Again);
  });

  it("rates nothing for an unscored attempt", () => {
    expect(ratingFor(undefined)).toBeNull();
  });
});

describe("buildReviewItems", () => {
  it("groups by question and counts attempts and mistakes", () => {
    const items = buildReviewItems([
      attempt("toeic/part5", "001", 0, 6),
      attempt("toeic/part5", "002", 0, 10),
      attempt("toeic/part5", "001", 1, 10),
      attempt("toefl/trial", "x", 1),
    ]);
    expect(items.map((i) => i.key)).toEqual([
      "toeic/part5/001",
      "toeic/part5/002",
    ]);
    const [first] = items;
    expect(first.attempts).toHaveLength(2);
    expect(first.mistakes).toBe(1);
    expect(first.correct).toBe(true);
    expect(first.latest.date).toBe(at(1).toISOString());
  });

  it("schedules a full-marks answer further out than a miss", () => {
    const [good, again] = buildReviewItems([
      attempt("toeic/part5", "good", 0, 10),
      attempt("toeic/part5", "again", 0, 2),
    ]);
    expect(good.card!.state).toBe(State.Review);
    expect(days(good.card!.due, 0)).toBeGreaterThan(days(again.card!.due, 0));
    expect(days(again.card!.due, 0)).toBeGreaterThanOrEqual(1);
  });

  it("grows the interval with each successful recall and resets on a lapse", () => {
    const [once] = buildReviewItems([attempt("toeic/part5", "1", 0, 10)]);
    const [twice] = buildReviewItems([
      attempt("toeic/part5", "1", 0, 10),
      attempt("toeic/part5", "1", days(once.card!.due, 0), 10),
    ]);
    const firstGap = days(once.card!.due, 0);
    const secondGap = twice.card!.due.getTime() - once.card!.due.getTime();
    expect(secondGap / DAY).toBeGreaterThan(firstGap);

    const lapsed = buildReviewItems([
      attempt("toeic/part5", "1", 0, 10),
      attempt("toeic/part5", "1", days(once.card!.due, 0), 1),
    ])[0];
    expect(lapsed.card!.lapses).toBe(1);
    expect(lapsed.correct).toBe(false);
  });

  it("is due once its due date passes, most overdue first", () => {
    const items = buildReviewItems([
      attempt("toeic/part5", "late", 0, 1),
      attempt("toeic/part5", "later", 3, 1),
      attempt("toeic/part5", "fresh", 3, 10),
    ]);
    expect(dueItems(items, at(0))).toEqual([]);
    expect(dueItems(items, at(5)).map((i) => i.problemId)).toEqual([
      "late",
      "later",
    ]);
  });
});

describe("writing and speaking", () => {
  it("are left out of review and recall", () => {
    const items = buildReviewItems([
      attempt("toefl/writing/email", "w1", 0, 4, 5),
      attempt("toefl/writing/build-sentence", "b1", 0, 3, 10),
      attempt("toefl/speaking/interview", "s1", 0, 3, 5),
      attempt("shadowing", "sh1", 0, 2, 5),
      attempt("toefl/reading/academic", "r1", 0, 3, 10),
    ]);
    expect(items.map((i) => i.problemId)).toEqual(["r1"]);
    expect(dueItems(items, at(100)).map((i) => i.problemId)).toEqual(["r1"]);
  });
});

describe("history saved before review existed", () => {
  it("replays every scored attempt as a review instead of starting over", () => {
    const old = [
      fromLegacyScore({
        taskId: "toeic/part5",
        date: at(0).toISOString(),
        correct: 3,
        total: 10,
        questionFile: "007.json",
      }),
      attempt("toeic/part5", "007", 2, 10),
    ];
    const [item] = buildReviewItems(old);
    expect(item.key).toBe("toeic/part5/007");
    expect(item.card!.reps).toBe(2);
    expect(item.card!.last_review).toEqual(at(2));
    expect(item.mistakes).toBe(1);
  });

  it("lists unscored answers without scheduling them", () => {
    const [item] = buildReviewItems([attempt("toeic/part7", "003", 0)]);
    expect(item.card).toBeNull();
    expect(item.correct).toBeNull();
    expect(item.accuracy).toBeNull();
    expect(dueItems([item], at(100))).toEqual([]);
  });

  it("skips scores that never recorded which question they were", () => {
    const noFile = fromLegacyScore({
      taskId: "toeic/part5",
      date: at(0).toISOString(),
      correct: 1,
      total: 2,
    });
    expect(buildReviewItems([noFile])).toEqual([]);
  });
});

describe("filterItems", () => {
  const items = buildReviewItems([
    attempt("toefl/reading/academic", "r1", 0, 2),
    attempt("toefl/reading/academic", "r1", 2, 3),
    attempt("toefl/listening/lecture", "l1", 0, 10),
    attempt("toeic/part5", "p1", 0, 1),
    attempt("toeic/part2", "p2", 0, 10),
    attempt("dictation", "d1", 0, 10),
  ]);
  const keys = (
    f: Parameters<typeof filterItems>[1],
    d?: Map<string, Difficulty>,
  ) => filterItems(items, f, at(30), d).map((i) => i.problemId);

  it("classifies tests and sections", () => {
    expect(testOf("toeic/part2")).toBe("toeic");
    expect(testOf("dictation")).toBe("other");
    expect(sectionOf("toeic/part2")).toBe("listening");
    expect(sectionOf("toeic/part7")).toBe("reading");
    expect(sectionOf("toefl/writing/email")).toBe("writing");
    expect(sectionOf("shadowing")).toBe("speaking");
  });

  it("returns everything with no filter set", () => {
    expect(keys({})).toEqual(["r1", "l1", "p1", "p2", "d1"]);
  });

  it("combines test, section and result", () => {
    expect(keys({ section: "reading" })).toEqual(["r1", "p1"]);
    expect(keys({ section: "reading", test: "toeic" })).toEqual(["p1"]);
    expect(keys({ section: "listening", result: "correct" })).toEqual([
      "l1",
      "p2",
      "d1",
    ]);
    expect(keys({ test: "toefl", result: "incorrect" })).toEqual(["r1"]);
  });

  it("filters by question type and mistake count", () => {
    expect(keys({ taskId: "toeic/part5" })).toEqual(["p1"]);
    expect(keys({ minMistakes: 1 })).toEqual(["r1", "p1"]);
    expect(keys({ minMistakes: 2 })).toEqual(["r1"]);
    expect(keys({ minMistakes: 2, test: "toeic" })).toEqual([]);
  });

  it("filters by difficulty, leaving out questions not yet graded", () => {
    const d = new Map<string, Difficulty>([
      ["toefl/reading/academic/r1", difficultyOf(7)],
      ["toeic/part5/p1", difficultyOf(12)],
    ]);
    expect(keys({ difficulty: "medium" }, d)).toEqual(["r1"]);
    expect(keys({ difficulty: "hard", section: "reading" }, d)).toEqual(["p1"]);
    expect(keys({ difficulty: "easy" }, d)).toEqual([]);
  });

  it("keeps only due questions when asked", () => {
    const now = at(1.5);
    expect(
      filterItems(items, { dueOnly: true }, now).map((i) => i.problemId),
    ).toEqual(["p1"]);
  });
});

describe("sortItems", () => {
  const items = buildReviewItems([
    attempt("toeic/part5", "once", 0, 5),
    attempt("toeic/part5", "twice", 0, 9),
    attempt("toeic/part5", "twice", 4, 9),
    attempt("toeic/part5", "clean", 1, 10),
    attempt("toeic/part5", "lowest", 2, 1),
    attempt("toeic/part5", "lowest", 3, 10),
    attempt("toeic/part5", "unscored", 5),
  ]);
  const order = (by: Parameters<typeof sortItems>[1]) =>
    sortItems(items, by).map((i) => i.problemId);

  it("puts the most mistakes first", () => {
    expect(order("mistakes")).toEqual([
      "twice",
      "once",
      "lowest",
      "clean",
      "unscored",
    ]);
  });

  it("puts the lowest accuracy first, unscored last", () => {
    expect(order("accuracy")).toEqual([
      "once",
      "lowest",
      "twice",
      "clean",
      "unscored",
    ]);
  });

  it("puts the most recently wrong first, never-wrong last", () => {
    expect(order("recent-wrong")).toEqual([
      "twice",
      "lowest",
      "once",
      "clean",
      "unscored",
    ]);
  });

  it("puts the soonest due first, unscheduled last", () => {
    const sorted = sortItems(items, "due");
    expect(sorted.at(-1)!.problemId).toBe("unscored");
    const dues = sorted.slice(0, -1).map((i) => i.card!.due.getTime());
    expect(dues).toEqual([...dues].sort((a, b) => a - b));
  });

  it("leaves the input untouched", () => {
    sortItems(items, "accuracy");
    expect(items.map((i) => i.problemId)[0]).toBe("once");
  });
});

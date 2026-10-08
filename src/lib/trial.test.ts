import { describe, expect, it } from "vitest";
import type { Attempt } from "./attempts";
import {
  TRIAL_TASK_ID,
  collectObservations,
  difficultyTier,
  estimateBand,
  overallBand,
  pendingAiResponses,
  pickProblems,
  readingGrade,
  routeFor,
  scoreTrial,
  toBand,
  type TrialRecord,
} from "./trial";

function attempt(partial: Partial<Attempt> & Pick<Attempt, "id">): Attempt {
  return {
    taskId: "toefl/reading/academic",
    date: "2026-10-01T00:00:00.000Z",
    responses: [],
    ...partial,
  };
}

describe("pickProblems", () => {
  it("takes unsolved problems before solved ones", () => {
    const history = [attempt({ id: "a", problemId: "001" })];
    expect(pickProblems(["001", "002", "003"], history, 2).sort()).toEqual([
      "002",
      "003",
    ]);
  });

  it("falls back to the problem seen longest ago", () => {
    const history = [
      attempt({ id: "a", problemId: "001", date: "2026-10-05T00:00:00Z" }),
      attempt({ id: "b", problemId: "002", date: "2026-09-01T00:00:00Z" }),
      attempt({ id: "c", problemId: "002", date: "2026-09-02T00:00:00Z" }),
    ];
    expect(pickProblems(["001", "002"], history, 1)).toEqual(["002"]);
  });

  it("returns the whole pool when it is smaller than asked", () => {
    expect(pickProblems(["001"], [], 3)).toEqual(["001"]);
  });
});

describe("bands", () => {
  it("maps accuracy onto 1–6 in half bands", () => {
    expect(toBand(0)).toBe(1);
    expect(toBand(1)).toBe(6);
    expect(toBand(0.5)).toBe(3.5);
    expect(toBand(0.62)).toBe(4);
  });

  it("rounds the overall mean to the nearest half band", () => {
    expect(overallBand([5, 5.5, 3.5, 3.5])).toBe(4.5);
    expect(overallBand([4, 4, 4, null])).toBeNull();
  });
});

const record: TrialRecord = {
  mode: "writing",
  sectionStarts: {},
  items: [
    {
      section: "writing",
      taskId: "toefl/writing/build-sentence",
      problemId: "bs",
      maxPoints: 1,
      done: true,
      attemptId: "bs",
    },
    {
      section: "writing",
      taskId: "toefl/writing/email",
      problemId: "em",
      maxPoints: 5,
      done: true,
      attemptId: "em",
    },
    {
      section: "writing",
      taskId: "toefl/writing/discussion",
      problemId: "di",
      maxPoints: 5,
      done: true,
    },
  ],
};

describe("scoreTrial", () => {
  const bs = attempt({
    id: "bs",
    taskId: "toefl/writing/build-sentence",
    score: { method: "answer-key", correct: 1, total: 1 },
  });

  it("holds the band while a response awaits its AI score", () => {
    const email = attempt({
      id: "em",
      taskId: "toefl/writing/email",
      responses: [{ text: "Dear Sam, ..." }],
    });
    expect(pendingAiResponses(email)).toEqual([0]);
    const result = scoreTrial(record, new Map([bs, email].map((a) => [a.id, a])));
    expect(result.sections[0].band).toBeNull();
  });

  it("counts an unanswered item as zero of its points", () => {
    const email = attempt({
      id: "em",
      taskId: "toefl/writing/email",
      responses: [{ text: "Dear Sam, ...", itemScore: 4 }],
      score: { method: "ets-rubric", correct: 4, total: 5 },
    });
    const result = scoreTrial(record, new Map([bs, email].map((a) => [a.id, a])));
    expect(result.sections[0]).toMatchObject({ points: 5, max: 11 });
    expect(result.sections[0].band).toBe(toBand(5 / 11));
  });
});

describe("collectObservations", () => {
  it("does not count a trial's item attempts again as practice", () => {
    const inTrial = attempt({
      id: "in",
      score: { method: "answer-key", correct: 5, total: 5 },
    });
    const practice = attempt({
      id: "out",
      score: { method: "answer-key", correct: 0, total: 5 },
    });
    const trial = attempt({
      id: "t",
      taskId: TRIAL_TASK_ID,
      trial: {
        mode: "reading",
        sectionStarts: {},
        finishedAt: "2026-10-01T01:00:00.000Z",
        items: [
          {
            section: "reading",
            taskId: "toefl/reading/academic",
            problemId: "001",
            maxPoints: 5,
            done: true,
            attemptId: "in",
          },
        ],
      },
    });
    const obs = collectObservations([inTrial, practice, trial]);
    expect(obs.reading).toEqual([
      { date: trial.date, band: 4, source: "trial" },
      { date: practice.date, band: 1, source: "practice" },
    ]);
  });
});

describe("adaptive routing", () => {
  it("routes to the harder module from 70% on Module 1", () => {
    expect(routeFor(0.7)).toBe("hard");
    expect(routeFor(0.69)).toBe("easy");
  });

  it("caps the easier route and lifts the floor of the harder one", () => {
    expect(toBand(1, "easy")).toBe(4);
    expect(toBand(0.9, "easy")).toBe(3.5);
    expect(toBand(0.9, "hard")).toBe(5.5);
    expect(toBand(1, "hard")).toBe(6);
  });

  it("grades dense academic prose above plain short sentences", () => {
    const plain = { text: "The cat sat. It was warm. We ate lunch." };
    const dense = {
      passage:
        "Photosynthetic organisms convert electromagnetic radiation into chemical energy through interconnected biochemical pathways, fundamentally regulating atmospheric composition.",
    };
    expect(readingGrade(dense)).toBeGreaterThan(readingGrade(plain));
  });

  it("splits a pool into its easier and harder halves", () => {
    const pool = [1, 5, 3, 9, 7, 2].map((g) => ({ id: `g${g}`, grade: g }));
    expect(difficultyTier(pool, "easy", 2)).toEqual(["g1", "g2", "g3"]);
    expect(difficultyTier(pool, "hard", 2)).toEqual(["g5", "g7", "g9"]);
    expect(difficultyTier(pool, "hard", 5)).toHaveLength(5);
  });
});

describe("estimateBand", () => {
  const now = new Date("2026-10-08T00:00:00Z");
  const daysAgo = (d: number) =>
    new Date(now.getTime() - d * 86_400_000).toISOString();

  it("has no estimate without observations", () => {
    expect(estimateBand([], now)).toBeNull();
  });

  it("lets practice tests outweigh many practice attempts", () => {
    const practice = Array.from({ length: 40 }, () => ({
      date: daysAgo(1),
      band: 2,
      source: "practice" as const,
    }));
    const estimate = estimateBand(
      [{ date: daysAgo(1), band: 5, source: "trial" }, ...practice],
      now,
    );
    expect(estimate).toBe(4.5);
  });

  it("weights a recent test above an old one", () => {
    const estimate = estimateBand(
      [
        { date: daysAgo(90), band: 3, source: "trial" },
        { date: daysAgo(0), band: 5, source: "trial" },
      ],
      now,
    );
    expect(estimate).toBe(5);
  });
});

import { describe, expect, it } from "vitest";
import {
  interviewItemScore,
  parseAiScores,
  stripScoreBlock,
} from "./interviewScoring";
import type { PronunciationResult } from "./pronunciation";

const assessment = (pronunciation: number, fluency: number) =>
  ({
    recognized: "",
    pronunciation,
    accuracy: pronunciation,
    fluency,
    completeness: 100,
    prosody: null,
    // 10 words over 4 s = 150 wpm, inside the target band.
    words: Array.from({ length: 10 }, (_, i) => ({
      word: "w",
      start: i * 0.4,
      end: i * 0.4 + 0.35,
      accuracy: 90,
      errorType: "None",
    })),
  }) satisfies PronunciationResult;

describe("parseAiScores", () => {
  it("reads the fenced score block at the end of a reply", () => {
    const reply = [
      "Your languageUse could improve: 2 tense errors.",
      "```toefl-score",
      '{"languageUse": 3, "organization": 4}',
      "```",
    ].join("\n");
    expect(parseAiScores(reply)).toEqual({ languageUse: 3, organization: 4 });
  });

  it("reads scores copied as plain text without fence or quotes", () => {
    expect(parseAiScores("languageUse: 2\norganization = 5")).toEqual({
      languageUse: 2,
      organization: 5,
    });
  });

  it("rejects replies without both scores", () => {
    expect(() => parseAiScores('{"languageUse": 3}')).toThrow(/toefl-score/);
  });

  it("accepts half points", () => {
    expect(
      parseAiScores('{"languageUse": 3.5, "organization": 4}').languageUse,
    ).toBe(3.5);
  });

  it("rejects scores outside 0–5", () => {
    expect(() =>
      parseAiScores('{"languageUse": 7, "organization": 3}'),
    ).toThrow();
  });
});

describe("interviewItemScore", () => {
  it("reports facets on 0–100 and averages them into a 0–5 integer", () => {
    const score = interviewItemScore(
      { languageUse: 3, organization: 4 },
      assessment(80, 80),
    )!;
    expect(score.languageUse).toBe(60);
    expect(score.organization).toBe(80);
    expect(score.intelligibility).toBe(80);
    expect(score.fluency).toBeCloseTo(90);
    expect(score.total).toBe(4);
  });

  it("scores 0 when the AI judged the answer off topic", () => {
    expect(
      interviewItemScore(
        { languageUse: 4, organization: 0 },
        assessment(95, 95),
      )!.total,
    ).toBe(0);
  });

  it("uses whichever half is available", () => {
    expect(
      interviewItemScore({ languageUse: 2, organization: 3 }, null)!.total,
    ).toBe(3);
    expect(interviewItemScore(null, null)).toBeNull();
  });
});

describe("stripScoreBlock", () => {
  it("removes the fenced score block and keeps the feedback", () => {
    expect(
      stripScoreBlock(
        'Good answer.\n```toefl-score\n{"languageUse": 4, "organization": 4}\n```',
      ),
    ).toBe("Good answer.");
  });
});

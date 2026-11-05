import { describe, expect, it } from "vitest";
import {
  countSyllables,
  loadCards,
  mergeSpeaking,
  parseSpeakingBackup,
  saveCards,
  fluencyFromWords,
  newCard,
  parseAnalysis,
  scheduleCard,
  voicedSegments,
} from "./speakingLoop";

const w = (word: string, start: number, end: number) => ({ word, start, end });

describe("countSyllables", () => {
  it("counts vowel groups and skips Japanese", () => {
    expect(countSyllables("cat")).toBe(1);
    expect(countSyllables("make")).toBe(1);
    expect(countSyllables("table")).toBe(2);
    expect(countSyllables("research")).toBe(2);
    expect(countSyllables("研究")).toBe(0);
  });
});

describe("fluencyFromWords", () => {
  it("splits runs at 250 ms gaps and flags mid-clause pauses", () => {
    const f = fluencyFromWords([
      w("I", 0, 0.2),
      w("think", 0.2, 0.5),
      w("the", 0.9, 1.0), // mid-clause pause before "the"
      w("cat", 1.0, 1.3),
      w("sat,", 1.3, 1.6),
      w("and", 2.0, 2.2), // clause boundary
      w("left", 2.2, 2.5),
    ])!;
    expect(f.seconds).toBeCloseTo(2.5);
    expect(f.meanLengthOfRun).toBeCloseTo(7 / 3);
    expect(f.midClausePauseShare).toBe(0.5);
    expect(f.pausesPerMinute).toBeCloseTo((2 / 2.5) * 60);
  });
});

describe("voicedSegments", () => {
  it("finds onset and bridges short gaps", () => {
    const rate = 1000;
    const s = new Float32Array(3000);
    const tone = (a: number, b: number) => {
      for (let i = a * rate; i < b * rate; i++) s[i] = Math.sin(i) * 0.5;
    };
    tone(1.0, 1.5);
    tone(1.6, 2.0); // 100 ms gap: same run
    tone(2.5, 2.8); // 500 ms gap: new run
    const segs = voicedSegments(s, rate);
    expect(segs).toHaveLength(2);
    expect(segs[0][0]).toBeCloseTo(1.0, 1);
    expect(segs[1][0]).toBeCloseTo(2.5, 1);
  });
});

describe("scheduleCard", () => {
  const now = new Date("2026-11-01T00:00:00Z");
  const card = { ...newCard({ intent: "x", chunk: "y", example: "", kind: "formula" }, "t", now), intervalDays: 2 };

  it("stretches fast answers more than slow ones", () => {
    expect(scheduleCard(card, true, 0.8, now).intervalDays).toBe(6);
    expect(scheduleCard(card, true, 1.5, now).intervalDays).toBe(4);
    expect(scheduleCard(card, true, 3.5, now).intervalDays).toBe(1.2);
  });

  it("brings a miss back in ten minutes", () => {
    const next = scheduleCard(card, false, 1, now);
    expect(next.intervalDays).toBe(0);
    expect(next.lapses).toBe(1);
    expect(Date.parse(next.due) - now.getTime()).toBe(600_000);
  });
});

describe("parseAnalysis", () => {
  it("reads JSON wrapped in a code fence", () => {
    const a = parseAnalysis(
      '```json\n{"natural":"Hi.","chunks":[{"intent":"挨拶","chunk":"Hi","example":"Hi.","kind":"formula"}]}\n```',
    );
    expect(a.chunks[0].chunk).toBe("Hi");
  });
  it("rejects a reply without chunks", () => {
    expect(() => parseAnalysis('{"natural":"x","chunks":[]}')).toThrow();
  });
});

describe("speaking backup", () => {
  const now = new Date("2026-11-01T00:00:00Z");
  const card = newCard({ intent: "i", chunk: "c", example: "", kind: "formula" }, "t", now);

  it("merges by id, the backup's copy winning", () => {
    const other = { ...card, id: "other" };
    saveCards([card, other]);
    mergeSpeaking({ cards: [{ ...card, reps: 5 }], sessions: [] });
    const cards = loadCards();
    expect(cards).toHaveLength(2);
    expect(cards.find((c) => c.id === card.id)!.reps).toBe(5);
  });

  it("accepts a backup without the section and refuses a malformed one", () => {
    expect(parseSpeakingBackup(undefined)).toBeUndefined();
    expect(() =>
      parseSpeakingBackup({ cards: [{ id: "x" }], sessions: [] }),
    ).toThrow();
  });
});

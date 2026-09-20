import { describe, expect, it } from "vitest";
import { buildScoreTrend } from "./scoreTrend";
import type { ScoreEntry } from "../hooks/useScoreHistory";

function entry(date: string, pct: number, elapsedSeconds?: number): ScoreEntry {
  return {
    taskId: "toeic/part5",
    date,
    correct: Math.round((pct / 100) * 30),
    total: 30,
    pct,
    elapsedSeconds,
  };
}

describe("buildScoreTrend", () => {
  it("keeps same-day sessions as distinct x values", () => {
    const { data, tickLabel } = buildScoreTrend([
      entry("2026-09-20T09:00:00.000Z", 55, 540),
      entry("2026-09-20T12:00:00.000Z", 88, 600),
    ]);

    expect(data).toHaveLength(2);
    expect(data[0].id).not.toBe(data[1].id);
    expect(new Set(data.map((point) => point.id)).size).toBe(2);
    // one date label for the day, not two
    expect([...tickLabel.values()]).toEqual(["9/20", ""]);
    expect(data[0].session).toBeNull();
    expect(data[1].session).toBe("2nd session");
  });

  it("labels a new day again and formats the readout", () => {
    const { data, tickLabel } = buildScoreTrend([
      entry("2026-09-19T09:00:00.000Z", 60, 65),
      entry("2026-09-20T09:00:00.000Z", 100, 600),
      entry("2026-09-20T10:00:00.000Z", 100, 590),
    ]);

    expect([...tickLabel.values()]).toEqual(["9/19", "9/20", ""]);
    expect(data[2].session).toBe("2nd session");
    expect(data[0].time).toBe("1:05");
    expect(data[2].time).toBe("9:50");
  });

  it("leaves the time empty when the session was not timed", () => {
    const { data } = buildScoreTrend([entry("2026-09-20T09:00:00.000Z", 70)]);
    expect(data[0].time).toBeNull();
  });
});

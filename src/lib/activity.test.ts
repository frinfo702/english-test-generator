import { describe, expect, it } from "vitest";
import { buildActivity, dayKey } from "./activity";

const at = (y: number, m: number, d: number, h = 12) =>
  new Date(y, m - 1, d, h).toISOString();

describe("buildActivity", () => {
  const today = new Date(2026, 9, 7, 15); // Wed 2026-10-07

  it("builds Sunday-start weeks ending in the current week", () => {
    const { weeks } = buildActivity([], today, 4);
    expect(weeks).toHaveLength(4);
    expect(weeks.every((w) => w.length === 7)).toBe(true);
    expect(weeks[0][0].date.getDay()).toBe(0);
    const last = weeks[3];
    expect(last.find((d) => d.key === dayKey(today))?.future).toBe(false);
    expect(last[6].future).toBe(true);
  });

  it("counts sessions per local day and assigns levels", () => {
    const dates = [
      at(2026, 10, 5),
      at(2026, 10, 6),
      at(2026, 10, 6),
      ...Array.from({ length: 8 }, () => at(2026, 10, 7)),
    ];
    const { weeks, activeDays, totalSessions } = buildActivity(dates, today, 2);
    const byKey = new Map(weeks.flat().map((d) => [d.key, d]));
    expect(byKey.get("2026-10-05")?.level).toBe(1);
    expect(byKey.get("2026-10-06")?.count).toBe(2);
    expect(byKey.get("2026-10-06")?.level).toBe(2);
    expect(byKey.get("2026-10-07")?.level).toBe(4);
    expect(activeDays).toBe(3);
    expect(totalSessions).toBe(11);
  });

  it("keeps the current streak alive until a full day is missed", () => {
    const dates = [at(2026, 10, 4), at(2026, 10, 5), at(2026, 10, 6)];
    expect(buildActivity(dates, today).currentStreak).toBe(3);
    expect(
      buildActivity([...dates, at(2026, 10, 7)], today).currentStreak,
    ).toBe(4);
    expect(buildActivity([at(2026, 10, 5)], today).currentStreak).toBe(0);
  });

  it("finds the longest run of consecutive days", () => {
    const dates = [
      at(2026, 3, 1),
      at(2026, 3, 2),
      at(2026, 3, 3),
      at(2026, 3, 4),
      at(2026, 9, 1),
      at(2026, 9, 2),
    ];
    expect(buildActivity(dates, today).longestStreak).toBe(4);
  });

  it("only counts sessions inside the grid toward totals", () => {
    const old = at(2024, 1, 1);
    const summary = buildActivity([old, at(2026, 10, 6)], today, 4);
    expect(summary.totalSessions).toBe(1);
    expect(summary.activeDays).toBe(1);
  });

  it("ignores invalid dates", () => {
    expect(buildActivity(["nope"], today).activeDays).toBe(0);
  });
});

import { describe, expect, it } from "vitest";
import {
  emptyGoal,
  sectionGoalFits,
  totalRange,
  withDerivedTotal,
} from "./scoreGoal";

const goal = (
  overall: number | null,
  s: Partial<ReturnType<typeof emptyGoal>["sections"]> = {},
) => ({ overall, sections: { ...emptyGoal().sections, ...s } });

describe("score goal consistency", () => {
  it("fixes the total once all four sections are set (ETS: mean, nearest half)", () => {
    const all6 = goal(null, {
      reading: 6,
      listening: 6,
      writing: 6,
      speaking: 6,
    }).sections;
    expect(totalRange(all6)).toEqual([6, 6]);
    expect(withDerivedTotal(goal(1.5, all6)).overall).toBe(6);
    // 4, 4, 4.5, 4.5 → 4.25 → 4.5
    expect(
      totalRange(
        goal(null, { reading: 4, listening: 4, writing: 4.5, speaking: 4.5 })
          .sections,
      ),
    ).toEqual([4.5, 4.5]);
  });

  it("leaves unset sections free from 1 to 6", () => {
    expect(totalRange(goal(null, { reading: 6 }).sections)).toEqual([2.5, 6]);
  });

  it("rejects a section goal that puts the total goal out of reach", () => {
    // Total 1.5 with the rest at their floor of 1: reading 3.5 → 1.625 → 1.5,
    // reading 4 → 1.75 → 2.
    expect(sectionGoalFits(goal(1.5), "reading", 3.5)).toBe(true);
    expect(sectionGoalFits(goal(1.5), "reading", 4)).toBe(false);
    expect(sectionGoalFits(goal(null), "reading", 6)).toBe(true);
  });
});

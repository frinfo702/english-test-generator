import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { loadScoreGoal } from "../../lib/scoreGoal";
import { EstimateCard } from "./EstimateCard";

describe("EstimateCard", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  it("saves a total and section goal and shows them next to the estimate", () => {
    render(<EstimateCard attempts={[]} />);
    fireEvent.click(screen.getByRole("button", { name: "Set a goal" }));
    fireEvent.change(screen.getByLabelText("Total"), {
      target: { value: "4.5" },
    });
    fireEvent.change(screen.getByLabelText("Speaking"), {
      target: { value: "5" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save goal" }));

    expect(loadScoreGoal()).toMatchObject({
      overall: 4.5,
      sections: { speaking: 5, reading: null },
    });
    expect(screen.getByText("/ goal 4.5")).toBeTruthy();
    expect(screen.getByText("goal 5")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Edit goal" })).toBeTruthy();
  });

  it("greys out section bands the total goal can't reach", () => {
    render(<EstimateCard attempts={[]} />);
    fireEvent.click(screen.getByRole("button", { name: "Set a goal" }));
    fireEvent.change(screen.getByLabelText("Total"), {
      target: { value: "1.5" },
    });
    const reading = screen.getByLabelText("Reading") as HTMLSelectElement;
    const option = (v: string) =>
      [...reading.options].find((o) => o.value === v)!;
    expect(option("3.5").disabled).toBe(false);
    expect(option("6").disabled).toBe(true);
  });

  it("ignores a stored goal that is off the 1–6 half-band scale", () => {
    localStorage.setItem(
      "score-goal",
      JSON.stringify({ overall: 7, sections: { reading: 4.25, writing: 3 } }),
    );
    expect(loadScoreGoal()).toMatchObject({
      overall: null,
      sections: { reading: null, writing: 3 },
    });
  });
});

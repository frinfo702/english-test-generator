import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Part3Page } from "./Part3Page";
import { Part4Page } from "./Part4Page";

vi.mock("../../components/question/ListeningTaskBase", () => ({
  ListeningTaskBase: (props: Record<string, unknown>) => (
    <div data-testid="listening-task-base">{JSON.stringify(props)}</div>
  ),
}));

describe("TOEIC listening wrappers", () => {
  it("passes the expected props to Part 3 and Part 4", () => {
    const { rerender } = render(<Part3Page />);
    expect(screen.getByTestId("listening-task-base").textContent).toContain(
      '"taskId":"toeic/part3"',
    );
    expect(screen.getByTestId("listening-task-base").textContent).toContain(
      '"readQuestionsAloud":true',
    );

    rerender(<Part4Page />);
    expect(screen.getByTestId("listening-task-base").textContent).toContain(
      '"taskId":"toeic/part4"',
    );
  });
});

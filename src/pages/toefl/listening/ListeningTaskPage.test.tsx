import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  AnnouncementPage,
  ConversationPage,
  LecturePage,
} from "./ListeningTaskPage";

vi.mock("../../../components/question/ListeningTaskBase", () => ({
  ListeningTaskBase: (props: Record<string, unknown>) => (
    <div data-testid="listening-task-base">{JSON.stringify(props)}</div>
  ),
}));

describe("ListeningTaskPage wrappers", () => {
  it("passes the expected props to each TOEFL listening wrapper", () => {
    const { rerender } = render(<ConversationPage />);
    expect(screen.getByTestId("listening-task-base").textContent).toContain(
      '"taskId":"toefl/listening/conversation"',
    );
    expect(screen.getByTestId("listening-task-base").textContent).toContain(
      '"showSpeedControl":true',
    );

    rerender(<LecturePage />);
    expect(screen.getByTestId("listening-task-base").textContent).toContain(
      '"taskId":"toefl/listening/lecture"',
    );

    rerender(<AnnouncementPage />);
    expect(screen.getByTestId("listening-task-base").textContent).toContain(
      '"taskId":"toefl/listening/announcement"',
    );
  });
});

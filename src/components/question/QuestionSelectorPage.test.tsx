import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QuestionSelectorPage } from "./QuestionSelectorPage";
import { listQuestionFiles } from "../../lib/questions";

const getAllMock = vi.fn();

vi.mock("../../lib/questions", () => ({
  listQuestionFiles: vi.fn(),
}));

vi.mock("../../hooks/useScoreHistory", () => ({
  useScoreHistory: () => ({
    getAll: getAllMock,
  }),
}));

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

describe("QuestionSelectorPage", () => {
  beforeEach(() => {
    vi.mocked(listQuestionFiles).mockReset();
    getAllMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads question files, formats latest scores, and navigates to a random item", async () => {
    vi.mocked(listQuestionFiles).mockResolvedValue([
      { file: "001.json", number: 1 },
      { file: "002.json", number: 2 },
    ]);
    getAllMock.mockResolvedValue([
      {
        taskId: "toeic/part5",
        date: "2026-03-01T00:00:00.000Z",
        correct: 3,
        total: 4,
        pct: 75,
        elapsedSeconds: 45,
        questionFile: "001.json",
      },
    ]);
    vi.spyOn(Math, "random").mockReturnValue(0.9);

    render(
      <MemoryRouter initialEntries={["/toeic/part5"]}>
        <Routes>
          <Route
            path="*"
            element={
              <>
                <QuestionSelectorPage
                  taskId="toeic/part5"
                  title="Part 5"
                  subtitle="Choose a question"
                  backTo="/toeic"
                  basePath="/toeic/part5"
                />
                <LocationProbe />
              </>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Q1")).toBeTruthy();
      expect(screen.getByText("Q2")).toBeTruthy();
    });

    expect(screen.getByText("00:45")).toBeTruthy();
    expect(screen.getByText("75%")).toBeTruthy();
    expect(screen.getByText("2 questions")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Pick Random" }));
    expect(screen.getByTestId("location").textContent).toBe("/toeic/part5/2");
  });

  it("shows loading and then an error state", async () => {
    let release: (() => void) | undefined;
    vi.mocked(listQuestionFiles).mockImplementation(
      () =>
        new Promise((resolve) => {
          release = () => resolve([]);
        }),
    );
    getAllMock.mockRejectedValue(new Error("score load failed"));

    render(
      <MemoryRouter>
        <QuestionSelectorPage
          taskId="toeic/part5"
          title="Part 5"
          subtitle="Choose a question"
          backTo="/toeic"
          basePath="/toeic/part5"
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("Loading question list...")).toBeTruthy();

    release?.();
    await waitFor(() => {
      expect(screen.getByText("score load failed")).toBeTruthy();
    });
  });
});

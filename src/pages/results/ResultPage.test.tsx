import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { IDBFactory } from "fake-indexeddb";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type AttemptsModule = typeof import("../../lib/attempts");

async function setup(attempt: Parameters<AttemptsModule["saveAttempt"]>[0]) {
  vi.stubGlobal("indexedDB", new IDBFactory());
  vi.resetModules();
  const db: AttemptsModule = await import("../../lib/attempts");
  const saved = await db.saveAttempt(attempt);
  const { ResultPage } = await import("./ResultPage");
  render(
    <MemoryRouter initialEntries={[`/results/${saved.id}`]}>
      <Routes>
        <Route path="/results/:attemptId" element={<ResultPage />} />
      </Routes>
    </MemoryRouter>,
  );
  return { db, saved };
}

describe("ResultPage", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ files: [] }))),
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("shows a saved Listen & Repeat set with its average and item scores", async () => {
    await setup({
      taskId: "toefl/speaking/listen-repeat",
      problemId: "001",
      question: { sentences: [] },
      responses: [
        {
          itemId: "s1",
          prompt: "The library will be closed.",
          transcript: "The library will be closed.",
          itemScore: 5,
        },
        {
          itemId: "s2",
          prompt: "Could you remind me?",
          transcript: "Could you remind",
          itemScore: 4,
        },
      ],
      score: { method: "ets-rubric", correct: 9, total: 10 },
    });

    expect(await screen.findByText("4.5")).toBeTruthy();
    expect(screen.getByText("Could you remind me?")).toBeTruthy();
    expect(screen.getAllByLabelText("4 out of 5")).toHaveLength(2);
  });

  it("replays the spoken scenario and prompts in review, next to their script", async () => {
    await setup({
      taskId: "toefl/speaking/listen-repeat",
      problemId: "001",
      question: {
        scenario: "You are visiting a museum.\nA guide gives directions.",
        sentences: [],
      },
      responses: [
        { itemId: "s1", prompt: "Turn left at the fountain.", itemScore: 5 },
      ],
      score: { method: "ets-rubric", correct: 5, total: 5 },
    });

    expect(await screen.findByText("You are visiting a museum.")).toBeTruthy();
    expect(screen.getByText("A guide gives directions.")).toBeTruthy();
    expect(screen.getByText("Turn left at the fountain.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Prompt" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Scenario" }));
    await vi.waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        "/audio/toefl/speaking/listen-repeat/001/scenario.mp3",
      ),
    );
  });

  it("scores an interview answer from a pasted AI reply and saves it", async () => {
    const { db, saved } = await setup({
      taskId: "toefl/speaking/interview",
      problemId: "001",
      question: { scenario: "", questions: [] },
      responses: [
        {
          itemId: "q1",
          prompt: "What do you do on weekends?",
          transcript: "I usually play tennis with friends.",
        },
      ],
    });

    expect(await screen.findByText("Not scored")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("AI reply"), {
      target: { value: '{"languageUse": 3, "organization": 4}' },
    });
    fireEvent.click(screen.getByRole("button", { name: "Apply AI score" }));

    expect(await screen.findByText("· partial", { exact: false })).toBeTruthy();
    await vi.waitFor(async () => {
      const stored = await db.getAttempt(saved.id);
      expect(stored?.responses[0].itemScore).toBe(4);
      expect(stored?.score).toEqual({
        method: "ets-rubric",
        correct: 4,
        total: 5,
      });
    });
  });
});

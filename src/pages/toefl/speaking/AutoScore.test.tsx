import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { IDBFactory } from "fake-indexeddb";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GATEWAY_URL, saveGatewayKey } from "../../../lib/aiGateway";
import type { Attempt } from "../../../lib/attempts";
import { scoreInBackground } from "../../../lib/backgroundScoring";
import { InterviewResult } from "./SpeakingResult";

const makeInterview = (id: string): Attempt =>
  ({
    id,
    taskId: "toefl/speaking/interview",
    problemId: "001",
    date: "2026-10-10T00:00:00.000Z",
    question: {
      questions: [
        {
          type: "opinion",
          question: "Q1?",
          modelAnswer: "M1",
          evaluationPoints: [],
        },
      ],
    },
    responses: [{ prompt: "Q1?", transcript: "I think so." }],
  }) as unknown as Attempt;

/** Resolves gateway calls only when the test says so. */
function mockGateway() {
  const pending: ((r: Response) => void)[] = [];
  const fetch = vi.fn((url: string) =>
    url.startsWith(GATEWAY_URL)
      ? new Promise<Response>((resolve) => pending.push(resolve))
      : Promise.resolve(new Response(JSON.stringify({ files: [] }))),
  );
  vi.stubGlobal("fetch", fetch);
  const gatewayCalls = () =>
    fetch.mock.calls.filter(([u]) => String(u).startsWith(GATEWAY_URL));
  return { pending, gatewayCalls };
}

const renderResult = (attempt: Attempt) =>
  render(
    <MemoryRouter>
      <InterviewResult attempt={attempt} onChange={() => {}} />
    </MemoryRouter>,
  );

describe("AI score slot with the user's AI Gateway key", () => {
  beforeEach(() => {
    vi.stubGlobal("indexedDB", new IDBFactory());
    localStorage.clear();
  });
  afterEach(() => {
    cleanup();
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it("keeps today's copy & paste panel when no key is saved", () => {
    const { gatewayCalls } = mockGateway();
    renderResult(makeInterview("a-panel"));
    expect(screen.getAllByText("Copy for AI scoring")).toHaveLength(1);
    expect(gatewayCalls()).toHaveLength(0);
  });

  it("shows an old unscored answer as Not scored without spending credits", async () => {
    saveGatewayKey("vck_test");
    const { gatewayCalls } = mockGateway();
    renderResult(makeInterview("a-old"));

    expect(screen.getAllByText("Not scored").length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: /^Score with/ })).toBeNull();
    await new Promise((r) => setTimeout(r, 0));
    expect(gatewayCalls()).toHaveLength(0);
  });

  it("shows the waiting orb while the background score runs", async () => {
    saveGatewayKey("vck_test");
    const { gatewayCalls } = mockGateway();
    const attempt = makeInterview("a-wait");
    renderResult(attempt);

    scoreInBackground({
      attemptId: attempt.id,
      index: 0,
      kind: "interview",
      message: "PROMPT",
    });

    expect(
      (await screen.findAllByRole("status"))
        .map((s) => s.textContent)
        .join(" "),
    ).toContain("Scoring with Claude Haiku 5.5");
    expect(gatewayCalls()).toHaveLength(1);
  });

  it("offers retry and a way back to copy & paste when scoring fails", async () => {
    saveGatewayKey("vck_test");
    const fetch = vi.fn(async (url: string) =>
      url.startsWith(GATEWAY_URL)
        ? new Response(JSON.stringify({ error: { message: "boom" } }), {
            status: 500,
          })
        : new Response(JSON.stringify({ files: [] })),
    );
    vi.stubGlobal("fetch", fetch);
    const attempt = makeInterview("a-fail");
    renderResult(attempt);

    scoreInBackground({
      attemptId: attempt.id,
      index: 0,
      kind: "interview",
      message: "PROMPT",
    });
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(screen.getByText(/AI Gateway error \(500\): boom/)).toBeTruthy();

    // The header has its own "Try again" (retake the question); the scoring
    // retry lives in the item's details.
    const details = document.querySelector("details")!;
    fireEvent.click(within(details).getByText("Try again"));
    expect(within(details).getAllByRole("status").length).toBeGreaterThan(0);
    await waitFor(() =>
      expect(
        fetch.mock.calls.filter(([u]) => String(u).startsWith(GATEWAY_URL)),
      ).toHaveLength(2),
    );

    fireEvent.click(within(details).getByText("Copy & paste instead"));
    expect(within(details).getByText("Copy for AI scoring")).toBeTruthy();
  });
});

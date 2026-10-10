import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { useState } from "react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { saveGatewayKey } from "../../../lib/aiGateway";
import type { Attempt } from "../../../lib/attempts";
import type { PronunciationResult } from "../../../lib/pronunciation";
import { WritingScore } from "../writing/WritingScore";
import { InterviewResult } from "./SpeakingResult";

const assessment: PronunciationResult = {
  accuracy: 80,
  fluency: 80,
  completeness: 100,
  pronunciation: 80,
  words: [],
} as unknown as PronunciationResult;

const interview: Attempt = {
  id: "a1",
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
      {
        type: "opinion",
        question: "Q2?",
        modelAnswer: "M2",
        evaluationPoints: [],
      },
    ],
  },
  responses: [
    { prompt: "Q1?", transcript: "I think so.", assessment },
    { prompt: "Q2?", transcript: "Because it helps.", assessment },
  ],
} as unknown as Attempt;

const reply = (scores: string) =>
  new Response(
    JSON.stringify({
      choices: [
        { message: { content: `Nice.\n\`\`\`toefl-score\n${scores}\n\`\`\`` } },
      ],
    }),
  );

/** Resolves gateway calls only when the test says so. */
function mockGateway() {
  const pending: ((r: Response) => void)[] = [];
  const fetch = vi.fn((url: string) =>
    url.startsWith("https://ai-gateway.vercel.sh")
      ? new Promise<Response>((resolve) => pending.push(resolve))
      : Promise.resolve(new Response(JSON.stringify({ files: [] }))),
  );
  vi.stubGlobal("fetch", fetch);
  const gatewayCalls = () =>
    fetch.mock.calls.filter(([u]) => u.startsWith("https://ai-gateway"));
  return { pending, gatewayCalls };
}

function Harness({ onSaved }: { onSaved: (a: Attempt) => void }) {
  const [attempt, setAttempt] = useState(interview);
  return (
    <MemoryRouter>
      <InterviewResult
        autoScore
        attempt={attempt}
        onChange={(next) => {
          setAttempt(next);
          onSaved(next);
        }}
      />
    </MemoryRouter>
  );
}

describe("auto scoring with the user's AI Gateway key", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => {
    cleanup();
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it("keeps today's copy & paste panel when no key is saved", () => {
    const { gatewayCalls } = mockGateway();
    render(<Harness onSaved={() => {}} />);
    expect(screen.getAllByText("Copy for AI scoring")).toHaveLength(2);
    expect(gatewayCalls()).toHaveLength(0);
  });

  it("shows delivery scores at once and fills each AI score in place", async () => {
    saveGatewayKey("vck_test");
    const { pending, gatewayCalls } = mockGateway();
    const saved = vi.fn();
    render(<Harness onSaved={saved} />);

    // Audio-derived facets are there before any AI reply.
    expect(screen.getAllByText("Intelligibility")).toHaveLength(2);
    expect(screen.getAllByText("Scoring")).toHaveLength(2 + 4);
    expect(screen.queryByText("Copy for AI scoring")).toBeNull();
    await waitFor(() => expect(gatewayCalls()).toHaveLength(2));

    // Both replies land before React re-renders: neither may be lost.
    pending[0](reply('{"languageUse": 4, "organization": 4}'));
    pending[1](reply('{"languageUse": 3, "organization": 2}'));

    await waitFor(() =>
      expect(screen.queryAllByText("Scoring")).toHaveLength(0),
    );
    const last = saved.mock.calls.at(-1)![0] as Attempt;
    expect(last.responses.map((r) => r.ai?.scores)).toEqual([
      { languageUse: 4, organization: 4 },
      { languageUse: 3, organization: 2 },
    ]);
    expect(last.responses.every((r) => r.itemScore !== undefined)).toBe(true);
    expect(screen.getAllByText("AI feedback")).toHaveLength(2);
  });

  it("does not auto-score silent answers", async () => {
    saveGatewayKey("vck_test");
    const { gatewayCalls } = mockGateway();
    render(
      <MemoryRouter>
        <InterviewResult
          autoScore
          attempt={
            {
              ...interview,
              responses: [
                { prompt: "Q1?", transcript: "  ", assessment },
                { prompt: "Q2?", transcript: "", assessment },
              ],
            } as Attempt
          }
          onChange={() => {}}
        />
        <WritingScore
          taskId="toefl/writing/email"
          question={{
            scenario: { description: "d", recipient: "r", keyPoints: ["k"] },
            modelAnswer: "m",
            rubric: [],
          }}
          attempt={
            {
              id: "w1",
              taskId: "toefl/writing/email",
              date: "2026-10-10T00:00:00.000Z",
              responses: [{ text: " \n " }],
            } as unknown as Attempt
          }
          error={null}
          onChange={() => {}}
        />
      </MemoryRouter>,
    );
    await new Promise((r) => setTimeout(r, 0));
    expect(gatewayCalls()).toHaveLength(0);
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("offers retry and copy & paste when scoring fails", async () => {
    saveGatewayKey("vck_test");
    const fetch = vi.fn(async (url: string) =>
      url.startsWith("https://ai-gateway")
        ? new Response(JSON.stringify({ error: { message: "boom" } }), {
            status: 500,
          })
        : new Response(JSON.stringify({ files: [] })),
    );
    vi.stubGlobal("fetch", fetch);
    render(
      <MemoryRouter>
        <WritingScore
          taskId="toefl/writing/discussion"
          question={{
            professorQuestion: "P?",
            student1: { name: "A", response: "a" },
            student2: { name: "B", response: "b" },
            modelAnswer: "m",
            evaluationPoints: [],
          }}
          attempt={
            {
              id: "w1",
              taskId: "toefl/writing/discussion",
              date: "2026-10-10T00:00:00.000Z",
              responses: [{ text: "My answer." }],
            } as unknown as Attempt
          }
          error={null}
          onChange={() => {}}
        />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(screen.getByText(/AI Gateway error \(500\): boom/)).toBeTruthy();

    fireEvent.click(screen.getByText("Try again"));
    expect(screen.getByRole("status")).toBeTruthy();
    await screen.findByRole("alert");
    expect(fetch).toHaveBeenCalledTimes(2);

    fireEvent.click(screen.getByText("Copy & paste instead"));
    expect(screen.getByText("Copy for AI scoring")).toBeTruthy();
  });

  it("scores a Writing response and shows the result in the same sheet", async () => {
    saveGatewayKey("vck_test");
    const { pending } = mockGateway();
    function Writing() {
      const [attempt, setAttempt] = useState({
        id: "w1",
        taskId: "toefl/writing/email",
        date: "2026-10-10T00:00:00.000Z",
        responses: [{ text: "Dear Ms. Lee," }],
      } as unknown as Attempt);
      return (
        <MemoryRouter>
          <WritingScore
            taskId="toefl/writing/email"
            question={{
              scenario: { description: "d", recipient: "r", keyPoints: ["k"] },
              modelAnswer: "m",
              rubric: [],
            }}
            attempt={attempt}
            error={null}
            onChange={setAttempt}
          />
        </MemoryRouter>
      );
    }
    render(<Writing />);
    expect(screen.getByRole("status").textContent).toContain(
      "Scoring with Claude Haiku 5.5",
    );
    await waitFor(() => expect(pending).toHaveLength(1));
    pending[0](reply('{"score": 4}'));
    expect(await screen.findByText("/5")).toBeTruthy();
    expect(screen.getByText("Nice.")).toBeTruthy();
  });
});

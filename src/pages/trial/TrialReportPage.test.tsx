import { cleanup, render, screen } from "@testing-library/react";
import { IDBFactory } from "fake-indexeddb";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GATEWAY_URL, saveGatewayKey } from "../../lib/aiGateway";

const question = {
  scenario: { description: "d", recipient: "r", keyPoints: ["k"] },
  modelAnswer: "m",
  rubric: [
    { criterion: "Task completion", description: "Covers both points." },
  ],
};

type AttemptsModule = typeof import("../../lib/attempts");

async function setup() {
  vi.stubGlobal("indexedDB", new IDBFactory());
  vi.resetModules();
  const db: AttemptsModule = await import("../../lib/attempts");
  const email = await db.saveAttempt({
    taskId: "toefl/writing/email",
    problemId: "001",
    responses: [{ text: "Dear r, thanks for the note." }],
  });
  const trial = await db.saveAttempt({
    taskId: "toefl/trial",
    responses: [],
    trial: {
      mode: "writing",
      items: [
        {
          section: "writing",
          taskId: "toefl/writing/email",
          problemId: "001",
          maxPoints: 5,
          done: true,
          attemptId: email.id,
        },
      ],
      sectionStarts: {},
      finishedAt: "2026-10-10T00:00:00.000Z",
    },
  } as Parameters<AttemptsModule["saveAttempt"]>[0]);
  const { TrialReportPage } = await import("./TrialReportPage");
  render(
    <MemoryRouter initialEntries={[`/trial/${trial.id}/report`]}>
      <Routes>
        <Route path="/trial/:trialId/report" element={<TrialReportPage />} />
      </Routes>
    </MemoryRouter>,
  );
  return { db, email };
}

const gatewayCalls = () =>
  vi
    .mocked(fetch)
    .mock.calls.filter(([u]) => String(u).startsWith(GATEWAY_URL));

describe("TrialReportPage with an AI Gateway key", () => {
  beforeEach(() => {
    saveGatewayKey("vck_test");
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) =>
        String(url).startsWith(GATEWAY_URL)
          ? new Promise<Response>(() => {})
          : Promise.resolve(new Response(JSON.stringify(question))),
      ),
    );
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it("shows a background score landing while the report is open", async () => {
    const pending: ((r: Response) => void)[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) =>
        String(url).startsWith(GATEWAY_URL)
          ? new Promise<Response>((resolve) => pending.push(resolve))
          : Promise.resolve(new Response(JSON.stringify(question))),
      ),
    );
    const { db, email } = await setup();
    const bg = await import("../../lib/backgroundScoring");
    bg.scoreInBackground({
      attemptId: email.id,
      index: 0,
      kind: "writing",
      message: "PROMPT",
    });

    expect((await screen.findAllByText("Scoring…")).length).toBeGreaterThan(0);
    pending[0](
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content:
                  'Good.\n```toefl-score\n{"criteria":[{"points":4,"note":"Clear."}],"score":4}\n```',
              },
            },
          ],
        }),
      ),
    );

    expect(await screen.findByText("Clear.")).toBeTruthy();
    expect(await db.getAttempt(email.id)).toMatchObject({
      responses: [{ itemScore: 4 }],
    });
  });

  it("shows a past unscored answer as Not scored without spending credits", async () => {
    await setup();
    expect((await screen.findAllByText("Not scored")).length).toBeGreaterThan(
      0,
    );
    await new Promise((r) => setTimeout(r, 0));
    expect(gatewayCalls()).toHaveLength(0);
  });
});

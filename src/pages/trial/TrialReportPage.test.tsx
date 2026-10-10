import { cleanup, render, screen } from "@testing-library/react";
import { IDBFactory } from "fake-indexeddb";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GATEWAY_URL, saveGatewayKey } from "../../lib/aiGateway";

const question = {
  scenario: { description: "d", recipient: "r", keyPoints: ["k"] },
  modelAnswer: "m",
  rubric: [],
};

async function setup(state?: unknown) {
  vi.stubGlobal("indexedDB", new IDBFactory());
  vi.resetModules();
  const db = await import("../../lib/attempts");
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
  } as Parameters<typeof db.saveAttempt>[0]);
  const { TrialReportPage } = await import("./TrialReportPage");
  render(
    <MemoryRouter
      initialEntries={[{ pathname: `/trial/${trial.id}/report`, state }]}
    >
      <Routes>
        <Route path="/trial/:trialId/report" element={<TrialReportPage />} />
      </Routes>
    </MemoryRouter>,
  );
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
        url.startsWith(GATEWAY_URL)
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

  it("scores in the report right after the test is finished", async () => {
    await setup({ justAnswered: true });
    expect(await screen.findByText("Awaiting AI score")).toBeTruthy();
    await vi.waitFor(() => expect(gatewayCalls()).toHaveLength(1));
  });

  it("keeps the gate and waits for a click when opened later", async () => {
    await setup();
    expect(
      await screen.findByText("Score your Writing and Speaking"),
    ).toBeTruthy();
    expect(
      await screen.findByRole("button", { name: /^Score with/ }),
    ).toBeTruthy();
    await new Promise((r) => setTimeout(r, 0));
    expect(gatewayCalls()).toHaveLength(0);
  });
});

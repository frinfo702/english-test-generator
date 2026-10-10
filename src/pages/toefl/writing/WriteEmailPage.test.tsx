import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { IDBFactory } from "fake-indexeddb";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GATEWAY_URL, saveGatewayKey } from "../../../lib/aiGateway";
import { WriteEmailPage } from "./WriteEmailPage";

const { emailData, loadById } = vi.hoisted(() => ({
  emailData: {
    scenario: {
      description: "A note from the library.",
      recipient: "Ms. Lee",
      keyPoints: ["Apologize", "Offer a fix"],
    },
    modelAnswer: "Dear Ms. Lee, ...",
    rubric: [
      { criterion: "Task completion", description: "Covers both points." },
      { criterion: "Language use", description: "Range and accuracy." },
    ],
  },
  loadById: vi.fn(),
}));

vi.mock("../../../hooks/useQuestion", () => ({
  useQuestion: () => ({
    data: emailData,
    file: "001.json",
    loading: false,
    error: null,
    loadById,
  }),
}));

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/toefl/writing/email/001"]}>
      <Routes>
        <Route
          path="/toefl/writing/email/:questionId"
          element={<WriteEmailPage />}
        />
      </Routes>
    </MemoryRouter>,
  );
}

const gatewayCalls = (fetch: ReturnType<typeof vi.fn>) =>
  fetch.mock.calls.filter(([u]) => String(u).startsWith(GATEWAY_URL));

async function submitEmail() {
  fireEvent.change(screen.getByLabelText("Your email"), {
    target: { value: "Dear Ms. Lee, sorry about the noise." },
  });
  fireEvent.click(screen.getByRole("button", { name: /submit/i }));
}

describe("WriteEmailPage", () => {
  beforeEach(() => {
    vi.stubGlobal("indexedDB", new IDBFactory());
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it("starts scoring in the background as the answer is submitted", async () => {
    saveGatewayKey("vck_test");
    const pending: ((r: Response) => void)[] = [];
    const fetch = vi.fn((url: string) =>
      String(url).startsWith(GATEWAY_URL)
        ? new Promise<Response>((resolve) => pending.push(resolve))
        : Promise.resolve(new Response(JSON.stringify({ files: [] }))),
    );
    vi.stubGlobal("fetch", fetch);
    renderPage();

    await submitEmail();

    // BYOK: no copy & paste, and no click needed to start.
    await waitFor(() => expect(gatewayCalls(fetch)).toHaveLength(1));
    expect(screen.queryByText("Copy for AI scoring")).toBeNull();
    expect(
      (await screen.findAllByRole("status"))
        .map((s) => s.textContent)
        .join(" "),
    ).toContain("Scoring with Claude Haiku 5.5");

    pending[0](
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content:
                  'Good work.\n```toefl-score\n{"criteria":[{"points":3,"note":"Both points covered."},{"points":4,"note":"Clear grammar."}],"score":4}\n```',
              },
            },
          ],
        }),
      ),
    );

    expect(await screen.findByText("3/5")).toBeTruthy();
    expect(screen.getByText("4/5")).toBeTruthy();
    expect(screen.getByText("Both points covered.")).toBeTruthy();
    expect(screen.getByText("Clear grammar.")).toBeTruthy();
    expect(screen.getAllByText("Task completion").length).toBeGreaterThan(1);
  });

  it("keeps the copy & paste flow when no key is saved", async () => {
    const fetch = vi.fn(
      async () => new Response(JSON.stringify({ files: [] })),
    );
    vi.stubGlobal("fetch", fetch);
    renderPage();

    await submitEmail();

    expect(await screen.findByText("Copy Text")).toBeTruthy();
    expect(gatewayCalls(fetch)).toHaveLength(0);
    expect(screen.queryAllByRole("status")).toHaveLength(0);
  });
});

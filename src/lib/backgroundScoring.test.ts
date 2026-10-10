import { IDBFactory } from "fake-indexeddb";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { saveGatewayKey, saveScoringMode } from "./aiGateway";
type AttemptsModule = typeof import("./attempts");
type BackgroundModule = typeof import("./backgroundScoring");

let db: AttemptsModule;
let bg: BackgroundModule;

/** Fresh module registry, so each test gets a clean IndexedDB handle. */
async function freshModules() {
  vi.resetModules();
  db = await import("./attempts");
  bg = await import("./backgroundScoring");
}

const gatewayReply = (content: string) =>
  new Response(JSON.stringify({ choices: [{ message: { content } }] }), {
    headers: { "Content-Type": "application/json" },
  });

const gatewayError = (message: string) =>
  new Response(JSON.stringify({ error: { message } }), { status: 500 });

const scoringTask = (attemptId: string) => ({
  attemptId,
  index: 0,
  kind: "writing" as const,
  message: "PROMPT",
});

describe("background scoring", () => {
  beforeEach(async () => {
    vi.stubGlobal("indexedDB", new IDBFactory());
    localStorage.clear();
    await freshModules();
  });

  afterEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it("does nothing in copy & paste mode", async () => {
    saveGatewayKey("vck_test");
    saveScoringMode("manual");
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    const attempt = await db.saveAttempt({
      taskId: "toefl/writing/email",
      problemId: "001",
      responses: [{ text: "Dear Ms. Lee," }],
    });

    expect(bg.scoreInBackground(scoringTask(attempt.id))).toBe(false);
    expect(fetch).not.toHaveBeenCalled();
    expect(bg.getJobs().size).toBe(0);
  });

  it("scores a finished writing answer and stores the parsed reply", async () => {
    saveGatewayKey("vck_test");
    const reply =
      'Good work.\n```toefl-score\n{"criteria":[{"points":3,"note":"Clear."}],"score":4}\n```';
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => gatewayReply(reply)),
    );
    const attempt = await db.saveAttempt({
      taskId: "toefl/writing/email",
      problemId: "001",
      responses: [{ text: "Dear Ms. Lee," }],
    });
    const saved: string[] = [];
    bg.subscribeAttempts((a) => saved.push(a.id));

    expect(bg.scoreInBackground(scoringTask(attempt.id))).toBe(true);
    expect(bg.jobFor(bg.getJobs(), attempt.id, 0)).toEqual({
      status: "scoring",
    });

    await vi.waitFor(async () => {
      expect(bg.jobFor(bg.getJobs(), attempt.id, 0)).toBeUndefined();
      const stored = await db.getAttempt(attempt.id);
      expect(stored?.responses[0].itemScore).toBe(4);
      expect(stored?.responses[0].aiReply).toBe(reply);
    });
    expect(saved).toEqual([attempt.id]);
  });

  it("scores a finished interview answer beside its saved transcript", async () => {
    saveGatewayKey("vck_test");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => gatewayReply('{"languageUse": 4, "organization": 4}')),
    );
    const attempt = await db.saveAttempt({
      taskId: "toefl/speaking/interview",
      problemId: "001",
      responses: [{ prompt: "Weekends?", transcript: "I play tennis." }],
    });

    bg.scoreInBackground({
      attemptId: attempt.id,
      index: 0,
      kind: "interview",
      message: "PROMPT",
    });

    await vi.waitFor(async () => {
      const stored = await db.getAttempt(attempt.id);
      expect(stored?.responses[0].ai?.scores).toEqual({
        languageUse: 4,
        organization: 4,
      });
      expect(stored?.responses[0].itemScore).toBe(4);
    });
  });

  it("keeps the task for a retry when the gateway fails", async () => {
    saveGatewayKey("vck_test");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => gatewayError("boom")),
    );
    const attempt = await db.saveAttempt({
      taskId: "toefl/writing/email",
      problemId: "001",
      responses: [{ text: "Dear Ms. Lee," }],
    });

    bg.scoreInBackground(scoringTask(attempt.id));
    await vi.waitFor(() =>
      expect(bg.jobFor(bg.getJobs(), attempt.id, 0)).toMatchObject({
        status: "error",
      }),
    );

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => gatewayReply('```toefl-score\n{"score": 5}\n```')),
    );
    bg.retryScoring(attempt.id, 0);

    await vi.waitFor(async () => {
      expect(bg.jobFor(bg.getJobs(), attempt.id, 0)).toBeUndefined();
      expect((await db.getAttempt(attempt.id))?.responses[0].itemScore).toBe(5);
    });
  });

  it("queues writes to one attempt so the page and a score never drop each other", async () => {
    const attempt = await db.saveAttempt({
      taskId: "toefl/speaking/interview",
      problemId: "001",
      responses: [{ prompt: "Weekends?" }],
    });

    await Promise.all([
      bg.updateAttempt(attempt.id, (a) => a && { ...a, elapsedSeconds: 12 }),
      bg.updateAttempt(attempt.id, (a) =>
        a
          ? {
              ...a,
              responses: [{ ...a.responses[0], transcript: "I play tennis." }],
            }
          : a,
      ),
    ]);

    const stored = await db.getAttempt(attempt.id);
    expect(stored?.elapsedSeconds).toBe(12);
    expect(stored?.responses[0].transcript).toBe("I play tennis.");
  });
});

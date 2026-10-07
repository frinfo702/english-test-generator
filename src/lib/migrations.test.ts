// @vitest-environment node
import { IDBFactory } from "fake-indexeddb";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function memoryStorage(): Storage {
  const m = new Map<string, string>();
  return {
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => void m.set(k, String(v)),
    removeItem: (k) => void m.delete(k),
    clear: () => m.clear(),
    key: (i) => [...m.keys()][i] ?? null,
    get length() {
      return m.size;
    },
  };
}

async function freshStart() {
  vi.stubGlobal("indexedDB", new IDBFactory());
  vi.resetModules();
  return {
    attempts: await import("./attempts"),
    migrations: await import("./migrations"),
  };
}

describe("legacy localStorage history", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", memoryStorage());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("has nothing to ask about on a fresh browser", async () => {
    const { migrations } = await freshStart();
    expect(migrations.legacyHistoryCount()).toBe(0);
  });

  it("treats unreadable old data as nothing to move", async () => {
    localStorage.setItem("score-history", "{not json");
    const { migrations } = await freshStart();
    expect(migrations.legacyHistoryCount()).toBe(0);
  });

  it("moves localStorage history into the database when asked", async () => {
    localStorage.setItem(
      "score-history",
      JSON.stringify([
        {
          taskId: "toeic/part5",
          date: "2026-02-18T09:40:19.235Z",
          correct: 23,
          total: 30,
          pct: 77,
          elapsedSeconds: 600,
          questionFile: "004.json",
        },
        {
          taskId: "toeic/part5",
          date: "2026-02-17T09:00:00.000Z",
          correct: 1,
          total: 2,
          pct: 50,
        },
      ]),
    );
    localStorage.setItem(
      "answer-history",
      JSON.stringify([
        {
          answerId: "ans-1",
          taskId: "toefl/writing/email",
          problemId: "toefl/writing/email/002",
          response: "Dear Ms. Lee,",
          date: "2026-02-19T00:00:00.000Z",
        },
        {
          answerId: "ans-2",
          taskId: "toefl/speaking/interview",
          problemId: "toefl/speaking/interview/003#q2",
          response: "I usually study at night.",
          date: "2026-02-20T00:00:00.000Z",
        },
      ]),
    );

    const { attempts, migrations } = await freshStart();
    expect(migrations.legacyHistoryCount()).toBe(4);

    expect(await attempts.getAllAttempts()).toEqual([]);
    expect(await migrations.migrateLegacyHistory()).toBe(4);

    expect(await attempts.getAllAttempts()).toEqual([
      {
        id: "legacy-score:2026-02-17T09:00:00.000Z:toeic/part5",
        taskId: "toeic/part5",
        problemId: undefined,
        date: "2026-02-17T09:00:00.000Z",
        elapsedSeconds: undefined,
        responses: [],
        score: { method: "legacy", correct: 1, total: 2 },
      },
      {
        id: "legacy-score:2026-02-18T09:40:19.235Z:toeic/part5",
        taskId: "toeic/part5",
        problemId: "004",
        date: "2026-02-18T09:40:19.235Z",
        elapsedSeconds: 600,
        responses: [],
        score: { method: "legacy", correct: 23, total: 30 },
      },
      {
        id: "ans-1",
        taskId: "toefl/writing/email",
        problemId: "002",
        date: "2026-02-19T00:00:00.000Z",
        responses: [{ itemId: undefined, text: "Dear Ms. Lee," }],
      },
      {
        id: "ans-2",
        taskId: "toefl/speaking/interview",
        problemId: "003",
        date: "2026-02-20T00:00:00.000Z",
        responses: [{ itemId: "q2", transcript: "I usually study at night." }],
      },
    ]);
    expect(localStorage.getItem("score-history")).toBeNull();
    expect(localStorage.getItem("answer-history")).toBeNull();
    expect(migrations.legacyHistoryCount()).toBe(0);
  });

  it("discards old history without touching the database", async () => {
    localStorage.setItem(
      "score-history",
      JSON.stringify([
        {
          taskId: "toeic/part5",
          date: "2026-02-18T00:00:00.000Z",
          correct: 1,
          total: 1,
        },
      ]),
    );
    const { attempts, migrations } = await freshStart();

    migrations.discardLegacyHistory();

    expect(migrations.legacyHistoryCount()).toBe(0);
    expect(await attempts.getAllAttempts()).toEqual([]);
  });
});

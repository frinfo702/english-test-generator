// @vitest-environment node
// jsdom's Blob loses its bytes when IndexedDB clones it; Node's survives.
import { IDBFactory } from "fake-indexeddb";
import { afterEach, describe, expect, it, vi } from "vitest";

type AttemptsModule = typeof import("./attempts");

/** A fresh module and an empty database: what a first launch sees. */
async function freshStart(): Promise<AttemptsModule> {
  vi.stubGlobal("indexedDB", new IDBFactory());
  vi.resetModules();
  return import("./attempts");
}

const tick = () => new Promise((r) => setTimeout(r, 2));

const audio = () =>
  new Blob(["fake opus bytes"], { type: "audio/webm;codecs=opus" });

describe("attempts", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("saves attempts and lists them oldest first", async () => {
    const db = await freshStart();
    const first = await db.saveAttempt({
      taskId: "toeic/part5",
      problemId: "001",
      responses: [{ itemId: "q1", choice: "B" }],
      score: { method: "answer-key", correct: 0, total: 1 },
    });
    await tick();
    const second = await db.saveAttempt({
      taskId: "toefl/writing/email",
      problemId: "20261007-library-hours",
      responses: [{ text: "Dear Professor," }],
    });

    expect(await db.getAllAttempts()).toEqual([first, second]);
  });

  it("keeps a recording's bytes", async () => {
    const db = await freshStart();
    await db.saveAttempt({
      taskId: "toefl/speaking/listen-repeat",
      problemId: "001",
      responses: [
        { itemId: "ls1", audio: audio(), recordedAt: 1, promptEndedAt: 0 },
      ],
    });

    const [saved] = await db.getAllAttempts();
    expect(await saved.responses[0].audio!.text()).toBe("fake opus bytes");
    expect(saved.responses[0].audio!.type).toBe("audio/webm;codecs=opus");
  });

  it("clears everything", async () => {
    const db = await freshStart();
    await db.saveAttempt({ taskId: "toeic/part5", responses: [] });
    await db.clearAttempts();
    expect(await db.getAllAttempts()).toEqual([]);
  });

  it("round-trips a backup with recordings into another browser", async () => {
    const source = await freshStart();
    const saved = await source.saveAttempt({
      taskId: "toefl/speaking/interview",
      problemId: "001",
      responses: [{ itemId: "q1", audio: audio(), transcript: "Hello" }],
    });
    const backup = await source.exportBackup(true);

    const target = await freshStart();
    expect(await target.importBackup(backup)).toBe(1);
    // Same IDs overwrite, so a second import adds nothing.
    expect(await target.importBackup(backup)).toBe(1);

    const all = await target.getAllAttempts();
    expect(all).toHaveLength(1);
    const { audio: restored, ...rest } = all[0].responses[0];
    expect(rest).toEqual({ itemId: "q1", transcript: "Hello" });
    expect(await restored!.text()).toBe("fake opus bytes");
    expect(restored!.type).toBe("audio/webm;codecs=opus");
    expect(all[0].id).toBe(saved.id);
  });

  it("leaves recordings out unless asked", async () => {
    const db = await freshStart();
    await db.saveAttempt({
      taskId: "toefl/speaking/interview",
      responses: [{ itemId: "q1", audio: audio(), transcript: "Hello" }],
    });

    const backup = JSON.parse(await (await db.exportBackup(false)).text());
    expect(backup.attempts[0].responses).toEqual([
      { itemId: "q1", transcript: "Hello" },
    ]);
  });

  it("refuses files that are not backups", async () => {
    const db = await freshStart();
    await expect(db.importBackup(new Blob(["not json"]))).rejects.toThrow(
      "not valid JSON",
    );
    await expect(
      db.importBackup(new Blob([JSON.stringify({ attempts: [] })])),
    ).rejects.toThrow("not a backup from this app");
  });

  it("never fetches a URL named by an imported file", async () => {
    const db = await freshStart();
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const evil = {
      format: "english-test-generator/backup",
      version: 1,
      attempts: [
        {
          id: "x",
          taskId: "toeic/part5",
          date: "2026-01-01T00:00:00.000Z",
          responses: [{ audio: "https://example.com/track-me" }],
        },
      ],
    };

    await expect(
      db.importBackup(new Blob([JSON.stringify(evil)])),
    ).rejects.toThrow();
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(await db.getAllAttempts()).toEqual([]);
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  fetchAllQuestions,
  fetchQuestionByNumberWithMeta,
  fetchQuestionIndex,
  fetchRandomQuestion,
  fetchTaskQuestionCount,
  listQuestionFiles,
} from "./questions";

const fetchMock = vi.fn();

function mockResponse(body: unknown, ok = true): Response {
  return {
    ok,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response;
}

describe("questions loader", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("loads question index", async () => {
    fetchMock.mockResolvedValue(mockResponse({ files: ["001.json"] }));

    const result = await fetchQuestionIndex("toeic/part5");

    expect(fetchMock).toHaveBeenCalledWith("/questions/toeic/part5/index.json");
    expect(result.files).toEqual(["001.json"]);
  });

  it("throws when index does not exist", async () => {
    fetchMock.mockResolvedValue(mockResponse({}, false));

    await expect(fetchQuestionIndex("missing/task")).rejects.toThrow(
      "No questions found for missing/task. Generate some first!",
    );
  });

  it("loads a random question file from index", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.9);
    fetchMock
      .mockResolvedValueOnce(mockResponse({ files: ["001.json", "002.json"] }))
      .mockResolvedValueOnce(mockResponse({ id: "q2" }));

    const result = await fetchRandomQuestion<{ id: string }>("toeic/part5");

    expect(result).toEqual({ id: "q2" });
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/questions/toeic/part5/002.json",
    );
  });

  it("throws when no question files exist", async () => {
    fetchMock.mockResolvedValue(mockResponse({ files: [] }));

    await expect(fetchRandomQuestion("toeic/part5")).rejects.toThrow(
      "No question files in toeic/part5. Generate some first!",
    );
  });

  it("loads all question files", async () => {
    fetchMock
      .mockResolvedValueOnce(mockResponse({ files: ["001.json", "002.json"] }))
      .mockResolvedValueOnce(mockResponse({ id: 1 }))
      .mockResolvedValueOnce(mockResponse({ id: 2 }));

    const result = await fetchAllQuestions<{ id: number }>("toeic/part5");

    expect(result).toEqual([{ id: 1 }, { id: 2 }]);
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/questions/toeic/part5/001.json",
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      "/questions/toeic/part5/002.json",
    );
  });

  it("throws when loading one question file fails", async () => {
    fetchMock
      .mockResolvedValueOnce(mockResponse({ files: ["001.json"] }))
      .mockResolvedValueOnce(mockResponse({}, false));

    await expect(fetchAllQuestions("toeic/part5")).rejects.toThrow(
      "Failed to load: 001.json",
    );
  });

  it("lists question files sorted by numeric number", async () => {
    fetchMock.mockResolvedValue(
      mockResponse({ files: ["010.json", "002.json", "001.json"] }),
    );

    const result = await listQuestionFiles("toeic/part5");

    expect(result).toEqual([
      { file: "001.json", number: 1 },
      { file: "002.json", number: 2 },
      { file: "010.json", number: 10 },
    ]);
  });

  it("loads question by question number", async () => {
    fetchMock
      .mockResolvedValueOnce(mockResponse({ files: ["001.json", "002.json"] }))
      .mockResolvedValueOnce(mockResponse({ id: "q2" }));

    const result = await fetchQuestionByNumberWithMeta<{ id: string }>(
      "toeic/part5",
      2,
    );

    expect(result).toEqual({ file: "002.json", data: { id: "q2" } });
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/questions/toeic/part5/002.json",
    );
  });
});

describe("fetchTaskQuestionCount", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("returns null when no question files exist", async () => {
    fetchMock.mockResolvedValue(mockResponse({ files: [] }));

    const result = await fetchTaskQuestionCount("toeic/part5");

    expect(result).toBeNull();
  });

  it("counts questions array", async () => {
    fetchMock
      .mockResolvedValueOnce(mockResponse({ files: ["001.json"] }))
      .mockResolvedValueOnce(mockResponse({ questions: [{}, {}, {}] }));

    const result = await fetchTaskQuestionCount("toeic/part5");

    expect(result).toBe(3);
  });

  it("counts sentences array", async () => {
    fetchMock
      .mockResolvedValueOnce(mockResponse({ files: ["001.json"] }))
      .mockResolvedValueOnce(mockResponse({ sentences: [{}, {}] }));

    const result = await fetchTaskQuestionCount("toefl/speaking/listen-repeat");

    expect(result).toBe(2);
  });

  it("counts items array", async () => {
    fetchMock
      .mockResolvedValueOnce(mockResponse({ files: ["001.json"] }))
      .mockResolvedValueOnce(mockResponse({ items: [{}, {}, {}, {}] }));

    const result = await fetchTaskQuestionCount("toefl/reading/complete-words");

    expect(result).toBe(4);
  });

  it("sums questions across texts", async () => {
    fetchMock
      .mockResolvedValueOnce(mockResponse({ files: ["001.json"] }))
      .mockResolvedValueOnce(
        mockResponse({
          texts: [
            { questions: [{}, {}] },
            { questions: [{}] },
          ],
        }),
      );

    const result = await fetchTaskQuestionCount("toefl/reading/daily-life");

    expect(result).toBe(3);
  });

  it("sums questions across passages", async () => {
    fetchMock
      .mockResolvedValueOnce(mockResponse({ files: ["001.json"] }))
      .mockResolvedValueOnce(
        mockResponse({
          passages: [
            { questions: [{}, {}, {}, {}] },
            { questions: [{}, {}, {}, {}] },
          ],
        }),
      );

    const result = await fetchTaskQuestionCount("toeic/part6");

    expect(result).toBe(8);
  });

  it("returns 1 for email writing tasks", async () => {
    fetchMock
      .mockResolvedValueOnce(mockResponse({ files: ["001.json"] }))
      .mockResolvedValueOnce(mockResponse({ scenario: { title: "Email" } }));

    const result = await fetchTaskQuestionCount("toefl/writing/email");

    expect(result).toBe(1);
  });

  it("returns 1 for discussion writing tasks", async () => {
    fetchMock
      .mockResolvedValueOnce(mockResponse({ files: ["001.json"] }))
      .mockResolvedValueOnce(
        mockResponse({ professorQuestion: "What do you think?" }),
      );

    const result = await fetchTaskQuestionCount("toefl/writing/discussion");

    expect(result).toBe(1);
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchAllQuestions, fetchQuestionIndex, fetchRandomQuestion } from "./questions";

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
      "No questions found for missing/task. Generate some first!"
    );
  });

  it("loads a random question file from index", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.9);
    fetchMock
      .mockResolvedValueOnce(mockResponse({ files: ["001.json", "002.json"] }))
      .mockResolvedValueOnce(mockResponse({ id: "q2" }));

    const result = await fetchRandomQuestion<{ id: string }>("toeic/part5");

    expect(result).toEqual({ id: "q2" });
    expect(fetchMock).toHaveBeenNthCalledWith(2, "/questions/toeic/part5/002.json");
  });

  it("throws when no question files exist", async () => {
    fetchMock.mockResolvedValue(mockResponse({ files: [] }));

    await expect(fetchRandomQuestion("toeic/part5")).rejects.toThrow(
      "No question files in toeic/part5. Generate some first!"
    );
  });

  it("loads all question files", async () => {
    fetchMock
      .mockResolvedValueOnce(mockResponse({ files: ["001.json", "002.json"] }))
      .mockResolvedValueOnce(mockResponse({ id: 1 }))
      .mockResolvedValueOnce(mockResponse({ id: 2 }));

    const result = await fetchAllQuestions<{ id: number }>("toeic/part5");

    expect(result).toEqual([{ id: 1 }, { id: 2 }]);
    expect(fetchMock).toHaveBeenNthCalledWith(2, "/questions/toeic/part5/001.json");
    expect(fetchMock).toHaveBeenNthCalledWith(3, "/questions/toeic/part5/002.json");
  });

  it("throws when loading one question file fails", async () => {
    fetchMock
      .mockResolvedValueOnce(mockResponse({ files: ["001.json"] }))
      .mockResolvedValueOnce(mockResponse({}, false));

    await expect(fetchAllQuestions("toeic/part5")).rejects.toThrow("Failed to load: 001.json");
  });
});

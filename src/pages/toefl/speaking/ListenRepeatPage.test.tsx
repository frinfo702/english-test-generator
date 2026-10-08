import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useParams } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ListenRepeatPage } from "./ListenRepeatPage";
import { useQuestion } from "../../../hooks/useQuestion";
import { useTts } from "../../../hooks/useTts";
import { useSpeechRecognition } from "../../../hooks/useSpeechRecognition";
import { useElapsedTimer } from "../../../hooks/useElapsedTimer";
import { useScoreHistory } from "../../../hooks/useScoreHistory";
import { TrialItemContext } from "../../../hooks/useTrialItem";

const playMock = vi.fn();
const stopTtsMock = vi.fn();
const startSpeechMock = vi.fn();
const stopSpeechMock = vi
  .fn()
  .mockResolvedValue({ text: "", audio: null, startedAt: null });
const loadByIdMock = vi.fn();
const startTimerMock = vi.fn();
const stopTimerMock = vi.fn().mockReturnValue(12);
const resetTimerMock = vi.fn();
const saveScoreMock = vi.fn();
const pauseMock = vi.fn();
const resumeMock = vi.fn();
const seekMock = vi.fn();

vi.mock("../../../hooks/useQuestion", () => ({
  useQuestion: vi.fn(),
}));

vi.mock("../../../hooks/useTts", () => ({
  useTts: vi.fn(),
}));

vi.mock("../../../hooks/useSpeechRecognition", () => ({
  useSpeechRecognition: vi.fn(),
}));

vi.mock("../../../hooks/useElapsedTimer", () => ({
  useElapsedTimer: vi.fn(),
}));

vi.mock("../../../hooks/useScoreHistory", () => ({
  useScoreHistory: vi.fn(),
}));

const wavResolvers: ((wav: Blob) => void)[] = [];
vi.mock("../../../lib/wav", () => ({
  toWav16k: vi.fn(
    () => new Promise<Blob>((resolve) => wavResolvers.push(resolve)),
  ),
}));

vi.mock("../../../lib/pronunciation", () => ({
  assessPronunciation: vi.fn(async () => ({
    pronunciation: 90,
    accuracy: 90,
    fluency: 90,
    completeness: 100,
    words: [],
  })),
}));

const putAttemptsMock = vi.fn();
vi.mock("../../../lib/attempts", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../lib/attempts")>()),
  putAttempts: (...args: unknown[]) => putAttemptsMock(...args),
}));

const mockData = {
  sentences: [
    { id: "s1", text: "The library will be closed.", wordCount: 6 },
    { id: "s2", text: "Could you remind me?", wordCount: 4 },
  ],
};

function ResultStub() {
  const { id } = useParams();
  return <p>Result {id}</p>;
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/toefl/speaking/listen-repeat/1"]}>
      <Routes>
        <Route
          path="/toefl/speaking/listen-repeat/:questionId"
          element={<ListenRepeatPage />}
        />
        <Route path="/results/:id" element={<ResultStub />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ListenRepeatPage", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    stopSpeechMock.mockResolvedValue({
      text: "",
      audio: null,
      startedAt: null,
    });

    vi.mocked(useQuestion).mockReturnValue({
      data: mockData,
      file: "001.json",
      loading: false,
      error: null,
      load: vi.fn(),
      loadByFile: vi.fn(),
      loadById: loadByIdMock,
    });

    vi.mocked(useTts).mockReturnValue({
      playing: false,
      loading: false,
      error: null,
      duration: 2,
      currentTime: 0,
      playbackRate: 1,
      setPlaybackRate: vi.fn(),
      play: playMock,
      playSegments: vi.fn(),
      playSegmentsWithGaps: vi.fn(),
      pause: pauseMock,
      resume: resumeMock,
      stop: stopTtsMock,
      seek: seekMock,
    });

    vi.mocked(useSpeechRecognition).mockReturnValue({
      supported: true,
      recording: false,
      transcript: "",
      error: "Speech recognition failed due to a network error.",
      start: startSpeechMock,
      stop: stopSpeechMock,
    });

    vi.mocked(useElapsedTimer).mockReturnValue({
      display: "00:00",
      elapsedSeconds: 0,
      running: true,
      start: startTimerMock,
      stop: stopTimerMock,
      reset: resetTimerMock,
    });

    vi.mocked(useScoreHistory).mockReturnValue({
      saveScore: saveScoreMock,
      getAll: vi.fn(),
      clearAll: vi.fn(),
    });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("shows loading state initially", () => {
    vi.mocked(useQuestion).mockReturnValue({
      data: null,
      file: null,
      loading: true,
      error: null,
      load: vi.fn(),
      loadByFile: vi.fn(),
      loadById: loadByIdMock,
    });

    renderPage();
    expect(screen.getByText("Loading question...")).toBeTruthy();
  });

  const recordingSpeech = () =>
    vi.mocked(useSpeechRecognition).mockReturnValue({
      supported: true,
      recording: true,
      transcript: "",
      error: null,
      start: startSpeechMock,
      stop: stopSpeechMock,
    });

  const pressStart = () =>
    act(() => {
      screen.getByRole("button", { name: /^Start$/ }).click();
    });

  /** Ends the prompt that started playing on the given (0-based) call. */
  async function finishPrompt(call: number) {
    await waitFor(() => expect(playMock).toHaveBeenCalledTimes(call + 1));
    act(() => {
      playMock.mock.calls[call][1]?.();
    });
  }

  it("shows the directions first and plays nothing until Start", async () => {
    renderPage();

    expect(screen.getByRole("button", { name: /^Start$/ })).toBeTruthy();
    expect(screen.getByText(/There is no\s+preparation\s+time/)).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /Test microphone/ }),
    ).toBeTruthy();
    expect(playMock).not.toHaveBeenCalled();

    pressStart();

    await waitFor(() => {
      expect(playMock).toHaveBeenCalledWith(
        "/audio/toefl/speaking/listen-repeat/001/1.mp3",
        expect.any(Function),
      );
    });
    expect(screen.getByText("Listen and repeat only once.")).toBeTruthy();
  });

  it("plays the scene introduction first, then the first sentence", async () => {
    vi.mocked(useQuestion).mockReturnValue({
      data: { ...mockData, scenario: "You are working at the library." },
      file: "001.json",
      loading: false,
      error: null,
      load: vi.fn(),
      loadByFile: vi.fn(),
      loadById: loadByIdMock,
    });
    renderPage();
    pressStart();

    expect(screen.getByText("You are working at the library.")).toBeTruthy();
    expect(playMock).toHaveBeenCalledWith(
      "/audio/toefl/speaking/listen-repeat/001/scenario.mp3",
      expect.any(Function),
    );
    expect(startSpeechMock).not.toHaveBeenCalled();

    await finishPrompt(0);

    await waitFor(() => {
      expect(playMock).toHaveBeenLastCalledWith(
        "/audio/toefl/speaking/listen-repeat/001/1.mp3",
        expect.any(Function),
      );
    });
    expect(screen.getByText("Question 1 / 2")).toBeTruthy();
  });

  it("starts recording as soon as the sentence finishes playing", async () => {
    renderPage();
    pressStart();
    recordingSpeech();
    await finishPrompt(0);

    await waitFor(() => {
      expect(startSpeechMock).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByText("Repeat the sentence now")).toBeTruthy();
    expect(screen.getByText("8s")).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: /Start Recording/i }),
    ).toBeNull();
  });

  const nextButton = () =>
    screen.getByRole("button", { name: /^Next$/ }) as HTMLButtonElement;

  it("stops at the time limit, waits for Next, then plays the next sentence", async () => {
    renderPage();
    pressStart();
    recordingSpeech();
    await finishPrompt(0);
    expect(nextButton().disabled).toBe(true);

    // recording (8s) + processing delay (400ms)
    await act(async () => {
      vi.advanceTimersByTime(9000);
    });

    await waitFor(() => {
      expect(nextButton().disabled).toBe(false);
    });
    expect(stopSpeechMock).toHaveBeenCalled();
    expect(playMock).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Repeat the sentence now")).toBeTruthy();
    expect(screen.queryByText("Comparison:")).toBeNull();

    act(() => {
      nextButton().click();
    });

    await waitFor(() => {
      expect(screen.getByText("Question 2 / 2")).toBeTruthy();
      expect(playMock).toHaveBeenCalledWith(
        "/audio/toefl/speaking/listen-repeat/001/2.mp3",
        expect.any(Function),
      );
    });
  });

  it("in a test, hands the set in without waiting for pronunciation", async () => {
    const saved = { id: "attempt-1", responses: [] };
    saveScoreMock.mockResolvedValue(saved);
    stopSpeechMock.mockResolvedValue({
      text: "",
      audio: new Blob(["a"]),
      startedAt: 1,
    });
    const complete = vi.fn();
    render(
      <MemoryRouter>
        <TrialItemContext.Provider
          value={{ problemId: "001", complete, onTimeout: vi.fn() }}
        >
          <ListenRepeatPage />
        </TrialItemContext.Provider>
      </MemoryRouter>,
    );
    pressStart();
    recordingSpeech();

    for (const call of [0, 1]) {
      await finishPrompt(call);
      await act(async () => {
        vi.advanceTimersByTime(9000);
      });
      if (call === 0) {
        await waitFor(() => expect(nextButton().disabled).toBe(false));
        act(() => nextButton().click());
      }
    }

    // The last take's processing delay starts only once stopSpeech settles.
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    // Pronunciation is still pending (toWav16k never resolved).
    await waitFor(() => expect(complete).toHaveBeenCalledTimes(1));
    expect(saveScoreMock).toHaveBeenCalledWith(
      expect.objectContaining({
        responses: [
          expect.objectContaining({ assessment: undefined }),
          expect.objectContaining({ assessment: undefined }),
        ],
      }),
    );
    expect(putAttemptsMock).not.toHaveBeenCalled();

    await act(async () => {
      wavResolvers.forEach((resolve) => resolve(new Blob(["wav"])));
    });

    await waitFor(() => expect(putAttemptsMock).toHaveBeenCalledTimes(1));
    const [[rewritten]] = putAttemptsMock.mock.calls[0] as [
      [{ id: string; responses: { assessment?: unknown }[] }],
    ];
    expect(rewritten.id).toBe("attempt-1");
    expect(rewritten.responses.some((r) => r.assessment)).toBe(true);
  });

  it("displays unsupported browser message when speech recognition is unavailable", async () => {
    vi.mocked(useSpeechRecognition).mockReturnValue({
      supported: false,
      recording: false,
      transcript: "",
      error: null,
      start: startSpeechMock,
      stop: stopSpeechMock,
    });

    renderPage();

    await waitFor(() => {
      expect(
        screen.getByText(
          /Microphone recording is not supported in this browser/i,
        ),
      ).toBeTruthy();
    });
    expect(
      (screen.getByRole("button", { name: /^Start$/ }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });

  it.each([
    "Speech recognition failed due to a network error.",
    "Recording stopped unexpectedly. Please try again.",
  ])("offers a retry when recording fails: %s", async (message) => {
    const { rerender } = renderPage();
    pressStart();
    await finishPrompt(0);

    await waitFor(() => {
      expect(startSpeechMock).toHaveBeenCalled();
    });

    vi.mocked(useSpeechRecognition).mockReturnValue({
      supported: true,
      recording: false,
      transcript: "",
      error: message,
      start: startSpeechMock,
      stop: stopSpeechMock,
    });

    rerender(
      <MemoryRouter initialEntries={["/toefl/speaking/listen-repeat/1"]}>
        <Routes>
          <Route
            path="/toefl/speaking/listen-repeat/:questionId"
            element={<ListenRepeatPage />}
          />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Retry This Sentence/i }),
      ).toBeTruthy();
    });
  });

  it("saves the set with rubric scores and opens its result page", async () => {
    saveScoreMock.mockResolvedValue({ id: "attempt-1" });
    renderPage();
    pressStart();
    recordingSpeech();

    await finishPrompt(0);
    await act(async () => {
      vi.advanceTimersByTime(9000);
    });
    await waitFor(() => {
      expect(nextButton().disabled).toBe(false);
    });
    act(() => {
      nextButton().click();
    });

    await finishPrompt(1);
    await waitFor(() => {
      expect(startSpeechMock).toHaveBeenCalledTimes(2);
    });
    await act(async () => {
      vi.advanceTimersByTime(9000);
    });

    await waitFor(() => {
      expect(screen.getByText("Result attempt-1")).toBeTruthy();
    });
    expect(saveScoreMock).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "ets-rubric",
        correct: 0,
        total: 10,
        question: mockData,
        responses: [
          expect.objectContaining({
            itemId: "s1",
            prompt: "The library will be closed.",
            itemScore: 0,
          }),
          expect.objectContaining({ itemId: "s2", itemScore: 0 }),
        ],
      }),
    );
  });
});

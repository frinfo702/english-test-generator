import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ListenRepeatPage } from "./ListenRepeatPage";
import { useQuestion } from "../../../hooks/useQuestion";
import { useTts } from "../../../hooks/useTts";
import { useSpeechRecognition } from "../../../hooks/useSpeechRecognition";
import { useElapsedTimer } from "../../../hooks/useElapsedTimer";
import { useScoreHistory } from "../../../hooks/useScoreHistory";

const playMock = vi.fn();
const stopTtsMock = vi.fn();
const startSpeechMock = vi.fn();
const stopSpeechMock = vi.fn().mockResolvedValue(undefined);
const loadByQuestionNumberMock = vi.fn();
const startTimerMock = vi.fn();
const stopTimerMock = vi.fn().mockReturnValue(12);
const resetTimerMock = vi.fn();
const saveScoreMock = vi.fn();

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

const mockData = {
  sentences: [
    { id: "s1", text: "The library will be closed.", wordCount: 6 },
    { id: "s2", text: "Could you remind me?", wordCount: 4 },
  ],
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/toefl/speaking/listen-repeat/1"]}>
      <Routes>
        <Route
          path="/toefl/speaking/listen-repeat/:questionNumber"
          element={<ListenRepeatPage />}
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ListenRepeatPage", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    vi.mocked(useQuestion).mockReturnValue({
      data: mockData,
      file: "001.json",
      loading: false,
      error: null,
      loadByQuestionNumber: loadByQuestionNumberMock,
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
      pause: vi.fn(),
      resume: vi.fn(),
      stop: stopTtsMock,
      seek: vi.fn(),
    });

    vi.mocked(useSpeechRecognition).mockReturnValue({
      supported: true,
      recording: false,
      transcript: "",
      error: null,
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
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("shows loading state initially", () => {
    vi.mocked(useQuestion).mockReturnValue({
      data: null,
      file: null,
      loading: true,
      error: null,
      loadByQuestionNumber: loadByQuestionNumberMock,
    });

    renderPage();
    expect(screen.getByText("Loading question set...")).toBeTruthy();
  });

  it("plays the first sentence audio when loaded", async () => {
    renderPage();

    await waitFor(() => {
      expect(playMock).toHaveBeenCalledWith(
        "/audio/toefl/speaking/listen-repeat/001/1.mp3",
        expect.any(Function),
      );
    });

    expect(screen.getByText("Listen carefully...")).toBeTruthy();
  });

  it("starts recording after audio ends", async () => {
    renderPage();

    let onEnded: (() => void) | undefined;
    await waitFor(() => {
      expect(playMock).toHaveBeenCalled();
      onEnded = playMock.mock.calls[0][1];
    });

    onEnded?.();

    await waitFor(() => {
      expect(startSpeechMock).toHaveBeenCalled();
    });

    expect(screen.getByText("Repeat the sentence now")).toBeTruthy();
    expect(screen.getByText("3s")).toBeTruthy();
  });

  it("advances to the next sentence after recording time expires", async () => {
    renderPage();

    let onEnded: (() => void) | undefined;
    await waitFor(() => {
      onEnded = playMock.mock.calls[0][1];
    });

    onEnded?.();

    await waitFor(() => {
      expect(startSpeechMock).toHaveBeenCalled();
    });

    vi.advanceTimersByTime(3500);

    await waitFor(() => {
      expect(playMock).toHaveBeenCalledWith(
        "/audio/toefl/speaking/listen-repeat/001/2.mp3",
        expect.any(Function),
      );
    });
  });

  it("shows final score after the last sentence", async () => {
    renderPage();

    for (let sentenceIndex = 0; sentenceIndex < 2; sentenceIndex++) {
      let onEnded: (() => void) | undefined;
      await waitFor(() => {
        const calls = playMock.mock.calls;
        expect(calls.length).toBeGreaterThan(sentenceIndex);
        onEnded = calls[sentenceIndex][1];
      });

      onEnded?.();

      await waitFor(() => {
        expect(startSpeechMock).toHaveBeenCalledTimes(sentenceIndex + 1);
      });

      vi.advanceTimersByTime(3500);

      if (sentenceIndex < 1) {
        await waitFor(() => {
          expect(playMock).toHaveBeenCalledTimes(sentenceIndex + 2);
        });
      }
    }

    await waitFor(() => {
      expect(screen.getByText("Section Complete")).toBeTruthy();
    });

    expect(saveScoreMock).toHaveBeenCalledWith(
      "toefl/speaking/listen-repeat",
      0,
      9,
      12,
      "001.json",
    );
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
          /Speech recognition is not supported in this browser/i,
        ),
      ).toBeTruthy();
    });
  });
});

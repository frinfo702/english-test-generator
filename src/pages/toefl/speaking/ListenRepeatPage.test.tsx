import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
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
      load: vi.fn(),
      loadByFile: vi.fn(),
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

  it("transitions to ready phase after audio ends", async () => {
    renderPage();

    let onEnded: (() => void) | undefined;
    await waitFor(() => {
      expect(playMock).toHaveBeenCalled();
      onEnded = playMock.mock.calls[0][1];
    });

    act(() => {
      onEnded?.();
    });

    await waitFor(() => {
      expect(screen.getByText("Ready to record")).toBeTruthy();
    });

    expect(
      screen.getByRole("button", { name: /Start Recording/i }),
    ).toBeTruthy();
  });

  it("starts recording when user clicks Start Recording button", async () => {
    renderPage();

    let onEnded: (() => void) | undefined;
    await waitFor(() => {
      expect(playMock).toHaveBeenCalled();
      onEnded = playMock.mock.calls[0][1];
    });

    act(() => {
      onEnded?.();
    });

    await waitFor(() => {
      expect(screen.getByText("Ready to record")).toBeTruthy();
    });

    act(() => {
      screen.getByRole("button", { name: /Start Recording/i }).click();
    });

    await waitFor(() => {
      expect(startSpeechMock).toHaveBeenCalled();
    });

    expect(screen.getByText("Repeat the sentence now")).toBeTruthy();
    expect(screen.getByText("3s")).toBeTruthy();
  });

  it("shows per-question feedback after recording and advances on Next Question", async () => {
    renderPage();

    let onEnded: (() => void) | undefined;
    await waitFor(() => {
      onEnded = playMock.mock.calls[0][1];
    });

    act(() => {
      onEnded?.();
    });

    await waitFor(() => {
      expect(screen.getByText("Ready to record")).toBeTruthy();
    });

    vi.mocked(useSpeechRecognition).mockReturnValue({
      supported: true,
      recording: true,
      transcript: "",
      error: null,
      start: startSpeechMock,
      stop: stopSpeechMock,
    });

    act(() => {
      screen.getByRole("button", { name: /Start Recording/i }).click();
    });

    await waitFor(() => {
      expect(startSpeechMock).toHaveBeenCalled();
    });

    // Advance through recording (3s) + processing delay (400ms)
    await act(async () => {
      vi.advanceTimersByTime(4000);
    });

    await waitFor(() => {
      expect(screen.getByText("Comparison:")).toBeTruthy();
      expect(screen.getByText("Correct")).toBeTruthy();
      expect(screen.getByText("You")).toBeTruthy();
    });

    expect(screen.getByRole("button", { name: /Next Question/i })).toBeTruthy();

    act(() => {
      screen.getByRole("button", { name: /Next Question/i }).click();
    });

    await waitFor(() => {
      expect(screen.getByText("Question 2 / 2")).toBeTruthy();
      expect(screen.getByText("Listen carefully...")).toBeTruthy();
    });
  });

  it("shows recording UI after clicking Start Recording", async () => {
    renderPage();

    let onEnded: (() => void) | undefined;
    await waitFor(() => {
      onEnded = playMock.mock.calls[0][1];
    });

    act(() => {
      onEnded?.();
    });

    await waitFor(() => {
      expect(screen.getByText("Ready to record")).toBeTruthy();
    });

    act(() => {
      screen.getByRole("button", { name: /Start Recording/i }).click();
    });

    await waitFor(() => {
      expect(startSpeechMock).toHaveBeenCalled();
    });

    expect(screen.getByText("Repeat the sentence now")).toBeTruthy();
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
  });

  it("shows a retry button when speech recognition fails", async () => {
    const { rerender } = renderPage();

    let onEnded: (() => void) | undefined;
    await waitFor(() => {
      onEnded = playMock.mock.calls[0][1];
    });

    act(() => {
      onEnded?.();
    });

    await waitFor(() => {
      expect(screen.getByText("Ready to record")).toBeTruthy();
    });

    act(() => {
      screen.getByRole("button", { name: /Start Recording/i }).click();
    });

    await waitFor(() => {
      expect(startSpeechMock).toHaveBeenCalled();
    });

    vi.mocked(useSpeechRecognition).mockReturnValue({
      supported: true,
      recording: false,
      transcript: "",
      error: "Speech recognition failed due to a network error.",
      start: startSpeechMock,
      stop: stopSpeechMock,
    });

    rerender(
      <MemoryRouter initialEntries={["/toefl/speaking/listen-repeat/1"]}>
        <Routes>
          <Route
            path="/toefl/speaking/listen-repeat/:questionNumber"
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

  it("shows error when recording stops unexpectedly during recording phase", async () => {
    vi.mocked(useSpeechRecognition).mockReturnValue({
      supported: true,
      recording: false,
      transcript: "",
      error: "Recording stopped unexpectedly. Please try again.",
      start: startSpeechMock,
      stop: stopSpeechMock,
    });

    const { rerender } = renderPage();

    let onEnded: (() => void) | undefined;
    await waitFor(() => {
      onEnded = playMock.mock.calls[0][1];
    });

    act(() => {
      onEnded?.();
    });

    await waitFor(() => {
      expect(screen.getByText("Ready to record")).toBeTruthy();
    });

    act(() => {
      screen.getByRole("button", { name: /Start Recording/i }).click();
    });

    await waitFor(() => {
      expect(startSpeechMock).toHaveBeenCalled();
    });

    rerender(
      <MemoryRouter initialEntries={["/toefl/speaking/listen-repeat/1"]}>
        <Routes>
          <Route
            path="/toefl/speaking/listen-repeat/:questionNumber"
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

  it("shows audio seek and pause controls in the review section after grading", async () => {
    renderPage();

    // Sentence 1: audio plays → ends → record → finish
    let onEnded: (() => void) | undefined;
    await waitFor(() => {
      onEnded = playMock.mock.calls[0][1];
    });
    act(() => {
      onEnded?.();
    });
    await waitFor(() => {
      expect(screen.getByText("Ready to record")).toBeTruthy();
    });

    vi.mocked(useSpeechRecognition).mockReturnValue({
      supported: true,
      recording: true,
      transcript: "",
      error: null,
      start: startSpeechMock,
      stop: stopSpeechMock,
    });

    act(() => {
      screen.getByRole("button", { name: /Start Recording/i }).click();
    });

    await waitFor(() => {
      expect(startSpeechMock).toHaveBeenCalled();
    });

    await act(async () => {
      vi.advanceTimersByTime(4000);
    });

    // Now in feedback phase for sentence 1. Click Next Question.
    await waitFor(() => {
      expect(screen.getByText("Comparison:")).toBeTruthy();
    });

    act(() => {
      screen.getByRole("button", { name: /Next Question/i }).click();
    });

    // Sentence 2: audio plays → ends → record → finish (last sentence → review)
    await waitFor(() => {
      expect(playMock).toHaveBeenCalledTimes(2);
    });
    const onEnded2 = playMock.mock.calls[1][1];
    act(() => {
      onEnded2?.();
    });
    await waitFor(() => {
      expect(screen.getByText("Ready to record")).toBeTruthy();
    });

    act(() => {
      screen.getByRole("button", { name: /Start Recording/i }).click();
    });

    await waitFor(() => {
      expect(startSpeechMock).toHaveBeenCalledTimes(2);
    });

    await act(async () => {
      vi.advanceTimersByTime(4000);
    });

    // Now in graded/review section. Check for audio controls on sentence cards.
    await waitFor(() => {
      expect(screen.getByText("Section Complete")).toBeTruthy();
    });

    const playButtons = screen.getAllByRole("button", { name: /Play Audio/i });
    expect(playButtons.length).toBeGreaterThanOrEqual(2);

    // Click play on first sentence card - this sets activeReviewSentence
    act(() => {
      playButtons[0].click();
    });

    // After clicking, seek controls should appear (shown regardless of playing state)
    await waitFor(() => {
      expect(screen.getAllByRole("button", { name: /10s/i }).length).toBeGreaterThanOrEqual(1);
    });
  });

  it("allows replaying audio in feedback phase after audio ends", async () => {
    renderPage();

    let onEnded: (() => void) | undefined;
    await waitFor(() => {
      onEnded = playMock.mock.calls[0][1];
    });
    act(() => {
      onEnded?.();
    });
    await waitFor(() => {
      expect(screen.getByText("Ready to record")).toBeTruthy();
    });

    vi.mocked(useSpeechRecognition).mockReturnValue({
      supported: true,
      recording: true,
      transcript: "",
      error: null,
      start: startSpeechMock,
      stop: stopSpeechMock,
    });

    act(() => {
      screen.getByRole("button", { name: /Start Recording/i }).click();
    });

    await waitFor(() => {
      expect(startSpeechMock).toHaveBeenCalled();
    });

    await act(async () => {
      vi.advanceTimersByTime(4000);
    });

    // In feedback phase
    await waitFor(() => {
      expect(screen.getByText("Comparison:")).toBeTruthy();
    });

    // The play button in feedback phase should show "Play Audio" when currentTime === 0
    const playButton = screen.getByRole("button", { name: /Play Audio/i });
    expect(playButton).toBeTruthy();

    // Click play to replay audio from start
    act(() => {
      playButton.click();
    });

    // play should be called again (2nd time for replay)
    expect(playMock).toHaveBeenCalledTimes(2);

    // Feedback should still be visible
    await waitFor(() => {
      expect(screen.getByText("Comparison:")).toBeTruthy();
    });
  });

  it("allows replaying audio in review section after audio ends", async () => {
    renderPage();

    // Go through both sentences to reach review
    let onEnded: (() => void) | undefined;
    await waitFor(() => {
      onEnded = playMock.mock.calls[0][1];
    });
    act(() => {
      onEnded?.();
    });
    await waitFor(() => {
      expect(screen.getByText("Ready to record")).toBeTruthy();
    });

    vi.mocked(useSpeechRecognition).mockReturnValue({
      supported: true,
      recording: true,
      transcript: "",
      error: null,
      start: startSpeechMock,
      stop: stopSpeechMock,
    });

    act(() => {
      screen.getByRole("button", { name: /Start Recording/i }).click();
    });

    await waitFor(() => {
      expect(startSpeechMock).toHaveBeenCalled();
    });

    await act(async () => {
      vi.advanceTimersByTime(4000);
    });

    await waitFor(() => {
      expect(screen.getByText("Comparison:")).toBeTruthy();
    });

    act(() => {
      screen.getByRole("button", { name: /Next Question/i }).click();
    });

    await waitFor(() => {
      expect(playMock).toHaveBeenCalledTimes(2);
    });
    const onEnded2 = playMock.mock.calls[1][1];
    act(() => {
      onEnded2?.();
    });
    await waitFor(() => {
      expect(screen.getByText("Ready to record")).toBeTruthy();
    });

    act(() => {
      screen.getByRole("button", { name: /Start Recording/i }).click();
    });

    await waitFor(() => {
      expect(startSpeechMock).toHaveBeenCalledTimes(2);
    });

    await act(async () => {
      vi.advanceTimersByTime(4000);
    });

    // In review section
    await waitFor(() => {
      expect(screen.getByText("Section Complete")).toBeTruthy();
    });

    const playButtons = screen.getAllByRole("button", { name: /Play Audio/i });

    // Play audio for first sentence
    act(() => {
      playButtons[0].click();
    });

    // Audio ends - currentTime resets to 0
    vi.mocked(useTts).mockReturnValue({
      playing: false,
      loading: false,
      error: null,
      duration: 0,
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

    // After audio ends, should show Replay button for the active sentence
    await waitFor(() => {
      const replayButtons = screen.getAllByRole("button", {
        name: /Replay/i,
      });
      expect(replayButtons.length).toBeGreaterThanOrEqual(1);
    });

    // Clicking Replay should call play again
    const replayButtons = screen.getAllByRole("button", { name: /Replay/i });
    act(() => {
      replayButtons[0].click();
    });

    // play should be called again (4th time total: 2 auto-plays + 1 review play + 1 replay)
    expect(playMock).toHaveBeenCalledTimes(4);
  });
});

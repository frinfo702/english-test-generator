import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import type { ReactElement } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useQuestion } from "../hooks/useQuestion";
import { useTts } from "../hooks/useTts";
import { ListenResponsePage } from "./toefl/listening/ListenResponsePage";
import { LecturePage } from "./toefl/listening/ListeningTaskPage";
import { Part2Page } from "./toeic/Part2Page";
import { Part3Page } from "./toeic/Part3Page";

// Exam rule: question audio plays once while answering; review replays it
// as often as wanted, next to its script.

vi.mock("../hooks/useQuestion", () => ({ useQuestion: vi.fn() }));
vi.mock("../hooks/useTts", () => ({ useTts: vi.fn() }));
vi.mock("../hooks/useElapsedTimer", () => ({
  useElapsedTimer: () => ({
    display: "00:00",
    elapsedSeconds: 1,
    running: true,
    start: vi.fn(),
    stop: vi.fn(() => 1),
    reset: vi.fn(),
  }),
}));
vi.mock("../hooks/useScoreHistory", () => ({
  useScoreHistory: () => ({ saveScore: vi.fn() }),
}));
vi.mock("../components/question/NextQuestionButton", () => ({
  NextQuestionButton: () => null,
}));

const choice = {
  id: "q1",
  stem: "What is the talk mainly about?",
  options: ["Bees", "Ants", "Wasps", "Moths"],
  correctIndex: 0,
  type: "gist",
  explanation: "It is about bees.",
};

const DATA: Record<string, unknown> = {
  "toeic/part3": {
    title: "Office move",
    audioSegments: [
      { role: "Woman", text: "Are the boxes packed yet?" },
      { role: "Man", text: "Almost, just the printer left." },
      { role: "Narrator", text: "What is the man doing?" },
    ],
    transcript: "",
    questions: [choice],
  },
  "toefl/listening/lecture": {
    title: "Bees",
    subject: "biology",
    audioSegments: [
      { role: "Professor", text: "Today we look at how bees dance." },
      { role: "Professor", text: "The dance points to food." },
    ],
    transcript: "",
    questions: [choice],
  },
  "toefl/listening/response": {
    title: "Responses",
    audioSegments: [
      { role: "Student", text: "Aren't you taking the writing class?" },
    ],
    questions: [
      {
        id: "r1",
        context: "Two students talk.",
        stem: "Aren't you taking the writing class?",
        options: { A: "Yes, on Mondays.", B: "A pencil.", C: "Tomorrow." },
        correct: "A",
        explanation: "A answers the question.",
      },
    ],
  },
  "toeic/part2": {
    title: "Part 2",
    audioSegments: [
      { role: "Woman", text: "Number 1. When is the report due?" },
      { role: "Man", text: "(A) Friday." },
      { role: "Man", text: "(B) Yes, I did." },
      { role: "Man", text: "(C) Upstairs." },
      { role: "Man", text: "Number 2. Who called?" },
      { role: "Woman", text: "(A) Your manager." },
      { role: "Woman", text: "(B) At noon." },
      { role: "Woman", text: "(C) By phone." },
    ],
    questions: [
      {
        id: "p1",
        stem: "When is the report due?",
        options: { A: "Friday.", B: "Yes, I did.", C: "Upstairs." },
        correct: "A",
        explanation: "When asks for a time.",
      },
      {
        id: "p2",
        stem: "Who called?",
        options: { A: "Your manager.", B: "At noon.", C: "By phone." },
        correct: "A",
        explanation: "Who asks for a person.",
      },
    ],
  },
};

let ttsError: string | null = null;
const tts = {
  playSegments: vi.fn(),
  playSegmentsWithGaps: vi.fn(),
  stop: vi.fn(),
};

function renderAt(path: string, page: ReactElement) {
  return render(
    <MemoryRouter initialEntries={[`/${path}/001`]}>
      <Routes>
        <Route path={`/${path}/:questionId`} element={page} />
      </Routes>
    </MemoryRouter>,
  );
}

function playButton(name: RegExp) {
  return screen.getByRole("button", { name }) as HTMLButtonElement;
}

beforeEach(() => {
  ttsError = null;
  vi.mocked(useQuestion).mockImplementation(
    (taskId: string) =>
      ({
        data: DATA[taskId],
        file: "001.json",
        loading: false,
        error: null,
        load: vi.fn(),
        loadByFile: vi.fn(),
        loadById: vi.fn(),
      }) as unknown as ReturnType<typeof useQuestion>,
  );
  vi.mocked(useTts).mockImplementation(() => ({
    playing: false,
    loading: false,
    error: ttsError,
    currentTime: 0,
    duration: 0,
    playbackRate: 1,
    setPlaybackRate: vi.fn(),
    play: vi.fn(),
    playSegments: tts.playSegments,
    playSegmentsWithGaps: tts.playSegmentsWithGaps,
    pause: vi.fn(),
    resume: vi.fn(),
    stop: tts.stop,
    seek: vi.fn(),
  }));
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("list layout (TOEIC Part 3)", () => {
  it("locks the player after one play, then replays with the transcript in review", () => {
    renderAt("toeic/part3", <Part3Page />);

    fireEvent.click(playButton(/^Play$/));
    expect(tts.playSegmentsWithGaps).toHaveBeenCalledTimes(1);
    expect(playButton(/Audio plays once/).disabled).toBe(true);
    expect(playButton(/Back 10s/).disabled).toBe(true);
    expect(screen.queryByText("Transcript")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /Submit Answers/ }));

    expect(screen.getByText("Transcript")).toBeTruthy();
    expect(screen.getByText("Are the boxes packed yet?")).toBeTruthy();
    fireEvent.click(playButton(/^Play$/));
    fireEvent.click(playButton(/^Play$/));
    expect(tts.playSegmentsWithGaps).toHaveBeenCalledTimes(3);
  });

  it("lets a failed playback be tried again", () => {
    const { rerender } = renderAt("toeic/part3", <Part3Page />);
    fireEvent.click(playButton(/^Play$/));

    ttsError = "Audio fetch failed (404)";
    rerender(
      <MemoryRouter initialEntries={["/toeic/part3/001"]}>
        <Routes>
          <Route path="/toeic/part3/:questionId" element={<Part3Page />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(playButton(/^Play$/).disabled).toBe(false);
  });
});

describe("talk layout (TOEFL lecture)", () => {
  it("plays the talk once, then replays it with the transcript in review", () => {
    renderAt("toefl/listening/lecture", <LecturePage />);

    fireEvent.click(playButton(/^Play$/));
    expect(tts.playSegments).toHaveBeenCalledTimes(1);
    expect(playButton(/Audio plays once/).disabled).toBe(true);

    // The talk ends and the questions open, with no player beside them.
    act(() => (tts.playSegments.mock.calls[0][1] as () => void)());
    expect(screen.queryByRole("button", { name: /Play|plays once/ })).toBe(
      null,
    );

    fireEvent.click(screen.getByRole("radio", { name: /Bees/ }));
    fireEvent.click(screen.getByRole("button", { name: /^Submit/ }));

    expect(screen.getByText("Today we look at how bees dance.")).toBeTruthy();
    fireEvent.click(playButton(/^Play$/));
    fireEvent.click(playButton(/^Play$/));
    expect(tts.playSegments).toHaveBeenCalledTimes(3);
  });
});

describe("TOEFL Listen and Choose a Response", () => {
  it("plays each utterance once, then replays it beside its script in review", () => {
    renderAt("toefl/listening/response", <ListenResponsePage />);

    expect(tts.playSegmentsWithGaps).toHaveBeenCalledTimes(1);
    expect(playButton(/Audio plays once/).disabled).toBe(true);
    expect(screen.queryByText(/Aren't you taking the writing class/)).toBe(
      null,
    );

    fireEvent.click(screen.getByRole("radio", { name: /Yes, on Mondays/ }));
    fireEvent.click(screen.getByRole("button", { name: /^Submit/ }));

    expect(
      screen.getByText(/Aren't you taking the writing class\?/),
    ).toBeTruthy();
    fireEvent.click(playButton(/^Play audio$/));
    fireEvent.click(playButton(/^Play audio$/));
    expect(tts.playSegmentsWithGaps).toHaveBeenCalledTimes(3);
  });

  it("unlocks the button when the utterance failed to play", () => {
    ttsError = "Audio fetch failed (404)";
    renderAt("toefl/listening/response", <ListenResponsePage />);

    fireEvent.click(playButton(/^Play audio$/));
    expect(tts.playSegmentsWithGaps).toHaveBeenCalledTimes(2);
  });

  describe("with two utterances", () => {
    const response = DATA["toefl/listening/response"] as {
      questions: object[];
    };
    const page = () => (
      <MemoryRouter initialEntries={["/toefl/listening/response/001"]}>
        <Routes>
          <Route
            path="/toefl/listening/response/:questionId"
            element={<ListenResponsePage />}
          />
        </Routes>
      </MemoryRouter>
    );

    beforeEach(() => {
      DATA["toefl/listening/response"] = {
        ...response,
        questions: [
          ...response.questions,
          {
            id: "r2",
            context: "Two students talk.",
            stem: "Where is the library?",
            options: { A: "Next to the gym.", B: "At noon.", C: "Yes." },
            correct: "A",
            explanation: "A gives a place.",
          },
        ],
      };
    });

    afterEach(() => {
      DATA["toefl/listening/response"] = response;
    });

    it("keeps a heard utterance locked when another one failed to play", () => {
      const { rerender } = render(page());
      fireEvent.click(screen.getByRole("button", { name: "Next question" }));
      expect(tts.playSegmentsWithGaps).toHaveBeenCalledTimes(2);

      ttsError = "Audio fetch failed (404)";
      rerender(page());
      expect(playButton(/^Play audio$/).disabled).toBe(false);

      fireEvent.click(
        screen.getByRole("button", { name: "Previous question" }),
      );
      expect(playButton(/Audio plays once/).disabled).toBe(true);
    });

    it("keeps the retry for a failed utterance after another one played", () => {
      ttsError = "Audio fetch failed (404)";
      const { rerender } = render(page());
      fireEvent.click(screen.getByRole("button", { name: "Next question" }));
      expect(tts.playSegmentsWithGaps).toHaveBeenCalledTimes(2);

      ttsError = null;
      rerender(page());
      expect(playButton(/Audio plays once/).disabled).toBe(true);

      fireEvent.click(
        screen.getByRole("button", { name: "Previous question" }),
      );
      fireEvent.click(playButton(/^Play audio$/));
      expect(tts.playSegmentsWithGaps).toHaveBeenCalledTimes(3);
      expect(playButton(/Audio plays once/).disabled).toBe(true);
    });
  });
});

describe("TOEIC Part 2", () => {
  it("plays each question once and offers per-question replay in review", () => {
    renderAt("toeic/part2", <Part2Page />);
    expect(tts.playSegmentsWithGaps).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("button", { name: /Replay audio/ })).toBe(null);

    fireEvent.click(screen.getByRole("button", { name: /^Next$/ }));
    fireEvent.click(screen.getByRole("button", { name: /^Previous$/ }));
    fireEvent.click(screen.getByRole("button", { name: /^Next$/ }));
    // Revisiting a question does not play it again.
    expect(tts.playSegmentsWithGaps).toHaveBeenCalledTimes(2);

    fireEvent.click(screen.getByRole("button", { name: /^Submit/ }));

    expect(screen.getByText("Who called?")).toBeTruthy();
    expect(screen.getByText("Your manager.")).toBeTruthy();
    const replays = screen.getAllByRole("button", { name: /Replay audio/ });
    expect(replays).toHaveLength(2);
    fireEvent.click(replays[1]);
    expect(tts.playSegmentsWithGaps).toHaveBeenLastCalledWith(
      [5, 6, 7, 8].map((n) => `/audio/toeic/part2/001/${n}.mp3`),
      [3, 3, 3],
    );
  });
});

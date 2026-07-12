export interface InterviewQuestion {
  id: string;
  type: string;
  question: string;
  modelAnswer: string;
  evaluationPoints: string[];
}

export interface InterviewProblemData {
  /** Research-study intro spoken before Q1 (audio-only; text is collapsible). */
  scenario: string;
  questions: InterviewQuestion[];
}

export type InterviewPhase =
  | "pre"
  | "listening"
  | "answering"
  | "processing"
  | "submitted";

/** Which clip is playing during the listening phase. */
export type InterviewListeningTrack = "scenario" | "question";

export const INTERVIEW_TASK_ID = "toefl/speaking/interview";

/** Real-test progression: opening → personal → opinion → closing. */
export const INTERVIEW_TYPE_LABELS: Record<string, string> = {
  opening: "Opening",
  personal: "Personal",
  opinion: "Opinion",
  closing: "Closing",
  // Legacy labels kept so older JSON still displays cleanly
  hypothetical: "Hypothetical Situation",
  comparison: "Comparison / Choice",
};

export const INTERVIEW_QUESTION_TYPES = [
  "opening",
  "personal",
  "opinion",
  "closing",
] as const;

export type InterviewQuestionType = (typeof INTERVIEW_QUESTION_TYPES)[number];

export function interviewAudioUrl(
  fileBasename: string,
  questionIndex: number,
  kind: "question" | "model",
): string;
export function interviewAudioUrl(
  fileBasename: string,
  questionIndex: null,
  kind: "scenario",
): string;
export function interviewAudioUrl(
  fileBasename: string,
  questionIndex: number | null,
  kind: "question" | "model" | "scenario",
): string {
  if (kind === "scenario") {
    return `/audio/${INTERVIEW_TASK_ID}/${fileBasename}/scenario.mp3`;
  }
  const n = (questionIndex as number) + 1;
  const suffix = kind === "model" ? "-model" : "";
  return `/audio/${INTERVIEW_TASK_ID}/${fileBasename}/${n}${suffix}.mp3`;
}

export function phasePrompt(
  phase: InterviewPhase,
  listeningTrack: InterviewListeningTrack | null = null,
): string {
  switch (phase) {
    case "listening":
      return listeningTrack === "scenario"
        ? "Listening to the scenario…"
        : "Listening to the question…";
    case "answering":
      return "Speak your answer now.";
    case "processing":
      return "Transcribing your answer…";
    case "pre":
    case "submitted":
      return "Audio only — text stays hidden like the real test.";
    default: {
      const _exhaustive: never = phase;
      return _exhaustive;
    }
  }
}

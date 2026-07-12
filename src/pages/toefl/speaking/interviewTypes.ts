export interface InterviewQuestion {
  id: string;
  type: string;
  question: string;
  modelAnswer: string;
  evaluationPoints: string[];
}

export interface InterviewProblemData {
  /** Intro shown before the interview (research-study framing). */
  scenario: string;
  questions: InterviewQuestion[];
}

export type InterviewPhase =
  | "pre"
  | "listening"
  | "answering"
  | "processing"
  | "submitted";

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
): string {
  const n = questionIndex + 1;
  const suffix = kind === "model" ? "-model" : "";
  return `/audio/${INTERVIEW_TASK_ID}/${fileBasename}/${n}${suffix}.mp3`;
}

export function phasePrompt(phase: InterviewPhase): string {
  switch (phase) {
    case "listening":
      return "Listening to the question…";
    case "answering":
      return "Speak your answer now.";
    case "processing":
      return "Transcribing your answer…";
    case "pre":
    case "submitted":
      return "The question will be spoken aloud. Text is not shown during the test.";
    default: {
      const _exhaustive: never = phase;
      return _exhaustive;
    }
  }
}

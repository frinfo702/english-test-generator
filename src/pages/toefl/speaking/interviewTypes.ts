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

/**
 * Interview UI step machine.
 * `scenario` is a first-class step (no auto-advance to the question).
 */
export type InterviewPhase =
  | "pre"
  | "scenario"
  | "listening"
  | "answering"
  | "processing"
  | "submitted";

export const INTERVIEW_TASK_ID = "toefl/speaking/interview";

/** Real-test progression: opening → personal → opinion → closing. */
export const INTERVIEW_QUESTION_TYPES = [
  "opening",
  "personal",
  "opinion",
  "closing",
] as const;

export type InterviewQuestionType = (typeof INTERVIEW_QUESTION_TYPES)[number];

export const INTERVIEW_TYPE_LABELS: Record<string, string> = {
  opening: "Opening",
  personal: "Personal",
  opinion: "Opinion",
  closing: "Closing",
  // Legacy labels kept so older JSON still displays cleanly
  hypothetical: "Hypothetical Situation",
  comparison: "Comparison / Choice",
};

export function interviewScenarioAudioUrl(fileBasename: string): string {
  return `/audio/${INTERVIEW_TASK_ID}/${fileBasename}/scenario.mp3`;
}

export function interviewAudioUrl(
  fileBasename: string,
  questionIndex: number,
  kind: "question" | "model",
): string {
  const n = questionIndex + 1;
  const suffix = kind === "model" ? "-model" : "";
  return `/audio/${INTERVIEW_TASK_ID}/${fileBasename}/${n}${suffix}.mp3`;
}

/** True on Q1 while the user is still in the research-study scenario step. */
export function isScenarioStep(
  phase: InterviewPhase,
  questionIndex: number,
  hasScenario: boolean,
): boolean {
  return (
    hasScenario &&
    questionIndex === 0 &&
    (phase === "pre" || phase === "scenario")
  );
}

export function interviewChrome(
  phase: InterviewPhase,
  questionIndex: number,
  questionCount: number,
  questionType: string,
  hasScenario: boolean,
): { tag: string; position: string } {
  if (isScenarioStep(phase, questionIndex, hasScenario)) {
    return { tag: "Scenario", position: "Scenario" };
  }
  return {
    tag: INTERVIEW_TYPE_LABELS[questionType] ?? questionType,
    position: `Question ${questionIndex + 1} / ${questionCount}`,
  };
}

export function phasePrompt(phase: InterviewPhase): string {
  switch (phase) {
    case "scenario":
      return "Listening to the scenario…";
    case "listening":
      return "Listening to the question…";
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

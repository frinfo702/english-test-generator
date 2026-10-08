import { AI_SCORE_FENCE } from "./interviewScoring";

const DRAFT_KEY_PREFIX = "answer-draft:";

export function buildProblemId(
  taskId: string,
  sourceFile: string,
  subQuestionId?: string,
) {
  const fileId = sourceFile.replace(/\.json$/i, "");
  if (subQuestionId) {
    return `${taskId}/${fileId}#${subQuestionId}`;
  }
  return `${taskId}/${fileId}`;
}

export function buildDraftKey(problemId: string) {
  return `${DRAFT_KEY_PREFIX}${problemId}`;
}

export function loadDraft(problemId: string) {
  const value = localStorage.getItem(buildDraftKey(problemId));
  return value ?? "";
}

export function saveDraft(problemId: string, text: string) {
  const key = buildDraftKey(problemId);
  if (text.trim().length === 0) {
    localStorage.removeItem(key);
    return;
  }
  localStorage.setItem(key, text);
}

export function clearDraft(problemId: string) {
  localStorage.removeItem(buildDraftKey(problemId));
}

export function buildGradingMessage(problemId: string, answerId: string) {
  return `I completed problem ${problemId}. My answer ID is ${answerId}. Please grade it.`;
}

export interface InterviewCopyPayload {
  question: string;
  userAnswer: string;
  modelAnswer?: string;
  evaluationPoints?: string[];
  questionType?: string;
}

/**
 * Clipboard text for an external LLM. It asks for a fixed score block so the
 * pasted reply can be parsed and combined with the Azure delivery scores.
 */
export function buildInterviewQaCopyMessage(payload: InterviewCopyPayload) {
  const lines: string[] = [
    "Please evaluate my TOEFL Speaking (Take an Interview) response and give constructive feedback.",
    "",
    "## Question",
    payload.question.trim(),
  ];

  if (payload.questionType) {
    lines.push("", `Type: ${payload.questionType}`);
  }

  lines.push(
    "",
    "## My spoken answer (automatic transcript)",
    payload.userAnswer.trim() || "(no speech detected)",
  );

  if (payload.modelAnswer?.trim()) {
    lines.push("", "## Sample answer", payload.modelAnswer.trim());
  }

  if (payload.evaluationPoints && payload.evaluationPoints.length > 0) {
    lines.push("", "## Evaluation criteria");
    for (const point of payload.evaluationPoints) {
      lines.push(`- ${point}`);
    }
  }

  lines.push(
    "",
    "## How to score",
    "My pronunciation and fluency are scored separately from the audio, so judge only what the transcript shows. It comes from speech recognition: ignore punctuation and capitalization, and don't penalize obvious recognition errors.",
    "Use the official TOEFL Take an Interview scale (0–5) for each:",
    "- languageUse: range and accuracy of grammar and vocabulary.",
    "- organization: relevance to the question, elaboration with reasons/examples, and connectors. Give 0 if the answer is unconnected to the question.",
    "",
    "Give your feedback and a stronger version of my answer, then end your reply with this block exactly once (half points such as 3.5 are allowed):",
    "",
    "```" + AI_SCORE_FENCE,
    '{"languageUse": 0, "organization": 0}',
    "```",
  );

  return lines.join("\n");
}

export interface WritingCopyPayload {
  task: "Write an Email" | "Write for an Academic Discussion";
  prompt: string;
  userAnswer: string;
  modelAnswer?: string;
  criteria?: string[];
}

/** Same contract as the interview prompt: feedback, then one parseable score block. */
export function buildWritingCopyMessage(payload: WritingCopyPayload) {
  const lines: string[] = [
    `Please evaluate my TOEFL Writing (${payload.task}) response and give constructive feedback.`,
    "",
    "## Task",
    payload.prompt.trim(),
    "",
    "## My response",
    payload.userAnswer.trim() || "(no response)",
  ];
  if (payload.modelAnswer?.trim()) {
    lines.push("", "## Sample response", payload.modelAnswer.trim());
  }
  if (payload.criteria && payload.criteria.length > 0) {
    lines.push("", "## Evaluation criteria");
    for (const c of payload.criteria) lines.push(`- ${c}`);
  }
  lines.push(
    "",
    "## How to score",
    `Use the official TOEFL ${payload.task} scale (0–5), judging task completion, elaboration, organization, and range and accuracy of grammar and vocabulary.`,
    "",
    "Give your feedback and a stronger version of my response, then end your reply with this block exactly once (whole numbers only):",
    "",
    "```" + AI_SCORE_FENCE,
    '{"score": 0}',
    "```",
  );
  return lines.join("\n");
}

export async function copyText(text: string) {
  if (typeof navigator.clipboard?.writeText !== "function") {
    return false;
  }
  await navigator.clipboard.writeText(text);
  return true;
}

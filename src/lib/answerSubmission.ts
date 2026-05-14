export interface SaveAnswerPayload {
  taskId: string;
  problemId: string;
  response: string;
  question?: unknown;
}

interface SaveAnswerResponse {
  answerId: string;
}

export interface AnswerEntry {
  answerId: string;
  taskId: string;
  problemId: string;
  response: string;
  date: string;
}

const DRAFT_KEY_PREFIX = "answer-draft:";
const ANSWERS_STORAGE_KEY = "answer-history";

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

function readAnswerHistory(): AnswerEntry[] {
  try {
    const raw = localStorage.getItem(ANSWERS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AnswerEntry[]) : [];
  } catch {
    return [];
  }
}

function writeAnswerHistory(entries: AnswerEntry[]) {
  localStorage.setItem(ANSWERS_STORAGE_KEY, JSON.stringify(entries));
}

export async function saveAnswerSubmission(payload: SaveAnswerPayload) {
  const entries = readAnswerHistory();
  const answerId = `ans-${Date.now()}`;
  const entry: AnswerEntry = {
    answerId,
    taskId: payload.taskId,
    problemId: payload.problemId,
    response: payload.response,
    date: new Date().toISOString(),
  };
  entries.push(entry);
  writeAnswerHistory(entries);
  return { answerId } as SaveAnswerResponse;
}

export function getAllAnswers(): AnswerEntry[] {
  return readAnswerHistory().slice().reverse();
}

export function buildGradingMessage(problemId: string, answerId: string) {
  return `I completed problem ${problemId}. My answer ID is ${answerId}. Please grade it.`;
}

export async function copyText(text: string) {
  if (typeof navigator.clipboard?.writeText !== "function") {
    return false;
  }
  await navigator.clipboard.writeText(text);
  return true;
}

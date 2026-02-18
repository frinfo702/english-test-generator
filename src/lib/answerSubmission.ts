export interface SaveAnswerPayload {
  taskId: string;
  problemId: string;
  response: string;
  question?: unknown;
}

interface SaveAnswerResponse {
  answerId: string;
}

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

export async function saveAnswerSubmission(payload: SaveAnswerPayload) {
  const res = await fetch("/api/answers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.text();
    let message = body;
    try {
      const parsed = JSON.parse(body) as { error?: string };
      message = parsed.error ?? body;
    } catch {}
    throw new Error(message || "Failed to save the answer.");
  }
  return (await res.json()) as SaveAnswerResponse;
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

/**
 * Scores finished Writing/Speaking answers in the background with the user's
 * AI Gateway key. Jobs live in this module, not in a page, so a score started
 * on one question keeps running while the user moves on, and lands on the
 * stored attempt whichever page is showing.
 */
import { autoScoring, scoreWithGateway } from "./aiGateway";
import { getAttempt, putAttempts, type Attempt } from "./attempts";
import {
  parseAiScores,
  parseWritingScore,
  withInterviewAi,
  withWritingAi,
} from "./interviewScoring";

export type ScoringJob =
  { status: "scoring" } | { status: "error"; message: string };

export interface ScoringTask {
  attemptId: string;
  /** Response index in the attempt; always 0 for Writing. */
  index: number;
  kind: "writing" | "interview";
  /** The same prompt the copy & paste panel puts on the clipboard. */
  message: string;
}

const keyOf = (attemptId: string, index: number) => `${attemptId}#${index}`;

let jobs: ReadonlyMap<string, ScoringJob> = new Map();
const tasks = new Map<string, ScoringTask>();
const jobListeners = new Set<() => void>();
const attemptListeners = new Set<(attempt: Attempt) => void>();
const locks = new Map<string, Promise<unknown>>();

function setJob(key: string, job: ScoringJob | null) {
  const next = new Map(jobs);
  if (job) next.set(key, job);
  else next.delete(key);
  jobs = next;
  jobListeners.forEach((l) => l());
}

export const getJobs = () => jobs;

export function subscribeJobs(listener: () => void) {
  jobListeners.add(listener);
  return () => void jobListeners.delete(listener);
}

/** Told about every attempt this module writes, so open pages can refresh. */
export function subscribeAttempts(listener: (attempt: Attempt) => void) {
  attemptListeners.add(listener);
  return () => void attemptListeners.delete(listener);
}

/**
 * Read-modify-write of one stored attempt, queued per attempt: a background
 * score and the page still saving the next answer never drop each other's
 * fields.
 */
export function updateAttempt(
  id: string,
  update: (stored: Attempt | undefined) => Attempt | undefined,
): Promise<Attempt | undefined> {
  const run = (locks.get(id) ?? Promise.resolve())
    .catch(() => undefined)
    .then(async () => {
      const next = update(await getAttempt(id));
      if (next) {
        await putAttempts([next]);
        attemptListeners.forEach((l) => l(next));
      }
      return next;
    });
  locks.set(id, run);
  void run.finally(() => locks.get(id) === run && locks.delete(id));
  return run;
}

/**
 * Starts scoring one finished answer if the user auto-scores with a key.
 * Returns false (and does nothing) in copy & paste mode.
 */
export function scoreInBackground(task: ScoringTask): boolean {
  const config = autoScoring();
  if (!config) return false;
  const key = keyOf(task.attemptId, task.index);
  if (jobs.get(key)?.status === "scoring") return true;
  tasks.set(key, task);
  setJob(key, { status: "scoring" });
  void (async () => {
    try {
      const reply = await scoreWithGateway(task.message, config);
      let apply: (a: Attempt) => Attempt;
      try {
        apply =
          task.kind === "writing"
            ? (() => {
                const scores = parseWritingScore(reply);
                return (a) => withWritingAi(a, { reply, scores });
              })()
            : (() => {
                const scores = parseAiScores(reply);
                return (a) => withInterviewAi(a, task.index, { reply, scores });
              })();
      } catch {
        throw new Error(
          "The model replied without a score. Try again, or pick another model in Settings.",
        );
      }
      await updateAttempt(task.attemptId, (a) => a && apply(a));
      tasks.delete(key);
      setJob(key, null);
    } catch (e) {
      setJob(key, {
        status: "error",
        message: e instanceof Error ? e.message : String(e),
      });
    }
  })();
  return true;
}

export function retryScoring(attemptId: string, index: number) {
  const task = tasks.get(keyOf(attemptId, index));
  if (task) scoreInBackground(task);
}

export function jobFor(
  all: ReadonlyMap<string, ScoringJob>,
  attemptId: string,
  index: number,
): ScoringJob | undefined {
  return all.get(keyOf(attemptId, index));
}

export function isScoring(
  all: ReadonlyMap<string, ScoringJob>,
  attemptId: string,
): boolean {
  return [...all].some(
    ([k, j]) => k.startsWith(`${attemptId}#`) && j.status === "scoring",
  );
}

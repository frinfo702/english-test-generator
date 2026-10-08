import type { TaskId } from "../hooks/useScoreHistory";
import type { Attempt } from "./attempts";
import { fetchQuestionByIdWithMeta, listQuestionFiles } from "./questions";

export type SectionKey = "reading" | "listening" | "writing" | "speaking";
export type TrialMode = "full" | SectionKey;

export const TRIAL_TASK_ID = "toefl/trial";

export type Route = "easy" | "hard";

export interface TrialSection {
  key: SectionKey;
  label: string;
  minutes: number;
  /** Two modules; `tasks` counts are then per module. */
  adaptive?: boolean;
  tasks: { taskId: TaskId; count: number }[];
}

/** Section order and timing follow the January 2026 TOEFL iBT. */
export const TRIAL_SECTIONS: TrialSection[] = [
  {
    key: "reading",
    label: "Reading",
    minutes: 30,
    adaptive: true,
    tasks: [
      { taskId: "toefl/reading/complete-words", count: 1 },
      { taskId: "toefl/reading/daily-life", count: 2 },
      { taskId: "toefl/reading/academic", count: 1 },
    ],
  },
  {
    key: "listening",
    label: "Listening",
    minutes: 29,
    adaptive: true,
    tasks: [
      { taskId: "toefl/listening/response", count: 4 },
      { taskId: "toefl/listening/conversation", count: 1 },
      { taskId: "toefl/listening/announcement", count: 1 },
      { taskId: "toefl/listening/lecture", count: 1 },
    ],
  },
  {
    key: "writing",
    label: "Writing",
    minutes: 23,
    tasks: [
      { taskId: "toefl/writing/build-sentence", count: 10 },
      { taskId: "toefl/writing/email", count: 1 },
      { taskId: "toefl/writing/discussion", count: 1 },
    ],
  },
  {
    key: "speaking",
    label: "Speaking",
    minutes: 8,
    tasks: [
      { taskId: "toefl/speaking/listen-repeat", count: 1 },
      { taskId: "toefl/speaking/interview", count: 1 },
    ],
  },
];

export const TASK_SECTION = Object.fromEntries(
  TRIAL_SECTIONS.flatMap((s) => s.tasks.map((t) => [t.taskId, s.key])),
) as Partial<Record<TaskId, SectionKey>>;

export function sectionsFor(mode: TrialMode): TrialSection[] {
  return mode === "full"
    ? TRIAL_SECTIONS
    : TRIAL_SECTIONS.filter((s) => s.key === mode);
}

export function modeMinutes(mode: TrialMode): number {
  return sectionsFor(mode).reduce((sum, s) => sum + s.minutes, 0);
}

export interface TrialItem {
  section: SectionKey;
  taskId: TaskId;
  problemId: string;
  /** Fixed at planning so an item left unanswered still counts against the section. */
  maxPoints: number;
  module?: 1 | 2;
  /** Handed in; attemptId stays unset when the save failed or the clock ran out first. */
  done?: boolean;
  attemptId?: string;
}

export interface TrialRecord {
  mode: TrialMode;
  items: TrialItem[];
  /** Wall-clock start per section: the countdown keeps running across a reload. */
  sectionStarts: Partial<Record<SectionKey, string>>;
  /** Which Module 2 each adaptive section routed to. */
  routes?: Partial<Record<SectionKey, Route>>;
  finishedAt?: string;
}

export type TrialAttempt = Attempt & { trial: TrialRecord };

export function trialTitle(trial: TrialAttempt, all: TrialAttempt[]): string {
  return `TOEFL Test ${all.filter((t) => t.date <= trial.date).length}`;
}

export const formatBand = (band: number | null) =>
  band === null ? "—" : band.toFixed(1).replace(/\.0$/, "");

export function formatMinutes(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m} minutes`;
  return `${h} hour${h > 1 ? "s" : ""}${m ? ` and ${m} minutes` : ""}`;
}

export const isTrial = (a: Attempt): a is TrialAttempt =>
  a.taskId === TRIAL_TASK_ID && a.trial !== undefined;

/**
 * Unsolved problems first, then the ones seen longest ago; random among
 * equals so two trials started the same day don't repeat each other.
 */
export function pickProblems(
  ids: string[],
  history: Attempt[],
  count: number,
  random: () => number = Math.random,
): string[] {
  const last = new Map<string, string>();
  for (const a of history) {
    if (!a.problemId) continue;
    const prev = last.get(a.problemId);
    if (!prev || a.date > prev) last.set(a.problemId, a.date);
  }
  return ids
    .map((id) => ({ id, last: last.get(id) ?? "", r: random() }))
    .sort((a, b) =>
      a.last !== b.last ? (a.last < b.last ? -1 : 1) : a.r - b.r,
    )
    .slice(0, count)
    .map((p) => p.id);
}

interface QuestionShape {
  items?: unknown[];
  sentences?: unknown[];
  questions?: unknown[];
  texts?: { questions: unknown[] }[];
}

/** Raw points: one per objective item, 0–5 per rubric-scored response. */
export function maxPoints(taskId: TaskId, q: QuestionShape): number {
  switch (taskId) {
    case "toefl/writing/email":
    case "toefl/writing/discussion":
      return 5;
    case "toefl/speaking/listen-repeat":
      return (q.sentences?.length ?? 0) * 5;
    case "toefl/speaking/interview":
      return (q.questions?.length ?? 0) * 5;
    case "toefl/reading/daily-life":
      return (q.texts ?? []).reduce((n, t) => n + t.questions.length, 0);
    default:
      return (q.items ?? q.sentences ?? q.questions ?? []).length;
  }
}

function syllables(word: string): number {
  const groups = word.toLowerCase().replace(/e$/, "").match(/[aeiouy]+/g);
  return Math.max(1, groups?.length ?? 0);
}

/**
 * Flesch–Kincaid grade of every prose string in a question file. The files
 * carry no difficulty tag, so text difficulty stands in for item difficulty.
 */
export function readingGrade(question: unknown): number {
  const prose: string[] = [];
  const walk = (v: unknown) => {
    if (typeof v === "string") {
      if (v.includes(" ")) prose.push(v);
    } else if (v && typeof v === "object") {
      Object.values(v).forEach(walk);
    }
  };
  walk(question);
  const text = prose.join(" ");
  const words = text.match(/[A-Za-z']+/g) ?? [];
  if (words.length === 0) return 0;
  const sentences = Math.max(1, (text.match(/[.!?]+(\s|$)/g) ?? []).length);
  const syl = words.reduce((n, w) => n + syllables(w), 0);
  return 0.39 * (words.length / sentences) + 11.8 * (syl / words.length) - 15.59;
}

/** The easier or harder half of a pool, never smaller than what is needed. */
export function difficultyTier(
  pool: { id: string; grade: number }[],
  route: Route,
  count: number,
): string[] {
  const sorted = [...pool].sort((a, b) => a.grade - b.grade);
  const size = Math.min(sorted.length, Math.max(count, Math.ceil(sorted.length / 2)));
  const tier = route === "easy" ? sorted.slice(0, size) : sorted.slice(-size);
  return tier.map((p) => p.id);
}

/** Module 1 accuracy that earns the harder Module 2. */
export const HARD_ROUTE_THRESHOLD = 0.7;

export const routeFor = (fraction: number): Route =>
  fraction >= HARD_ROUTE_THRESHOLD ? "hard" : "easy";

export async function planSection(
  section: TrialSection,
  history: Attempt[],
  module?: 1 | 2,
  route?: Route,
  /** `taskId/problemId` already in this test. */
  exclude: Set<string> = new Set(),
): Promise<TrialItem[]> {
  const tasks = await Promise.all(
    section.tasks.map(async ({ taskId, count }) => {
      const load = async (id: string) =>
        (await fetchQuestionByIdWithMeta<QuestionShape>(taskId, id)).data;
      const data = new Map<string, QuestionShape>();
      let pool = (await listQuestionFiles(taskId))
        .map((f) => f.id)
        .filter((id) => !exclude.has(`${taskId}/${id}`));
      if (route) {
        await Promise.all(pool.map(async (id) => data.set(id, await load(id))));
        pool = difficultyTier(
          pool.map((id) => ({ id, grade: readingGrade(data.get(id)) })),
          route,
          count,
        );
      }
      const ids = pickProblems(
        pool,
        history.filter((a) => a.taskId === taskId),
        count,
      );
      return Promise.all(
        ids.map(async (problemId) => ({
          section: section.key,
          taskId,
          problemId,
          module,
          maxPoints: maxPoints(
            taskId,
            data.get(problemId) ?? (await load(problemId)),
          ),
        })),
      );
    }),
  );
  return tasks.flat();
}

/** Adaptive sections start with Module 1; Module 2 is planned once it is done. */
export async function buildTrialPlan(
  mode: TrialMode,
  history: Attempt[],
): Promise<TrialItem[]> {
  const sections = await Promise.all(
    sectionsFor(mode).map((s) =>
      planSection(s, history, s.adaptive ? 1 : undefined),
    ),
  );
  return sections.flat();
}

const AI_SCORED: TaskId[] = [
  "toefl/writing/email",
  "toefl/writing/discussion",
  "toefl/speaking/interview",
];

/** Indexes of responses still waiting for a pasted AI score. */
export function pendingAiResponses(attempt: Attempt | undefined): number[] {
  if (!attempt || !AI_SCORED.includes(attempt.taskId)) return [];
  return attempt.responses.flatMap((r, i) =>
    r.itemScore === undefined && (r.text ?? r.transcript)?.trim() ? [i] : [],
  );
}

/**
 * Bands each route can reach, as on the real test: the easier Module 2
 * caps the score, the harder one is needed for the top bands.
 */
const BAND_RANGE: Record<Route | "fixed", [number, number]> = {
  fixed: [1, 6],
  easy: [1, 4],
  hard: [2.5, 6],
};

/** 1–6 in half bands, like the 2026 score report. */
export function toBand(fraction: number, route?: Route): number {
  const clamped = Math.min(1, Math.max(0, fraction));
  const [lo, hi] = BAND_RANGE[route ?? "fixed"];
  return Math.round((lo + (hi - lo) * clamped) * 2) / 2;
}

/** ETS: the overall band is the section mean rounded to the nearest half. */
export function overallBand(bands: (number | null)[]): number | null {
  if (bands.length === 0 || bands.some((b) => b === null)) return null;
  const mean = (bands as number[]).reduce((a, b) => a + b, 0) / bands.length;
  return Math.round(mean * 2) / 2;
}

export interface SectionResult {
  key: SectionKey;
  label: string;
  points: number;
  max: number;
  /** null while an AI-scored response is still unscored. */
  band: number | null;
}

export interface TrialResult {
  sections: SectionResult[];
  overall: number | null;
}

export function scoreTrial(
  record: TrialRecord,
  attempts: Map<string, Attempt>,
): TrialResult {
  const sections = sectionsFor(record.mode).map((s) => {
    const items = record.items.filter((i) => i.section === s.key);
    const linked = items.map((i) =>
      i.attemptId ? attempts.get(i.attemptId) : undefined,
    );
    const points = linked.reduce((n, a) => n + (a?.score?.correct ?? 0), 0);
    const max = items.reduce((n, i) => n + i.maxPoints, 0);
    const pending = linked.some((a) => pendingAiResponses(a).length > 0);
    return {
      key: s.key,
      label: s.label,
      points,
      max,
      // Timing out in Module 1 never earned the harder module.
      band:
        pending || max === 0
          ? null
          : toBand(
              points / max,
              s.adaptive ? (record.routes?.[s.key] ?? "easy") : undefined,
            ),
    };
  });
  return { sections, overall: overallBand(sections.map((s) => s.band)) };
}

export interface BandObservation {
  date: string;
  band: number;
  source: "trial" | "practice";
}

/**
 * Every finished trial contributes its section bands; every scored practice
 * attempt outside a trial contributes the band its accuracy maps to.
 */
export function collectObservations(
  attempts: Attempt[],
): Record<SectionKey, BandObservation[]> {
  const byId = new Map(attempts.map((a) => [a.id, a]));
  const trials = attempts.filter(isTrial);
  const inTrial = new Set(
    trials.flatMap((t) => t.trial.items.map((i) => i.attemptId)),
  );
  const out: Record<SectionKey, BandObservation[]> = {
    reading: [],
    listening: [],
    writing: [],
    speaking: [],
  };
  for (const t of trials) {
    if (!t.trial.finishedAt) continue;
    for (const s of scoreTrial(t.trial, byId).sections) {
      if (s.band !== null)
        out[s.key].push({ date: t.date, band: s.band, source: "trial" });
    }
  }
  for (const a of attempts) {
    const section = TASK_SECTION[a.taskId];
    if (!section || !a.score || inTrial.has(a.id)) continue;
    out[section].push({
      date: a.date,
      band: toBand(a.score.correct / a.score.total),
      source: "practice",
    });
  }
  return out;
}

const HALF_LIFE_DAYS = 30;

/**
 * Practice tests anchor the estimate. Task practice only adjusts it: one
 * practice item maps to an all-or-nothing band, so averaging the two as
 * equals would let dozens of tiny attempts drown out a timed test.
 */
const TRIAL_WEIGHT = 0.75;

/**
 * Estimated real-test band for one section from everything observed so far.
 * Returns null when there is nothing to go on.
 */
export function estimateBand(
  observations: BandObservation[],
  now: Date = new Date(),
): number | null {
  const mean = (source: BandObservation["source"]) => {
    let sum = 0;
    let weight = 0;
    for (const o of observations) {
      if (o.source !== source) continue;
      const days = (now.getTime() - Date.parse(o.date)) / 86_400_000;
      const w = 0.5 ** (Math.max(0, days) / HALF_LIFE_DAYS);
      sum += w * o.band;
      weight += w;
    }
    return weight > 0 ? sum / weight : null;
  };
  const trial = mean("trial");
  const practice = mean("practice");
  const blended =
    trial === null
      ? practice
      : practice === null
        ? trial
        : TRIAL_WEIGHT * trial + (1 - TRIAL_WEIGHT) * practice;
  return blended === null ? null : Math.round(blended * 2) / 2;
}

export interface Estimate {
  sections: Record<SectionKey, number | null>;
  overall: number | null;
}

export function estimateScore(attempts: Attempt[], now = new Date()): Estimate {
  const obs = collectObservations(attempts);
  const sections = {
    reading: estimateBand(obs.reading, now),
    listening: estimateBand(obs.listening, now),
    writing: estimateBand(obs.writing, now),
    speaking: estimateBand(obs.speaking, now),
  };
  return { sections, overall: overallBand(Object.values(sections)) };
}

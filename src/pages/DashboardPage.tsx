import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import { SectionHeader } from "../components/layout/SectionHeader";
import { Button } from "../components/ui/Button";
import { PixelHamster } from "../components/pixel/PixelHamster";
import { StreakCalendar } from "../components/ui/StreakCalendar";
import {
  useScoreHistory,
  type ScoreEntry,
  type TaskId,
} from "../hooks/useScoreHistory";
import { formatSecondsAsMmSs } from "../lib/time";
import { pickFocusTask } from "../lib/focusTask";
import { getAllAttempts, type Attempt } from "../lib/attempts";
import styles from "./DashboardPage.module.css";
import { PracticeTestsPanel } from "./trial/PracticeTestsPanel";
import { TRIAL_TASK_ID } from "../lib/trial";

/** Charts are a dashboard-only concern — keep recharts out of the practice pages. */
const ScoreTrendChart = lazy(() =>
  import("../components/ui/ScoreTrendChart").then((mod) => ({
    default: mod.ScoreTrendChart,
  })),
);

const TASK_LABELS: Record<TaskId, string> = {
  "toefl/reading/complete-words": "TOEFL Reading: Complete Words",
  "toefl/reading/daily-life": "TOEFL Reading: Daily Life",
  "toefl/reading/academic": "TOEFL Reading: Academic",
  "toefl/listening/conversation": "TOEFL Listening: Conversation",
  "toefl/listening/lecture": "TOEFL Listening: Lecture",
  "toefl/listening/response": "TOEFL Listening: Choose a Response",
  "toefl/listening/announcement": "TOEFL Listening: Announcement",
  "toefl/writing/build-sentence": "TOEFL Writing: Build Sentence",
  "toefl/writing/email": "TOEFL Writing: Email",
  "toefl/writing/discussion": "TOEFL Writing: Discussion",
  "toefl/speaking/listen-repeat": "TOEFL Speaking: Listen & Repeat",
  "toefl/speaking/interview": "TOEFL Speaking: Interview",
  "toefl/trial": "TOEFL Practice Test",
  "toeic/part2": "TOEIC Part 2: Question-Response",
  "toeic/part3": "TOEIC Part 3: Conversations",
  "toeic/part4": "TOEIC Part 4: Talks",
  "toeic/part5": "TOEIC Part 5",
  "toeic/part6": "TOEIC Part 6",
  "toeic/part7": "TOEIC Part 7",
  shadowing: "Shadowing",
  dictation: "Dictation",
  "instant-composition": "Instant Composition",
};

const TASK_HUES: Record<string, string> = {
  "toefl/reading/complete-words": "--color-reading",
  "toefl/reading/daily-life": "--color-reading",
  "toefl/reading/academic": "--color-reading",
  "toefl/listening/conversation": "--color-listening",
  "toefl/listening/lecture": "--color-listening",
  "toefl/listening/response": "--color-listening",
  "toefl/listening/announcement": "--color-listening",
  "toefl/writing/build-sentence": "--color-writing",
  "toefl/writing/email": "--color-writing",
  "toefl/writing/discussion": "--color-writing",
  "toefl/speaking/listen-repeat": "--color-speaking",
  "toefl/speaking/interview": "--color-speaking",
  "toeic/part2": "--color-toeic",
  "toeic/part3": "--color-toeic",
  "toeic/part4": "--color-toeic",
  "toeic/part5": "--color-toeic",
  "toeic/part6": "--color-toeic",
  "toeic/part7": "--color-toeic",
  shadowing: "--color-speaking",
  dictation: "--color-writing",
  "instant-composition": "--color-speaking",
};
/** "TOEFL Speaking: Interview · 001 · q1" instead of the raw storage path. */
function attemptLabel(a: Attempt, itemId?: string): string {
  return [TASK_LABELS[a.taskId] ?? a.taskId, a.problemId, itemId]
    .filter(Boolean)
    .join(" · ");
}

function shortDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

/** Hairline sparkline of the last runs; the full chart lives in the detail. */
function Sparkline({ entries, hue }: { entries: ScoreEntry[]; hue: string }) {
  const runs = entries.slice(-12);
  if (runs.length < 2) return <span className={styles.sparkEmpty} />;
  // Scaled to this task's own range: a 60→80% climb should read as a climb.
  const pcts = runs.map((e) => e.pct);
  const lo = Math.min(...pcts) - 5;
  const span = Math.max(...pcts) + 5 - lo;
  const points = pcts
    .map(
      (p, i) =>
        `${(i / (pcts.length - 1)) * 100},${100 - ((p - lo) / span) * 100}`,
    )
    .join(" ");
  return (
    <svg
      className={styles.spark}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <polyline points={points} style={{ stroke: `var(${hue})` }} />
    </svg>
  );
}

const average = (xs: number[]) =>
  xs.length > 0 ? Math.round(xs.reduce((s, x) => s + x, 0) / xs.length) : null;

interface TaskRowProps {
  taskId: TaskId;
  entries: ScoreEntry[];
  focus: boolean;
}

function TaskRow({ taskId, entries, focus }: TaskRowProps) {
  // The chart bundle only loads once a row is opened.
  const [open, setOpen] = useState(false);
  const hue = TASK_HUES[taskId] ?? "--color-accent";
  const latest = entries[entries.length - 1];
  const best = Math.max(...entries.map((e) => e.pct));
  const avg = average(entries.map((e) => e.pct));
  const avgSeconds = average(
    entries.flatMap((e) =>
      typeof e.elapsedSeconds === "number" ? [e.elapsedSeconds] : [],
    ),
  );
  // The group heading already names the test and section.
  const label = TASK_LABELS[taskId]
    .split(": ")
    .pop()!
    .replace(/^TOEIC /, "");

  return (
    <details
      className={styles.taskRow}
      onToggle={(e) => setOpen(e.currentTarget.open)}
    >
      <summary className={styles.taskSummary}>
        <span className={styles.taskName}>
          <span
            className={styles.taskDot}
            style={{ background: `var(${hue})` }}
          />
          {label}
          {focus && <span className={styles.focusTag}>Focus</span>}
        </span>
        <Sparkline entries={entries} hue={hue} />
        <span className={styles.num}>{latest.pct}%</span>
        <span className={styles.num}>{best}%</span>
        <span className={styles.num}>{avg}%</span>
        <span className={[styles.num, styles.minor].join(" ")}>
          {entries.length}
        </span>
        <span className={[styles.num, styles.minor].join(" ")}>
          {avgSeconds === null ? "—" : formatSecondsAsMmSs(avgSeconds)}
        </span>
        <span className={styles.chevron} aria-hidden="true" />
      </summary>

      {open && (
        <div className={styles.taskDetail}>
          <Suspense fallback={<div className={styles.chartFallback} />}>
            <ScoreTrendChart entries={entries} colorVar={hue} />
          </Suspense>
          <div className={styles.recentList}>
            {entries
              .slice(-5)
              .reverse()
              .map((e, i) => (
                <div key={i} className={styles.recentRow}>
                  <span className={styles.recentDate}>{shortDate(e.date)}</span>
                  <div className={styles.recentBar}>
                    <div
                      className={styles.recentFill}
                      style={{ width: `${e.pct}%`, background: `var(${hue})` }}
                    />
                  </div>
                  <span className={styles.recentPct}>{e.pct}%</span>
                  <span className={styles.recentDetail}>
                    {e.correct}/{e.total}
                  </span>
                  <span className={styles.recentTime}>
                    {typeof e.elapsedSeconds === "number"
                      ? formatSecondsAsMmSs(e.elapsedSeconds)
                      : "—"}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </details>
  );
}

const TASK_GROUPS: { label: string; has: (id: TaskId) => boolean }[] = [
  { label: "TOEFL Reading", has: (id) => id.startsWith("toefl/reading/") },
  { label: "TOEFL Listening", has: (id) => id.startsWith("toefl/listening/") },
  { label: "TOEFL Writing", has: (id) => id.startsWith("toefl/writing/") },
  { label: "TOEFL Speaking", has: (id) => id.startsWith("toefl/speaking/") },
  { label: "TOEFL Practice Test", has: (id) => id === "toefl/trial" },
  { label: "TOEIC L&R", has: (id) => id.startsWith("toeic/") },
  {
    label: "Drills",
    has: (id) =>
      id === "shadowing" || id === "dictation" || id === "instant-composition",
  },
];

export function DashboardPage() {
  const { getAll, clearAll } = useScoreHistory();
  const [entries, setEntries] = useState<ScoreEntry[]>([]);
  const [confirmClear, setConfirmClear] = useState(false);
  const [answers, setAnswers] = useState<Attempt[]>([]);
  const [results, setResults] = useState<Attempt[]>([]);
  const [allAttempts, setAllAttempts] = useState<Attempt[]>([]);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(() => {
    const scores = getAll().then(setEntries);
    const attempts = getAllAttempts().then((all) => {
      setAllAttempts(all);
      // Only attempts with a question snapshot can be rendered as a result.
      const withResult = (a: Attempt) => a.question !== undefined;
      setAnswers(
        all
          .filter(
            (a) => !a.score && !withResult(a) && a.taskId !== TRIAL_TASK_ID,
          )
          .reverse(),
      );
      setResults(all.filter(withResult).reverse());
    });
    Promise.all([scores, attempts]).finally(() => setLoaded(true));
  }, [getAll]);

  useEffect(load, [load]);

  const byTask = entries.reduce<Partial<Record<TaskId, ScoreEntry[]>>>(
    (acc, e) => {
      if (!acc[e.taskId]) acc[e.taskId] = [];
      acc[e.taskId]!.push(e);
      return acc;
    },
    {},
  );

  // Fixed order, so rows don't reshuffle as new tasks get practised.
  const taskIds = (Object.keys(TASK_LABELS) as TaskId[]).filter(
    (id) => byTask[id],
  );
  const focusTask = pickFocusTask(byTask);
  const sessionDates = useMemo(() => entries.map((e) => e.date), [entries]);

  const handleClear = () => {
    if (confirmClear) {
      clearAll().then(() => {
        setEntries([]);
        setAnswers([]);
        setConfirmClear(false);
      });
    } else {
      setConfirmClear(true);
    }
  };

  const totalSessions = entries.length;
  const overallAvg =
    totalSessions > 0
      ? Math.round(entries.reduce((s, e) => s + e.pct, 0) / totalSessions)
      : 0;
  const timedEntries = entries.filter(
    (e) => typeof e.elapsedSeconds === "number",
  );
  const overallAvgElapsed =
    timedEntries.length > 0
      ? formatSecondsAsMmSs(
          Math.round(
            timedEntries.reduce((s, e) => s + (e.elapsedSeconds ?? 0), 0) /
              timedEntries.length,
          ),
        )
      : "—";

  const header = (
    <SectionHeader
      title="Dashboard"
      subtitle="Answer history and score trends"
      backTo="/"
    />
  );

  // Nothing yet: a page of zeros and an empty calendar says less than this.
  // Waiting for the load keeps the empty state from flashing over real data.
  if (!loaded || (entries.length === 0 && allAttempts.length === 0)) {
    return (
      <div>
        {header}
        {loaded && <EmptyHistory />}
      </div>
    );
  }

  return (
    <div>
      {header}

      <div className={styles.summary}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Total Sessions</span>
          <span className={styles.summaryValue}>{totalSessions}</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Tasks Practiced</span>
          <span className={styles.summaryValue}>{taskIds.length}</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Overall Avg Accuracy</span>
          <span className={styles.summaryValue}>
            {totalSessions > 0 ? `${overallAvg}%` : "—"}
          </span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Overall Avg Time</span>
          <span className={styles.summaryValue}>{overallAvgElapsed}</span>
        </div>
      </div>

      <div className={styles.streakPerch}>
        <PixelHamster variant="pearl" className={styles.pearlHamster} />
        <PixelHamster className={styles.hamster} />
        <StreakCalendar dates={sessionDates} />
      </div>

      <PracticeTestsPanel attempts={allAttempts} />

      {taskIds.length === 0 ? (
        <EmptyHistory />
      ) : (
        <>
          <section className={styles.tasks} aria-labelledby="tasks-heading">
            <h2 id="tasks-heading" className={styles.tasksHeading}>
              Tasks
            </h2>
            <div className={styles.tableHead} aria-hidden="true">
              <span>Task</span>
              <span>Last 12</span>
              <span>Latest</span>
              <span>Best</span>
              <span>Avg</span>
              <span className={styles.minor}>Runs</span>
              <span className={styles.minor}>Avg time</span>
              <span />
            </div>
            {TASK_GROUPS.map((group) => {
              const ids = taskIds.filter(group.has);
              if (ids.length === 0) return null;
              return (
                <div key={group.label} className={styles.taskGroup}>
                  <h3 className={styles.groupLabel}>{group.label}</h3>
                  {ids.map((taskId) => (
                    <TaskRow
                      key={taskId}
                      taskId={taskId}
                      entries={byTask[taskId]!}
                      focus={taskId === focusTask}
                    />
                  ))}
                </div>
              );
            })}
          </section>

          <div className={styles.clearSection}>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleClear}
              className={confirmClear ? styles.clearDanger : ""}
            >
              {confirmClear
                ? "Delete all scores, answers, and recordings? (Press again)"
                : "Clear all history"}
            </Button>
            {confirmClear && (
              <button
                className={styles.cancelBtn}
                onClick={() => setConfirmClear(false)}
              >
                Cancel
              </button>
            )}
          </div>
        </>
      )}

      {results.length > 0 && (
        <section className={styles.answersSection}>
          <h2 className={styles.answersHeading}>Results</h2>
          <div className={styles.answersList}>
            {results.map((a) => (
              <Link
                key={a.id}
                to={`/results/${a.id}`}
                className={[styles.answerRow, styles.resultLink].join(" ")}
              >
                <span className={styles.answerDate}>
                  {new Date(a.date).toLocaleDateString()}
                </span>
                <span className={styles.answerProblem}>{attemptLabel(a)}</span>
                <span className={styles.answerPreview}>
                  {a.score
                    ? `${((a.score.correct / a.score.total) * 5).toFixed(1)} / 5`
                    : "Not scored yet"}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {answers.length > 0 && (
        <section className={styles.answersSection}>
          <h2 className={styles.answersHeading}>Answer history</h2>
          <div className={styles.answersList}>
            {answers.map((a) => {
              const text = a.responses
                .map((r) => r.text ?? r.transcript ?? "")
                .join(" ");
              const preview =
                text.length > 80 ? text.slice(0, 80) + "..." : text;
              const itemId = a.responses[0]?.itemId;
              return (
                <div key={a.id} className={styles.answerRow}>
                  <span className={styles.answerDate}>
                    {new Date(a.date).toLocaleDateString()}
                  </span>
                  <span className={styles.answerProblem}>
                    {attemptLabel(a, itemId)}
                  </span>
                  <span className={styles.answerPreview}>{preview}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

function EmptyHistory() {
  const navigate = useNavigate();
  return (
    <div className={styles.empty}>
      <p className={styles.emptyText}>No answer history yet.</p>
      <p className={styles.emptyHint}>
        Finish a question and your scores, streak and trends show up here.
      </p>
      <div className={styles.emptyActions}>
        <Button onClick={() => navigate("/toefl")}>Practice TOEFL</Button>
        <Button variant="secondary" onClick={() => navigate("/toeic")}>
          Practice TOEIC
        </Button>
      </div>
    </div>
  );
}

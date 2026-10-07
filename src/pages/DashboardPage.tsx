import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { useNavigate } from "react-router-dom";
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
import {
  exportBackup,
  getAllAttempts,
  importBackup,
  type Attempt,
} from "../lib/attempts";
import styles from "./DashboardPage.module.css";

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
  "toeic/part2": "TOEIC Part 2: Question-Response",
  "toeic/part3": "TOEIC Part 3: Conversations",
  "toeic/part4": "TOEIC Part 4: Talks",
  "toeic/part5": "TOEIC Part 5",
  "toeic/part6": "TOEIC Part 6",
  "toeic/part7": "TOEIC Part 7",
  shadowing: "Shadowing",
  dictation: "Dictation",
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
};
function shortDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

interface TaskCardProps {
  taskId: TaskId;
  entries: ScoreEntry[];
}

function TaskCard({ taskId, entries }: TaskCardProps) {
  const hue = TASK_HUES[taskId] ?? "--color-accent";
  const latest = entries[entries.length - 1];
  const best = entries.reduce<ScoreEntry | null>(
    (acc, e) => (acc === null || e.pct > acc.pct ? e : acc),
    null,
  );
  const avg =
    entries.length > 0
      ? Math.round(entries.reduce((s, e) => s + e.pct, 0) / entries.length)
      : 0;
  const timedEntries = entries.filter(
    (e) => typeof e.elapsedSeconds === "number",
  );
  const latestElapsed =
    typeof latest?.elapsedSeconds === "number"
      ? formatSecondsAsMmSs(latest.elapsedSeconds)
      : "—";
  const avgElapsed =
    timedEntries.length > 0
      ? formatSecondsAsMmSs(
          Math.round(
            timedEntries.reduce((s, e) => s + (e.elapsedSeconds ?? 0), 0) /
              timedEntries.length,
          ),
        )
      : "—";

  return (
    <div className={styles.taskCard}>
      <div className={styles.taskHeader}>
        <span
          className={styles.taskDot}
          style={{ background: `var(${hue})` }}
        />
        <span className={styles.taskLabel}>{TASK_LABELS[taskId]}</span>
        <span className={styles.taskCount}>
          {entries.length} session{entries.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className={styles.statsRow}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Latest</span>
          <span className={styles.statValue}>
            {latest ? `${latest.pct}%` : "—"}
          </span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Best</span>
          <span
            className={styles.statValue}
            style={{ color: "var(--color-success)" }}
          >
            {best ? `${best.pct}%` : "—"}
          </span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Average</span>
          <span className={styles.statValue}>
            {entries.length > 0 ? `${avg}%` : "—"}
          </span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Latest Time</span>
          <span className={styles.statValue}>{latestElapsed}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Avg Time</span>
          <span className={styles.statValue}>{avgElapsed}</span>
        </div>
      </div>

      <Suspense fallback={<div className={styles.chartFallback} />}>
        <ScoreTrendChart entries={entries} colorVar={hue} />
      </Suspense>

      {entries.length > 0 && (
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
      )}
    </div>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { getAll, clearAll } = useScoreHistory();
  const [entries, setEntries] = useState<ScoreEntry[]>([]);
  const [confirmClear, setConfirmClear] = useState(false);
  const [answers, setAnswers] = useState<Attempt[]>([]);
  const [includeAudio, setIncludeAudio] = useState(false);
  const [backupBusy, setBackupBusy] = useState(false);
  const [backupMessage, setBackupMessage] = useState<string | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    getAll().then(setEntries);
    getAllAttempts().then((all) =>
      setAnswers(all.filter((a) => !a.score).reverse()),
    );
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

  const taskIds = Object.keys(byTask) as TaskId[];
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

  const handleExport = async () => {
    setBackupBusy(true);
    setBackupMessage(null);
    try {
      const url = URL.createObjectURL(await exportBackup(includeAudio));
      const link = document.createElement("a");
      link.href = url;
      link.download = `english-test-backup-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch (e) {
      setBackupMessage(`Export failed: ${e instanceof Error ? e.message : e}`);
    } finally {
      setBackupBusy(false);
    }
  };

  const handleImport = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBackupBusy(true);
    setBackupMessage(null);
    try {
      const count = await importBackup(file);
      setBackupMessage(`Imported ${count} attempt${count === 1 ? "" : "s"}.`);
      load();
    } catch (err) {
      setBackupMessage(
        `Import failed: ${err instanceof Error ? err.message : err}`,
      );
    } finally {
      setBackupBusy(false);
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

  return (
    <div>
      <SectionHeader
        title="Dashboard"
        subtitle="Answer history and score trends"
        backTo="/"
      />

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
        <PixelHamster className={styles.hamster} />
        <StreakCalendar dates={sessionDates} />
      </div>

      {taskIds.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyText}>No answer history yet.</p>
          <p className={styles.emptyHint}>
            Scores will appear here after you complete questions on practice
            pages.
          </p>
          <div className={styles.emptyActions}>
            <Button onClick={() => navigate("/toefl")}>Practice TOEFL</Button>
            <Button variant="secondary" onClick={() => navigate("/toeic")}>
              Practice TOEIC
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className={styles.taskGrid}>
            {taskIds.map((taskId) => (
              <TaskCard
                key={taskId}
                taskId={taskId}
                entries={byTask[taskId]!}
              />
            ))}
          </div>

          <div className={styles.clearSection}>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleClear}
              className={confirmClear ? styles.clearDanger : ""}
            >
              {confirmClear
                ? "Delete all scores, answers, and recordings? (Press again)"
                : "Clear All History"}
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

      {answers.length > 0 && (
        <section className={styles.answersSection}>
          <h2 className={styles.answersHeading}>Answer History</h2>
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
                    {a.taskId}/{a.problemId}
                    {itemId ? `#${itemId}` : ""}
                  </span>
                  <span className={styles.answerPreview}>{preview}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className={styles.answersSection}>
        <h2 className={styles.answersHeading}>Backup</h2>
        <p className={styles.backupHint}>
          Your history lives only in this browser. Export it to keep a copy or
          to move to another browser. Importing adds to what is here, so
          importing the same file twice is harmless.
        </p>
        <div className={styles.backupActions}>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExport}
            disabled={backupBusy}
          >
            Export
          </Button>
          <label className={styles.backupOption}>
            <input
              type="checkbox"
              checked={includeAudio}
              onChange={(e) => setIncludeAudio(e.target.checked)}
            />
            Include recordings
          </label>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => importInputRef.current?.click()}
            disabled={backupBusy}
          >
            Import…
          </Button>
          <input
            ref={importInputRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={handleImport}
          />
        </div>
        {backupMessage && (
          <p className={styles.backupHint} role="status">
            {backupMessage}
          </p>
        )}
      </section>
    </div>
  );
}

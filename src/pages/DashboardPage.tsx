import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { SectionHeader } from "../components/layout/SectionHeader";
import { Button } from "../components/ui/Button";
import {
  useScoreHistory,
  type ScoreEntry,
  type TaskId,
} from "../hooks/useScoreHistory";
import { formatSecondsAsMmSs } from "../lib/time";
import { getAllAnswers, type AnswerEntry } from "../lib/answerSubmission";
import styles from "./DashboardPage.module.css";

// Task display labels
const TASK_LABELS: Record<TaskId, string> = {
  "toefl/reading/complete-words": "TOEFL Reading: Complete Words",
  "toefl/reading/daily-life": "TOEFL Reading: Daily Life",
  "toefl/reading/academic": "TOEFL Reading: Academic",
  "toefl/listening/conversation": "TOEFL Listening: Conversation",
  "toefl/listening/lecture": "TOEFL Listening: Lecture",
  "toefl/writing/build-sentence": "TOEFL Writing: Build Sentence",
  "toefl/writing/email": "TOEFL Writing: Email",
  "toefl/writing/discussion": "TOEFL Writing: Discussion",
  "toefl/speaking/listen-repeat": "TOEFL Speaking: Listen & Repeat",
  "toefl/speaking/interview": "TOEFL Speaking: Interview",
  "toeic/part1": "TOEIC Part 1: Photographs",
  "toeic/part2": "TOEIC Part 2: Question-Response",
  "toeic/part3": "TOEIC Part 3: Conversations",
  "toeic/part4": "TOEIC Part 4: Talks",
  "toeic/part5": "TOEIC Part 5",
  "toeic/part6": "TOEIC Part 6",
  "toeic/part7": "TOEIC Part 7",
  "shadowing": "Shadowing",
};

const TASK_COLORS: Record<string, string> = {
  "toefl/reading/complete-words": "#0ea5e9",
  "toefl/reading/daily-life": "#0284c7",
  "toefl/reading/academic": "#0369a1",
  "toefl/listening/conversation": "#ec4899",
  "toefl/listening/lecture": "#db2777",
  "toefl/writing/build-sentence": "#10b981",
  "toefl/writing/email": "#059669",
  "toefl/writing/discussion": "#047857",
  "toefl/speaking/listen-repeat": "#f59e0b",
  "toefl/speaking/interview": "#d97706",
  "toeic/part5": "#8b5cf6",
  "toeic/part6": "#7c3aed",
  "toeic/part7": "#6d28d9",
};

// Convert date to short format (e.g. "2/18")
function shortDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

// Line chart component
interface LineChartProps {
  entries: ScoreEntry[];
  color: string;
}

function LineChart({ entries, color }: LineChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    const PAD = { top: 16, right: 16, bottom: 40, left: 44 };
    const chartW = W - PAD.left - PAD.right;
    const chartH = H - PAD.top - PAD.bottom;

    ctx.clearRect(0, 0, W, H);

    // Grid lines and Y-axis labels
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;
    ctx.fillStyle = "#94a3b8";
    ctx.font = "11px var(--font-sans)";
    ctx.textAlign = "right";
    for (let i = 0; i <= 4; i++) {
      const pct = i * 25;
      const y = PAD.top + chartH - (pct / 100) * chartH;
      ctx.beginPath();
      ctx.moveTo(PAD.left, y);
      ctx.lineTo(PAD.left + chartW, y);
      ctx.stroke();
      ctx.fillText(`${pct}%`, PAD.left - 6, y + 4);
    }

    if (entries.length === 0) {
      ctx.fillStyle = "#94a3b8";
      ctx.textAlign = "center";
      ctx.font = "13px var(--font-sans)";
      ctx.fillText(
        "No records yet",
        PAD.left + chartW / 2,
        PAD.top + chartH / 2,
      );
      return;
    }

    // Calculate point coordinates
    const points = entries.map((e, i) => ({
      x:
        PAD.left +
        (entries.length === 1
          ? chartW / 2
          : (i / (entries.length - 1)) * chartW),
      y: PAD.top + chartH - (e.pct / 100) * chartH,
      entry: e,
    }));

    // Fill area
    ctx.beginPath();
    ctx.moveTo(points[0].x, PAD.top + chartH);
    points.forEach((p) => ctx.lineTo(p.x, p.y));
    ctx.lineTo(points[points.length - 1].x, PAD.top + chartH);
    ctx.closePath();
    ctx.fillStyle = `${color}22`;
    ctx.fill();

    // Polyline
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = "round";
    points.forEach((p, i) =>
      i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y),
    );
    ctx.stroke();

    // Data points
    points.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#fff";
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // X-axis labels (thinned out)
    ctx.fillStyle = "#94a3b8";
    ctx.font = "10px var(--font-sans)";
    ctx.textAlign = "center";
    const maxLabels = Math.min(entries.length, 8);
    const step = Math.ceil(entries.length / maxLabels);
    points.forEach((p, i) => {
      if (i % step === 0 || i === entries.length - 1) {
        ctx.fillText(shortDate(p.entry.date), p.x, PAD.top + chartH + 18);
      }
    });
  }, [entries, color]);

  useEffect(() => {
    draw();
    const observer = new ResizeObserver(draw);
    if (canvasRef.current) observer.observe(canvasRef.current);
    return () => observer.disconnect();
  }, [draw]);

  return <canvas ref={canvasRef} className={styles.canvas} />;
}

// Task card
interface TaskCardProps {
  taskId: TaskId;
  entries: ScoreEntry[];
}

function TaskCard({ taskId, entries }: TaskCardProps) {
  const color = TASK_COLORS[taskId] ?? "#0071bc";
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
        <span className={styles.taskDot} style={{ background: color }} />
        <span className={styles.taskLabel}>{TASK_LABELS[taskId]}</span>
        <span className={styles.taskCount}>
          {entries.length} session{entries.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className={styles.statsRow}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Latest</span>
          <span className={styles.statValue} style={{ color }}>
            {latest ? `${latest.pct}%` : "—"}
          </span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Best</span>
          <span
            className={styles.statValue}
            style={{ color: "var(--color-correct)" }}
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

      <LineChart entries={entries} color={color} />

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
                    style={{ width: `${e.pct}%`, background: color }}
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
  const [answers] = useState<AnswerEntry[]>(() => getAllAnswers());

  useEffect(() => {
    getAll().then(setEntries);
  }, [getAll]);

  // Group by task
  const byTask = entries.reduce<Partial<Record<TaskId, ScoreEntry[]>>>(
    (acc, e) => {
      if (!acc[e.taskId]) acc[e.taskId] = [];
      acc[e.taskId]!.push(e);
      return acc;
    },
    {},
  );

  const taskIds = Object.keys(byTask) as TaskId[];

  const handleClear = () => {
    if (confirmClear) {
      clearAll().then(() => {
        setEntries([]);
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

  return (
    <div>
      <SectionHeader
        title="Dashboard"
        subtitle="Answer history and score trends"
        backTo="/"
      />

      {/* Summary */}
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
                ? "Delete all history? (Press again)"
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
              const preview = a.response.length > 80
                ? a.response.slice(0, 80) + "..."
                : a.response;
              return (
                <div key={a.answerId} className={styles.answerRow}>
                  <span className={styles.answerDate}>
                    {new Date(a.date).toLocaleDateString()}
                  </span>
                  <span className={styles.answerProblem}>{a.problemId}</span>
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

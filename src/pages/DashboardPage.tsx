import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { SectionHeader } from "../components/layout/SectionHeader";
import { Button } from "../components/ui/Button";
import {
  useScoreHistory,
  type ScoreEntry,
  type TaskId,
} from "../hooks/useScoreHistory";
import { useTheme } from "../hooks/useTheme";
import { readCssVar } from "../lib/cssVars";
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

const TASK_COLORS: Record<string, string> = {
  "toefl/reading/complete-words": "#0ea5e9",
  "toefl/reading/daily-life": "#0284c7",
  "toefl/reading/academic": "#0369a1",
  "toefl/listening/conversation": "#ec4899",
  "toefl/listening/lecture": "#db2777",
  "toefl/listening/response": "#f472b6",
  "toefl/listening/announcement": "#be185d",
  "toefl/writing/build-sentence": "#10b981",
  "toefl/writing/email": "#059669",
  "toefl/writing/discussion": "#047857",
  "toefl/speaking/listen-repeat": "#f59e0b",
  "toefl/speaking/interview": "#d97706",
  "toeic/part5": "#8b5cf6",
  "toeic/part6": "#7c3aed",
  "toeic/part7": "#6d28d9",
  dictation: "#0891b2",
};

// Convert date to short format (e.g. "2/18")
function shortDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

// S-curve smoothing — Catmull-Rom → cubic bezier
function catmullRom2bezier(
  pts: { x: number; y: number }[],
): { x: number; y: number; cp1x: number; cp1y: number; cp2x: number; cp2y: number }[] {
  if (pts.length < 2) return [];
  const out: ReturnType<typeof catmullRom2bezier> = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(i - 1, 0)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(i + 2, pts.length - 1)];
    const t = 0.35;
    out.push({ x: p2.x, y: p2.y, cp1x: p1.x + (p2.x - p0.x) * t, cp1y: p1.y + (p2.y - p0.y) * t, cp2x: p2.x - (p3.x - p1.x) * t, cp2y: p2.y - (p3.y - p1.y) * t });
  }
  return out;
}

// Rich canvas line chart with smooth curves, gradient fill, glow, goal line & hover tooltips
interface LineChartProps {
  entries: ScoreEntry[];
  color: string;
}

function LineChart({ entries, color }: LineChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const hitsRef = useRef<{ x: number; y: number; entry: ScoreEntry }[]>([]);
  // Re-draw when theme tokens change (grid/label/point colors).
  const { theme } = useTheme();

  const hexRgb = (h: string) => {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h);
    return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [0, 0, 0];
  };
  const rgba = (rgb: number[], a: number) => `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a})`;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const W = canvas.offsetWidth, H = canvas.offsetHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    const PAD = { top: 20, right: 24, bottom: 36, left: 48 };
    const chartW = W - PAD.left - PAD.right, chartH = H - PAD.top - PAD.bottom;
    const rgb = hexRgb(color);
    const gridColor = readCssVar("--color-chart-grid", "#e2e8f0");
    const labelColor = readCssVar("--color-chart-label", "#94a3b8");
    const pointFill = readCssVar("--color-chart-point", "#ffffff");

    ctx.clearRect(0, 0, W, H);

    // Dashed horizontal grid
    ctx.strokeStyle = gridColor; ctx.lineWidth = 1;
    ctx.setLineDash([3, 5]);
    for (let i = 0; i <= 4; i++) {
      const y = PAD.top + chartH - ((i * 25) / 100) * chartH;
      ctx.beginPath(); ctx.moveTo(PAD.left, y); ctx.lineTo(PAD.left + chartW, y); ctx.stroke();
    }
    ctx.setLineDash([]);

    // Y-axis % labels
    ctx.fillStyle = labelColor; ctx.font = "600 10px var(--font-sans, Inter, sans-serif)"; ctx.textAlign = "right";
    for (let i = 0; i <= 4; i++) {
      const y = PAD.top + chartH - ((i * 25) / 100) * chartH;
      ctx.fillText(`${i * 25}%`, PAD.left - 8, y + 4);
    }

    if (entries.length === 0) {
      ctx.fillStyle = labelColor; ctx.textAlign = "center";
      ctx.font = "500 13px var(--font-sans, Inter, sans-serif)";
      ctx.fillText("No records yet", PAD.left + chartW / 2, PAD.top + chartH / 2);
      hitsRef.current = [];
      return;
    }

    // Data points
    const points = entries.map((e, i) => ({
      x: PAD.left + (entries.length === 1 ? chartW / 2 : (i / (entries.length - 1)) * chartW),
      y: PAD.top + chartH - (e.pct / 100) * chartH,
      entry: e,
    }));
    hitsRef.current = points;
    const bez = catmullRom2bezier(points);

    // Gradient fill under curve
    const grad = ctx.createLinearGradient(0, PAD.top, 0, PAD.top + chartH);
    grad.addColorStop(0, rgba(rgb, 0.28)); grad.addColorStop(0.5, rgba(rgb, 0.08)); grad.addColorStop(1, rgba(rgb, 0));
    ctx.beginPath();
    if (bez.length > 0) {
      ctx.moveTo(points[0].x, PAD.top + chartH); ctx.lineTo(points[0].x, points[0].y);
      for (const b of bez) ctx.bezierCurveTo(b.cp1x, b.cp1y, b.cp2x, b.cp2y, b.x, b.y);
      ctx.lineTo(points[points.length - 1].x, PAD.top + chartH);
    }
    ctx.closePath(); ctx.fillStyle = grad; ctx.fill();

    // Glow line
    ctx.save(); ctx.shadowColor = rgba(rgb, 0.45); ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.strokeStyle = rgba(rgb, 0.7); ctx.lineWidth = 2.5; ctx.lineJoin = "round"; ctx.lineCap = "round";
    if (bez.length > 0) { ctx.moveTo(points[0].x, points[0].y); for (const b of bez) ctx.bezierCurveTo(b.cp1x, b.cp1y, b.cp2x, b.cp2y, b.x, b.y); }
    ctx.stroke(); ctx.restore();

    // Main line
    ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.lineJoin = "round"; ctx.lineCap = "round";
    if (bez.length > 0) { ctx.moveTo(points[0].x, points[0].y); for (const b of bez) ctx.bezierCurveTo(b.cp1x, b.cp1y, b.cp2x, b.cp2y, b.x, b.y); }
    else if (points.length === 1) { ctx.moveTo(points[0].x - 4, points[0].y); ctx.lineTo(points[0].x + 4, points[0].y); }
    ctx.stroke();

    // Data dots
    points.forEach((p, i) => {
      const last = i === points.length - 1, r = last ? 5.5 : 4;
      if (last) { ctx.beginPath(); ctx.arc(p.x, p.y, r + 4, 0, Math.PI * 2); ctx.fillStyle = rgba(rgb, 0.12); ctx.fill(); }
      ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fillStyle = pointFill; ctx.fill();
      ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.stroke();
    });

    // X-axis dates
    ctx.fillStyle = labelColor; ctx.font = "600 10px var(--font-sans, Inter, sans-serif)"; ctx.textAlign = "center";
    const maxL = Math.min(entries.length, 8), step = Math.ceil(entries.length / maxL);
    points.forEach((p, i) => { if (i % step === 0 || i === entries.length - 1) ctx.fillText(shortDate(p.entry.date), p.x, PAD.top + chartH + 18); });

    // 80% goal reference line
    const goalY = PAD.top + chartH - 0.8 * chartH;
    ctx.beginPath(); ctx.setLineDash([5, 5]); ctx.strokeStyle = labelColor; ctx.globalAlpha = 0.45; ctx.lineWidth = 1;
    ctx.moveTo(PAD.left, goalY); ctx.lineTo(PAD.left + chartW, goalY); ctx.stroke(); ctx.globalAlpha = 1; ctx.setLineDash([]);
    ctx.fillStyle = labelColor; ctx.font = "600 9px var(--font-sans, Inter, sans-serif)"; ctx.textAlign = "left";
    ctx.fillText("80% goal", PAD.left + chartW - 44, goalY - 5);
  }, [entries, color, theme]);

  // Pointer hover → nearest point tooltip
  const onPointer = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const tooltip = tooltipRef.current;
    if (!canvas || !tooltip) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    let nearest: (typeof hitsRef.current)[0] | null = null, minD = 30;
    for (const h of hitsRef.current) { const d = Math.sqrt((mx - h.x) ** 2 + (my - h.y) ** 2); if (d < minD) { minD = d; nearest = h; } }
    if (nearest) {
      const e2 = nearest.entry;
      const elapsed = typeof e2.elapsedSeconds === "number" ? formatSecondsAsMmSs(e2.elapsedSeconds) : "—";
      tooltip.textContent = `${shortDate(e2.date)}  •  ${e2.pct}% (${e2.correct}/${e2.total})  •  ${elapsed}`;
      tooltip.style.left = `${nearest.x}px`; tooltip.style.top = `${nearest.y}px`;
      tooltip.className = `${styles.chartTooltip} ${styles.chartTooltipVisible}`;
    } else { tooltip.className = styles.chartTooltip; }
  }, []);
  const onLeave = useCallback(() => { if (tooltipRef.current) tooltipRef.current.className = styles.chartTooltip; }, []);

  useEffect(() => {
    draw();
    const observer = new ResizeObserver(draw);
    if (canvasRef.current) observer.observe(canvasRef.current);
    return () => observer.disconnect();
  }, [draw]);

  return (
    <div ref={wrapperRef} className={styles.chartWrapper}>
      <canvas ref={canvasRef} className={styles.canvas} onPointerMove={onPointer} onPointerLeave={onLeave}
        aria-label={`Score trend chart with ${entries.length} data points`} role="img" />
      <div ref={tooltipRef} className={styles.chartTooltip} />
    </div>
  );
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
              const preview =
                a.response.length > 80
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

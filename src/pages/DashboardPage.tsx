import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { SectionHeader } from "../components/layout/SectionHeader";
import { Button } from "../components/ui/Button";
import {
  useScoreHistory,
  type ScoreEntry,
  type TaskId,
} from "../hooks/useScoreHistory";
import styles from "./DashboardPage.module.css";

// タスクの表示名
const TASK_LABELS: Record<TaskId, string> = {
  "toefl/reading/complete-words": "TOEFL Reading: Complete Words",
  "toefl/reading/daily-life": "TOEFL Reading: Daily Life",
  "toefl/reading/academic": "TOEFL Reading: Academic",
  "toefl/writing/build-sentence": "TOEFL Writing: Build Sentence",
  "toefl/writing/email": "TOEFL Writing: Email",
  "toefl/writing/discussion": "TOEFL Writing: Discussion",
  "toefl/speaking/listen-repeat": "TOEFL Speaking: Listen & Repeat",
  "toefl/speaking/interview": "TOEFL Speaking: Interview",
  "toeic/part5": "TOEIC Part 5",
  "toeic/part6": "TOEIC Part 6",
  "toeic/part7": "TOEIC Part 7",
};

const TASK_COLORS: Record<string, string> = {
  "toefl/reading/complete-words": "#0071bc",
  "toefl/reading/daily-life": "#0091d4",
  "toefl/reading/academic": "#00a8e8",
  "toefl/writing/build-sentence": "#16a34a",
  "toefl/writing/email": "#22c55e",
  "toefl/writing/discussion": "#4ade80",
  "toefl/speaking/listen-repeat": "#d97706",
  "toefl/speaking/interview": "#f59e0b",
  "toeic/part5": "#7c3aed",
  "toeic/part6": "#a855f7",
  "toeic/part7": "#c084fc",
};

// 日付を短い形式に変換 (例: "2/18")
function shortDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

// 折れ線グラフコンポーネント
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

    // グリッド線と Y 軸ラベル
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;
    ctx.fillStyle = "#6b7280";
    ctx.font = "11px system-ui";
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
      ctx.fillStyle = "#9ca3af";
      ctx.textAlign = "center";
      ctx.font = "13px system-ui";
      ctx.fillText(
        "まだ記録がありません",
        PAD.left + chartW / 2,
        PAD.top + chartH / 2,
      );
      return;
    }

    // データ点の座標計算
    const points = entries.map((e, i) => ({
      x:
        PAD.left +
        (entries.length === 1
          ? chartW / 2
          : (i / (entries.length - 1)) * chartW),
      y: PAD.top + chartH - (e.pct / 100) * chartH,
      entry: e,
    }));

    // 塗りつぶし領域
    ctx.beginPath();
    ctx.moveTo(points[0].x, PAD.top + chartH);
    points.forEach((p) => ctx.lineTo(p.x, p.y));
    ctx.lineTo(points[points.length - 1].x, PAD.top + chartH);
    ctx.closePath();
    ctx.fillStyle = `${color}22`;
    ctx.fill();

    // 折れ線
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = "round";
    points.forEach((p, i) =>
      i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y),
    );
    ctx.stroke();

    // データ点
    points.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#fff";
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // X 軸ラベル（間引き）
    ctx.fillStyle = "#6b7280";
    ctx.font = "10px system-ui";
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

// タスクカード
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

  return (
    <div className={styles.taskCard}>
      <div className={styles.taskHeader}>
        <span className={styles.taskDot} style={{ background: color }} />
        <span className={styles.taskLabel}>{TASK_LABELS[taskId]}</span>
        <span className={styles.taskCount}>{entries.length}回</span>
      </div>

      <div className={styles.statsRow}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>最新</span>
          <span className={styles.statValue} style={{ color }}>
            {latest ? `${latest.pct}%` : "—"}
          </span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>最高</span>
          <span
            className={styles.statValue}
            style={{ color: "var(--color-correct)" }}
          >
            {best ? `${best.pct}%` : "—"}
          </span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>平均</span>
          <span className={styles.statValue}>
            {entries.length > 0 ? `${avg}%` : "—"}
          </span>
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

  useEffect(() => {
    getAll().then(setEntries);
  }, [getAll]);

  // タスク別にグループ化
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

  return (
    <div>
      <SectionHeader
        title="ダッシュボード"
        subtitle="解答履歴とスコア推移"
        backTo="/"
      />

      {/* サマリー */}
      <div className={styles.summary}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>総セッション数</span>
          <span className={styles.summaryValue}>{totalSessions}</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>取り組んだタスク</span>
          <span className={styles.summaryValue}>{taskIds.length}</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>全体平均正答率</span>
          <span className={styles.summaryValue}>
            {totalSessions > 0 ? `${overallAvg}%` : "—"}
          </span>
        </div>
      </div>

      {taskIds.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyText}>まだ解答履歴がありません。</p>
          <p className={styles.emptyHint}>
            各練習ページで問題を解くとここにスコアが記録されます。
          </p>
          <div className={styles.emptyActions}>
            <Button onClick={() => navigate("/toefl")}>TOEFL を練習する</Button>
            <Button variant="secondary" onClick={() => navigate("/toeic")}>
              TOEIC を練習する
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
                ? "本当に削除しますか？（もう一度押す）"
                : "履歴を全削除"}
            </Button>
            {confirmClear && (
              <button
                className={styles.cancelBtn}
                onClick={() => setConfirmClear(false)}
              >
                キャンセル
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

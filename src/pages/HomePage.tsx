import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { useScoreHistory } from "../hooks/useScoreHistory";
import { formatSecondsAsMmSs } from "../lib/time";
import table from "../components/ui/ProblemTable.module.css";
import styles from "./HomePage.module.css";

type TestItem = {
  title: string;
  subtitle: string;
  path: string;
};

const tests: TestItem[] = [
  {
    title: "TOEFL iBT 2026",
    subtitle: "Reading, Writing, Listening & Speaking — full practice",
    path: "/toefl",
  },
  {
    title: "TOEIC L&R",
    subtitle: "Parts 2-7 — Listening & Reading practice",
    path: "/toeic",
  },
  {
    title: "Shadowing Practice",
    subtitle: "Listen and repeat — improve pronunciation & fluency",
    path: "/shadowing",
  },
];

export function HomePage() {
  const navigate = useNavigate();
  const { getAll } = useScoreHistory();
  const [stats, setStats] = useState<{
    solved: number;
    accuracy: number;
    avgTime: string;
    streak: number;
  } | null>(null);

  useEffect(() => {
    getAll().then((entries) => {
      if (entries.length === 0) return;
      const solved = entries.length;
      const accuracy = Math.round(
        entries.reduce((s, e) => s + e.pct, 0) / solved,
      );
      const timed = entries.filter((e) => typeof e.elapsedSeconds === "number");
      const avgTime =
        timed.length > 0
          ? formatSecondsAsMmSs(
              Math.round(
                timed.reduce((s, e) => s + (e.elapsedSeconds ?? 0), 0) /
                  timed.length,
              ),
            )
          : "—";

      const dates = Array.from(
        new Set(entries.map((e) => new Date(e.date).toDateString())),
      ).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
      let streak = 0;
      const today = new Date().toDateString();
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      let checkDate = dates[0] === today ? today : yesterday;
      for (const d of dates) {
        if (d === checkDate) {
          streak++;
          checkDate = new Date(
            new Date(checkDate).getTime() - 86400000,
          ).toDateString();
        } else {
          break;
        }
      }

      setStats({ solved, accuracy, avgTime, streak });
    });
  }, [getAll]);

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <span className={styles.badge}>AI-Powered Practice</span>
        <h1 className={styles.title}>
          English Test <span className={styles.titleAccent}>Practice</span>
        </h1>
        <p className={styles.description}>
          Master the TOEFL iBT 2026 & TOEIC L&R with AI-generated questions. No
          sign-up required.
        </p>
        <div className={styles.quickStart}>
          <Button variant="accent" size="md" onClick={() => navigate("/toefl")}>
            Start Practicing
          </Button>
          <Button
            variant="secondary"
            size="md"
            onClick={() => navigate("/dashboard")}
          >
            View Dashboard
          </Button>
        </div>
      </div>

      {stats && (
        <div className={styles.statsBar}>
          <div className={styles.statChip}>
            <span className={styles.statChipLabel}>Solved</span>
            <span className={styles.statChipValue}>{stats.solved}</span>
          </div>
          <div className={styles.statChip}>
            <span className={styles.statChipLabel}>Accuracy</span>
            <span className={styles.statChipValue}>{stats.accuracy}%</span>
          </div>
          <div className={styles.statChip}>
            <span className={styles.statChipLabel}>Avg Time</span>
            <span className={styles.statChipValue}>{stats.avgTime}</span>
          </div>
          <div className={styles.statChip}>
            <span className={styles.statChipLabel}>Streak</span>
            <span className={styles.statChipValue}>{stats.streak}d</span>
          </div>
        </div>
      )}

      <div className={styles.studySection}>
        <h2 className={styles.sectionTitle}>
          Problem Sets
          <span className={styles.sectionCount}>{tests.length} available</span>
        </h2>
        <div className={table.container}>
          <div className={table.header}>
            <span>#</span>
            <span>Test</span>
          </div>
          {tests.map((test, i) => (
            <Link key={test.path} to={test.path} className={table.row}>
              <span className={table.statusCol}>
                {stats ? (
                  <span className={table.statusSolved}>✓</span>
                ) : (
                  <span className={table.statusNone}>{i + 1}</span>
                )}
              </span>
              <span className={table.titleCell}>
                {test.title}
                <div className={table.titleMeta}>{test.subtitle}</div>
              </span>
            </Link>
          ))}
        </div>
      </div>

      <p className={styles.note}>
        Generate questions with an AI agent and save them under{" "}
        <code>public/questions/</code>. Prompts in <code>public/prompts/</code>.
      </p>
    </div>
  );
}

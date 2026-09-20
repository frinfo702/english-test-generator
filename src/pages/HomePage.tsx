import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useScoreHistory } from "../hooks/useScoreHistory";
import { formatSecondsAsMmSs } from "../lib/time";
import table from "../components/ui/ProblemTable.module.css";
import styles from "./HomePage.module.css";

type TestItem = {
  title: string;
  subtitle: string;
  meta: string;
  path: string;
};

const tests: TestItem[] = [
  {
    title: "TOEFL iBT 2026",
    subtitle: "Reading, Writing, Listening, Speaking",
    meta: "12 tasks",
    path: "/toefl",
  },
  {
    title: "TOEIC L&R",
    subtitle: "Parts 2–7 — listening and reading",
    meta: "6 parts",
    path: "/toeic",
  },
  {
    title: "Shadowing",
    subtitle: "Speak along with a model voice, sentence by sentence",
    meta: "Sets",
    path: "/shadowing",
  },
  {
    title: "Dictation",
    subtitle: "Hear a line, then rebuild it word by word",
    meta: "Sets",
    path: "/dictation",
  },
];

interface Stats {
  solved: number;
  accuracy: number;
  avgTime: string;
  streak: number;
}

export function HomePage() {
  const { getAll } = useScoreHistory();
  const [stats, setStats] = useState<Stats | null>(null);

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
      <header className={styles.intro}>
        <p className="micro-label">TOEFL iBT 2026 · TOEIC L&amp;R</p>
        <h1 className={styles.title}>English Test Practice</h1>
      </header>

      <div className={styles.grid}>
        <section className={styles.suites} aria-labelledby="suites-heading">
          <div className={styles.sectionHead}>
            <h2 id="suites-heading" className={styles.sectionTitle}>
              Practice
            </h2>
            <span className={styles.sectionCount}>{tests.length} suites</span>
          </div>
          <div className={table.container}>
            {tests.map((test, i) => (
              <Link key={test.path} to={test.path} className={table.row}>
                <span className={table.statusCol}>
                  <span className={table.statusNone}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </span>
                <span className={table.titleCell}>
                  {test.title}
                  <span className={table.titleMeta}>{test.subtitle}</span>
                </span>
                <span className={table.badgeCell}>{test.meta}</span>
              </Link>
            ))}
          </div>
        </section>

        <aside className={styles.aside} aria-labelledby="stats-heading">
          <div className={styles.sectionHead}>
            <h2 id="stats-heading" className={styles.sectionTitle}>
              This device
            </h2>
            <span className={styles.sectionCount}>
              {stats ? "Local history" : "No sessions yet"}
            </span>
          </div>

          <dl className={styles.stats}>
            <div className={styles.stat}>
              <dt className={styles.statLabel}>Sessions</dt>
              <dd className={styles.statValue}>{stats ? stats.solved : "—"}</dd>
            </div>
            <div className={styles.stat}>
              <dt className={styles.statLabel}>Accuracy</dt>
              <dd className={styles.statValue}>
                {stats ? `${stats.accuracy}%` : "—"}
              </dd>
            </div>
            <div className={styles.stat}>
              <dt className={styles.statLabel}>Avg. time</dt>
              <dd className={styles.statValue}>{stats?.avgTime ?? "—"}</dd>
            </div>
            <div className={styles.stat}>
              <dt className={styles.statLabel}>Streak</dt>
              <dd className={styles.statValue}>
                {stats ? `${stats.streak}d` : "—"}
              </dd>
            </div>
          </dl>

          <p className={styles.note}>
            Scores stay in this browser. Question sets live in{" "}
            <code>public/questions/</code>, added with the prompts in{" "}
            <code>public/prompts/</code>.
          </p>
        </aside>
      </div>
    </div>
  );
}

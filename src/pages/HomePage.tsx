import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { useScoreHistory } from "../hooks/useScoreHistory";
import { formatSecondsAsMmSs } from "../lib/time";
import {
  SparklesIcon,
  ArrowRightIcon,
  BookOpenIcon,
  HeadphonesIcon,
  MicIcon,
  TargetIcon,
} from "../components/ui/Icons";
import styles from "./HomePage.module.css";

type TestItem = {
  title: string;
  subtitle: string;
  path: string;
  color: string;
  gradient: string;
  icon: "toefl" | "toeic" | "shadowing" | "dictation";
};

const tests: TestItem[] = [
  {
    title: "TOEFL iBT 2026",
    subtitle: "Reading, Writing, Listening & Speaking — complete skill coverage for the new format.",
    path: "/toefl",
    color: "var(--color-accent)",
    gradient: "var(--gradient-accent)",
    icon: "toefl",
  },
  {
    title: "TOEIC L&R",
    subtitle: "Parts 2–7 — Listening & Reading with real test-style questions.",
    path: "/toeic",
    color: "var(--color-toeic)",
    gradient: "var(--gradient-toeic)",
    icon: "toeic",
  },
  {
    title: "Shadowing Practice",
    subtitle: "Listen and repeat — improve your pronunciation and speaking fluency.",
    path: "/shadowing",
    color: "var(--color-speaking)",
    gradient: "var(--gradient-speaking)",
    icon: "shadowing",
  },
  {
    title: "Dictation Practice",
    subtitle: "Listen and arrange words — train your ear for detail and accuracy.",
    path: "/dictation",
    color: "var(--color-listening)",
    gradient: "var(--gradient-listening)",
    icon: "dictation",
  },
];

const IconMap: Record<string, React.ReactNode> = {
  toefl: <BookOpenIcon size={20} />,
  toeic: <TargetIcon size={20} />,
  shadowing: <MicIcon size={20} />,
  dictation: <HeadphonesIcon size={20} />,
};

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
      {/* Hero */}
      <section className={styles.hero}>
        <span className={styles.badge}>
          <span className={styles.badgeDot} />
          AI-Powered Practice
          <SparklesIcon size={14} />
        </span>
        <h1 className={styles.title}>
          English Test{" "}
          <span className={styles.titleAccent}>Practice</span>
        </h1>
        <p className={styles.description}>
          Master the TOEFL iBT 2026 & TOEIC L&R with AI-generated questions.
          No sign-up. No internet required after load.
        </p>
        <div className={styles.quickStart}>
          <Button variant="accent" size="lg" onClick={() => navigate("/toefl")}>
            Start Practicing
            <ArrowRightIcon size={16} />
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => navigate("/dashboard")}
          >
            View Dashboard
          </Button>
        </div>
      </section>

      {/* Stats Bar */}
      {stats && (
        <div className={styles.statsBar}>
          <div className={styles.statChip}>
            <span className={styles.statChipLabel}>Sessions</span>
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

      {/* Study Cards */}
      <section className={styles.studySection}>
        <h2 className={styles.sectionTitle}>
          <BookOpenIcon size={22} />
          Practice Tests
          <span className={styles.sectionCount}>{tests.length} modes</span>
        </h2>
        <div className={styles.studyGrid}>
          {tests.map((test) => (
            <Link
              key={test.path}
              to={test.path}
              className={styles.studyCard}
              style={{ ["--card-accent" as string]: test.color } as React.CSSProperties}
            >
              <div
                className={styles.cardIconWrap}
                style={{ background: test.gradient }}
              >
                {IconMap[test.icon]}
              </div>
              <span className={styles.cardTitle}>{test.title}</span>
              <span className={styles.cardDesc}>{test.subtitle}</span>
              <span className={styles.cardCta}>
                Get started <ArrowRightIcon size={14} />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <p className={styles.note}>
        Questions are generated with an AI agent and saved under{" "}
        <code>public/questions/</code>. Prompts in <code>public/prompts/</code>.
      </p>
    </div>
  );
}

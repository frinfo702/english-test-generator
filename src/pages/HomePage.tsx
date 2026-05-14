import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { useScoreHistory } from "../hooks/useScoreHistory";
import { formatSecondsAsMmSs } from "../lib/time";
import styles from "./HomePage.module.css";

export function HomePage() {
  const navigate = useNavigate();
  const { getAll } = useScoreHistory();
  const [stats, setStats] = useState<{
    sessions: number;
    accuracy: number;
    avgTime: string;
    streak: number;
  } | null>(null);

  useEffect(() => {
    getAll().then((entries) => {
      if (entries.length === 0) return;
      const sessions = entries.length;
      const accuracy = Math.round(
        entries.reduce((s, e) => s + e.pct, 0) / sessions,
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

      setStats({ sessions, accuracy, avgTime, streak });
    });
  }, [getAll]);

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <h1 className={styles.title}>
          Master the TOEFL iBT 2026{" "}
          <span className={styles.titleAccent}>&amp;</span> TOEIC L&amp;R
        </h1>
        <p className={styles.description}>
          AI-generated practice questions. No sign-up required. Practice
          anytime, anywhere.
        </p>
        <div className={styles.quickStart}>
          <Button
            variant="accent"
            size="md"
            onClick={() => navigate("/toefl")}
          >
            Practice TOEFL
          </Button>
          <Button
            variant="secondary"
            size="md"
            onClick={() => navigate("/toeic")}
          >
            Practice TOEIC
          </Button>
        </div>
      </div>

      {stats && (
        <div className={styles.statsBar}>
          <div className={styles.statChip}>
            <span className={styles.statChipLabel}>Sessions</span>
            <span className={styles.statChipValue}>{stats.sessions}</span>
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
        <h2 className={styles.sectionTitle}>Choose your test</h2>
        <div className={styles.cards}>
          <div className={styles.card} onClick={() => navigate("/toefl")}>
            <div
              className={styles.cardAccent}
              style={{ background: "var(--color-reading)" }}
            />
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>TOEFL iBT 2026</h3>
              <span
                className={styles.cardBadge}
                style={{
                  background: "var(--color-accent-subtle)",
                  color: "var(--color-accent)",
                }}
              >
                NEW
              </span>
            </div>
            <p className={styles.cardDesc}>
              Aligned with the January 2026 format update. Reading, Writing, and
              Speaking sections.
            </p>
            <ul className={styles.cardTasks}>
              <li>Reading — Complete the Words, Daily Life, Academic</li>
              <li>Writing — Build Sentence, Email, Discussion</li>
              <li>Speaking — Listen &amp; Repeat, Interview</li>
            </ul>
            <Button className={styles.cardBtn} variant="accent" size="sm">
              Start →
            </Button>
          </div>

          <div className={styles.card} onClick={() => navigate("/toeic")}>
            <div
              className={styles.cardAccent}
              style={{ background: "var(--color-toeic)" }}
            />
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>TOEIC L&amp;R</h3>
            </div>
            <p className={styles.cardDesc}>
              Parts 1-7. Complete Listening &amp; Reading practice with
              instant scoring and audio playback.
            </p>
            <ul className={styles.cardTasks}>
              <li>Part 5 — Incomplete Sentences (30 Qs)</li>
              <li>Part 6 — Text Completion (16 Qs)</li>
              <li>Part 7 — Reading Comprehension (54 Qs)</li>
            </ul>
            <Button className={styles.cardBtn} variant="secondary" size="sm">
              Start →
            </Button>
          </div>

          <div className={styles.card} onClick={() => navigate("/shadowing")}>
            <div
              className={styles.cardAccent}
              style={{ background: "var(--color-speaking)" }}
            />
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Shadowing Practice</h3>
              <span
                className={styles.cardBadge}
                style={{
                  background: "var(--color-warning-subtle)",
                  color: "var(--color-warning)",
                }}
              >
                NEW
              </span>
            </div>
            <p className={styles.cardDesc}>
              Listen and repeat to improve pronunciation and fluency. Audio
              played with AI-generated voice, text can be hidden or revealed.
            </p>
            <ul className={styles.cardTasks}>
              <li>Daily Conversations — 6 sentences</li>
              <li>Academic Topics — 7 sentences</li>
              <li>Travel &amp; Culture — 8 sentences</li>
            </ul>
            <Button className={styles.cardBtn} variant="accent" size="sm">
              Start →
            </Button>
          </div>
        </div>
      </div>

      <p className={styles.note}>
        Generate questions with an AI agent and save them under{" "}
        <code>public/questions/</code>. Prompt specifications for each task are
        available in <code>public/prompts/</code>.
      </p>
    </div>
  );
}

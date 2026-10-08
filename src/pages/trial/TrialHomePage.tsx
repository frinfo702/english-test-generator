import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { getAllAttempts, saveAttempt, type Attempt } from "../../lib/attempts";
import {
  TRIAL_SECTIONS,
  TRIAL_TASK_ID,
  buildTrialPlan,
  formatMinutes,
  isTrial,
  modeMinutes,
  scoreTrial,
  trialTitle,
  type TrialMode,
} from "../../lib/trial";
import { BandTable } from "./BandTable";
import styles from "./Trial.module.css";

const MODES: { mode: TrialMode; label: string }[] = [
  { mode: "full", label: "Full Test" },
  ...TRIAL_SECTIONS.map((s) => ({ mode: s.key, label: s.label })),
];

export function TrialHomePage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<TrialMode>("full");
  const [attempts, setAttempts] = useState<Attempt[] | null>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAllAttempts().then(setAttempts, () => setAttempts([]));
  }, []);

  const trials = (attempts ?? []).filter(isTrial);
  const byId = new Map((attempts ?? []).map((a) => [a.id, a]));
  const recent = [...trials].reverse().slice(0, 3);
  const minutes = modeMinutes(mode);
  const modeLabel = MODES.find((m) => m.mode === mode)!.label;

  const start = async () => {
    setStarting(true);
    setError(null);
    try {
      const items = await buildTrialPlan(mode, attempts ?? []);
      if (items.length === 0) throw new Error("No questions are available.");
      const saved = await saveAttempt({
        taskId: TRIAL_TASK_ID,
        responses: [],
        trial: { mode, items, sectionStarts: {} },
      });
      navigate(`/trial/${saved.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStarting(false);
    }
  };

  return (
    <div className={styles.home}>
      <header className={styles.homeHeader}>
        <h1 className={styles.homeTitle}>TOEFL Practice Test</h1>
        <p className={styles.lede}>
          Practice tests simulate the real exam experience and give you an
          estimated score on the 1–6 scale.
        </p>
      </header>

      <div className={styles.homeGrid}>
        <section aria-labelledby="take-test">
          <h2 id="take-test" className={styles.columnHeading}>
            Take a Practice Test
          </h2>
          <div className={styles.panel}>
            <div
              className={styles.chips}
              role="radiogroup"
              aria-label="Test length"
            >
              {MODES.map((m) => (
                <button
                  key={m.mode}
                  type="button"
                  role="radio"
                  aria-checked={mode === m.mode}
                  className={[
                    styles.chip,
                    mode === m.mode ? styles.chipOn : "",
                  ].join(" ")}
                  onClick={() => setMode(m.mode)}
                >
                  {m.label}
                  <span className={styles.chipMeta}>
                    {formatMinutes(modeMinutes(m.mode))}
                  </span>
                </button>
              ))}
            </div>

            <h3 className={styles.subheading}>What's Included</h3>
            <p className={styles.body}>
              When you finish, you get <strong>section band scores</strong>, a{" "}
              <strong>total score</strong>, and an{" "}
              <strong>estimated real-test score</strong> that also draws on your
              practice history. Answers stay hidden until the end, as on test
              day.
            </p>
            <p className={styles.body}>
              Reading and Listening are <strong>adaptive</strong>: your
              Module 1 score picks an easier or harder Module 2. Afterwards you
              can <strong>review every answer</strong> next to the correct one,
              with explanations.
            </p>

            <h3 className={styles.subheading}>What You'll Need</h3>
            <p className={styles.body}>
              Scratch paper, headphones, and a <strong>microphone</strong> for
              Speaking. Set aside <strong>{formatMinutes(minutes)}</strong> and
              take it in one sitting. Each section is timed; when the clock
              runs out, the section ends.
            </p>
            <p className={styles.body}>
              Writing and Interview answers are scored at the end: you paste
              each prompt into your AI chat and paste its reply back.
            </p>

            <h3 className={styles.startHeading}>{modeLabel} Practice Test</h3>
            <p className={styles.note}>
              Questions are drawn automatically: ones you haven't solved first,
              then the ones you saw longest ago.
            </p>
            {error && <p className={styles.error}>{error}</p>}
            <Button
              size="lg"
              onClick={() => void start()}
              disabled={starting || attempts === null}
            >
              {starting ? "Preparing…" : "Start Practice Test"}
            </Button>
          </div>
        </section>

        <aside aria-labelledby="recent-results">
          <div className={styles.columnHead}>
            <h2 id="recent-results" className={styles.columnHeading}>
              Recent Results
            </h2>
            <Link to="/dashboard#practice-tests" className={styles.quietLink}>
              All Results
            </Link>
          </div>
          {recent.length === 0 && (
            <p className={styles.note}>No practice tests yet.</p>
          )}
          {recent.map((t) => (
            <article key={t.id} className={styles.resultCard}>
              <div className={styles.resultHead}>
                <div>
                  <h3 className={styles.resultTitle}>
                    {trialTitle(t, trials)}
                  </h3>
                  <p className={styles.resultDate}>
                    {new Date(t.date).toLocaleDateString(undefined, {
                      dateStyle: "long",
                    })}
                  </p>
                </div>
                <Link
                  to={
                    t.trial.finishedAt
                      ? `/trial/${t.id}/report`
                      : `/trial/${t.id}`
                  }
                  className={styles.quietLink}
                >
                  {t.trial.finishedAt ? "View Details" : "Resume"}
                </Link>
              </div>
              <BandTable
                result={scoreTrial(t.trial, byId)}
                finished={Boolean(t.trial.finishedAt)}
              />
            </article>
          ))}
        </aside>
      </div>
    </div>
  );
}

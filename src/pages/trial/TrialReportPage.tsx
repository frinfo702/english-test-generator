import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { getAllAttempts, putAttempts, type Attempt } from "../../lib/attempts";
import { fetchQuestionByIdWithMeta } from "../../lib/questions";
import {
  estimateScore,
  formatBand,
  isTrial,
  pendingAiResponses,
  scoreTrial,
  trialTitle,
  type SectionKey,
  type TrialItem,
} from "../../lib/trial";
import { BandTable } from "./BandTable";
import { AiScoring, ItemReview } from "./ItemReview";
import { TASK_NAMES } from "./taskNames";
import styles from "./Trial.module.css";

const questionKey = (i: TrialItem) => `${i.taskId}/${i.problemId}`;

export function TrialReportPage() {
  const { trialId = "" } = useParams<{ trialId: string }>();
  const [attempts, setAttempts] = useState<Attempt[] | null>(null);
  const [questions, setQuestions] = useState<Map<string, unknown>>(new Map());
  const [scoreLater, setScoreLater] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAllAttempts().then(setAttempts, () => setAttempts([]));
  }, []);

  const trials = (attempts ?? []).filter(isTrial);
  const trial = trials.find((t) => t.id === trialId);

  useEffect(() => {
    if (!trial) return;
    let cancelled = false;
    // Practice attempts don't snapshot their question, so review re-reads the file.
    Promise.all(
      trial.trial.items.map(async (i) => {
        const { data } = await fetchQuestionByIdWithMeta<unknown>(
          i.taskId,
          i.problemId,
        ).catch(() => ({ data: null }));
        return [questionKey(i), data] as const;
      }),
    ).then((entries) => !cancelled && setQuestions(new Map(entries)));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the item list never changes
  }, [trial?.id]);

  if (attempts === null) return <LoadingSpinner message="Loading report..." />;
  if (!trial) return <p>Practice test not found.</p>;

  const byId = new Map(attempts.map((a) => [a.id, a]));
  const linked = (i: TrialItem) =>
    i.attemptId ? byId.get(i.attemptId) : undefined;
  const result = scoreTrial(trial.trial, byId);
  const estimate = estimateScore(attempts);
  const pending = trial.trial.items.filter(
    (i) => pendingAiResponses(linked(i)).length > 0,
  );

  const update = (next: Attempt) => {
    setAttempts((all) => all && all.map((a) => (a.id === next.id ? next : a)));
    putAttempts([next]).then(
      () => setError(null),
      (e: unknown) =>
        setError(e instanceof Error ? e.message : "Failed to save the score."),
    );
  };

  const header = (
    <header className={styles.reportHeader}>
      <p className="micro-label">Score report</p>
      <h1 className={styles.homeTitle}>{trialTitle(trial, trials)}</h1>
      <p className={styles.resultDate}>
        {new Date(trial.date).toLocaleString(undefined, {
          dateStyle: "long",
          timeStyle: "short",
        })}
      </p>
      {error && <p className={styles.error}>{error}</p>}
    </header>
  );

  if (pending.length > 0 && !scoreLater) {
    return (
      <div className={styles.report}>
        {header}
        <section className={styles.panel}>
          <h2 className={styles.subheading}>Score your Writing and Speaking</h2>
          <p className={styles.body}>
            {pending.length} {pending.length === 1 ? "response needs" : "responses need"}{" "}
            an AI score before your report is ready. For each one, copy the
            prompt into your AI chat and paste its whole reply back here.
          </p>
          {pending.map((i) => (
            <div key={questionKey(i)} className={styles.scoreGroup}>
              <h3 className={styles.reviewHeading}>
                {TASK_NAMES[i.taskId]}
              </h3>
              {questions.has(questionKey(i)) ? (
                <AiScoring
                  taskId={i.taskId}
                  attempt={linked(i)!}
                  question={questions.get(questionKey(i))}
                  onChange={update}
                />
              ) : (
                <p className={styles.note}>Loading…</p>
              )}
            </div>
          ))}
          <Button variant="secondary" onClick={() => setScoreLater(true)}>
            Score later and see the report
          </Button>
        </section>
      </div>
    );
  }

  return (
    <div className={styles.report}>
      {header}

      <div className={styles.reportGrid}>
        <section className={styles.resultCard} aria-label="This test">
          <h2 className={styles.resultTitle}>This test</h2>
          <BandTable result={result} finished />
        </section>
        <section className={styles.resultCard} aria-label="Estimated score">
          <h2 className={styles.resultTitle}>Estimated real-test score</h2>
          <BandTable
            finished
            result={{
              overall: estimate.overall,
              sections: result.sections.map((s) => ({
                ...s,
                band: estimate.sections[s.key],
              })),
            }}
          />
          <p className={styles.note}>
            Combines all your practice tests and task practice.
          </p>
        </section>
      </div>

      {result.sections.map((s) => (
        <SectionReview
          key={s.key}
          section={s.key}
          title={`${s.label} · ${formatBand(s.band)}`}
          meta={`${s.points} / ${s.max} points${
            trial.trial.routes?.[s.key]
              ? ` · ${trial.trial.routes[s.key] === "hard" ? "Harder" : "Easier"} Module 2`
              : ""
          }`}
          items={trial.trial.items.filter((i) => i.section === s.key)}
          linked={linked}
          questions={questions}
          onChange={update}
        />
      ))}

      <p>
        <Link to="/trial" className={styles.quietLink}>
          Back to practice tests
        </Link>
      </p>
    </div>
  );
}

function SectionReview({
  section,
  title,
  meta,
  items,
  linked,
  questions,
  onChange,
}: {
  section: SectionKey;
  title: string;
  meta: string;
  items: TrialItem[];
  linked: (i: TrialItem) => Attempt | undefined;
  questions: Map<string, unknown>;
  onChange: (next: Attempt) => void;
}) {
  return (
    <section className={styles.sectionReview} aria-label={section}>
      <div className={styles.columnHead}>
        <h2 className={styles.columnHeading}>{title}</h2>
        <span className={styles.note}>{meta}</span>
      </div>
      <ol className={styles.itemRows}>
        {items.map((i, n) => {
          const attempt = linked(i);
          const unscored = pendingAiResponses(attempt).length > 0;
          return (
            <li key={questionKey(i)}>
              <details className={styles.itemRow}>
                <summary>
                  <span className={styles.itemIndex}>
                    {String(n + 1).padStart(2, "0")}
                  </span>
                  <span className={styles.itemName}>
                    {TASK_NAMES[i.taskId]}
                  </span>
                  <span className={styles.itemScore}>
                    {!attempt
                      ? "Not answered"
                      : unscored
                        ? "Not scored"
                        : `${attempt.score?.correct ?? 0} / ${i.maxPoints}`}
                  </span>
                </summary>
                <div className={styles.itemBody}>
                  <ItemReview
                    taskId={i.taskId}
                    attempt={attempt}
                    question={questions.get(questionKey(i))}
                    onChange={onChange}
                  />
                </div>
              </details>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

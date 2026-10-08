import { lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import type { Attempt } from "../../lib/attempts";
import {
  TRIAL_SECTIONS,
  estimateScore,
  formatBand,
  isTrial,
  scoreTrial,
  trialTitle,
} from "../../lib/trial";
import { BandTable } from "./BandTable";
import styles from "./Trial.module.css";

const BandTrendChart = lazy(() =>
  import("../../components/ui/BandTrendChart").then((m) => ({
    default: m.BandTrendChart,
  })),
);

const SECTION_HUES = {
  reading: "--color-reading",
  listening: "--color-listening",
  writing: "--color-writing",
  speaking: "--color-speaking",
} as const;

export function PracticeTestsPanel({ attempts }: { attempts: Attempt[] }) {
  const byId = new Map(attempts.map((a) => [a.id, a]));
  const trials = attempts.filter(isTrial);
  const finished = trials
    .filter((t) => t.trial.finishedAt)
    .map((t) => ({ t, result: scoreTrial(t.trial, byId) }));
  const estimate = estimateScore(attempts);

  const series = (
    pick: (r: (typeof finished)[number]["result"]) => number | null,
  ) =>
    finished.flatMap(({ t, result }) => {
      const band = pick(result);
      return band === null
        ? []
        : [
            {
              id: t.id,
              label: `${trialTitle(t, trials).replace("TOEFL ", "")} · ${new Date(t.date).getMonth() + 1}/${new Date(t.date).getDate()}`,
              band,
            },
          ];
    });

  return (
    <section id="practice-tests" className={styles.sectionReview}>
      <div className={styles.columnHead}>
        <h2 className={styles.columnHeading}>Practice Tests</h2>
        <Link to="/trial" className={styles.quietLink}>
          Take a practice test
        </Link>
      </div>

      <div className={styles.reportGrid}>
        <div className={styles.resultCard}>
          <h3 className={styles.resultTitle}>Estimated real-test score</h3>
          <BandTable
            finished
            result={{
              overall: estimate.overall,
              sections: TRIAL_SECTIONS.map((s) => ({
                key: s.key,
                label: s.label,
                points: 0,
                max: 0,
                band: estimate.sections[s.key],
              })),
            }}
          />
          <p className={styles.note}>
            From {finished.length} practice{" "}
            {finished.length === 1 ? "test" : "tests"} and your task practice.
          </p>
        </div>
        <div className={styles.resultCard}>
          <Suspense fallback={<p className={styles.note}>Loading chart…</p>}>
            <BandTrendChart
              title="Total"
              colorVar="--color-ink"
              points={series((r) =>
                r.sections.length === 1 ? null : r.overall,
              )}
            />
          </Suspense>
        </div>
      </div>

      <div className={styles.chartGrid}>
        <Suspense fallback={null}>
          {TRIAL_SECTIONS.map((s) => (
            <div key={s.key} className={styles.resultCard}>
              <BandTrendChart
                title={s.label}
                colorVar={SECTION_HUES[s.key]}
                points={series(
                  (r) => r.sections.find((x) => x.key === s.key)?.band ?? null,
                )}
              />
            </div>
          ))}
        </Suspense>
      </div>

      {trials.length > 0 && (
        <ol className={styles.itemRows}>
          {[...trials].reverse().map((t) => {
            const r = scoreTrial(t.trial, byId);
            const total =
              r.sections.length === 1 ? r.sections[0].band : r.overall;
            return (
              <li key={t.id}>
                <Link
                  to={
                    t.trial.finishedAt
                      ? `/trial/${t.id}/report`
                      : `/trial/${t.id}`
                  }
                  className={styles.itemLink}
                >
                  <span className={styles.itemName}>
                    {trialTitle(t, trials)} ·{" "}
                    {r.sections.length === 1 ? r.sections[0].label : "Full"}
                  </span>
                  <span className={styles.itemIndex}>
                    {new Date(t.date).toLocaleDateString()}
                  </span>
                  <span className={styles.itemScore}>
                    {t.trial.finishedAt ? formatBand(total) : "NS"}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

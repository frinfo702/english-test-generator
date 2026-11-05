import { useState } from "react";
import { Button } from "../../components/ui/Button";
import type { Attempt } from "../../lib/attempts";
import {
  BAND_STEPS,
  loadScoreGoal,
  saveScoreGoal,
  sectionGoalFits,
  totalRange,
  withDerivedTotal,
  type ScoreGoal,
} from "../../lib/scoreGoal";
import {
  TRIAL_SECTIONS,
  estimateScore,
  formatBand,
  isTrial,
  type SectionKey,
} from "../../lib/trial";
import styles from "./EstimateCard.module.css";

const MIN = BAND_STEPS[0];
const MAX = BAND_STEPS[BAND_STEPS.length - 1];
const pos = (band: number) => `${((band - MIN) / (MAX - MIN)) * 100}%`;

/** "0.5 to go" / "Goal met" — nothing when either side is unknown. */
function gapText(estimate: number | null, goal: number | null) {
  if (estimate === null || goal === null) return null;
  return estimate >= goal ? "Goal met" : `${formatBand(goal - estimate)} to go`;
}

function BandSelect({
  label,
  value,
  onChange,
  fits = () => true,
  disabled = false,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  /** False for a band that can't coexist with the other goals. */
  fits?: (band: number) => boolean;
  disabled?: boolean;
}) {
  return (
    <label className={styles.field}>
      <span>{label}</span>
      <select
        value={value ?? ""}
        disabled={disabled}
        onChange={(e) =>
          onChange(e.target.value === "" ? null : Number(e.target.value))
        }
      >
        <option value="">No goal</option>
        {BAND_STEPS.map((b) => (
          <option key={b} value={b} disabled={!fits(b)}>
            {formatBand(b)}
          </option>
        ))}
      </select>
    </label>
  );
}

function GoalForm({
  initial,
  onDone,
}: {
  initial: ScoreGoal;
  onDone: (goal: ScoreGoal | null) => void;
}) {
  const [draft, setDraft] = useState(initial);
  const setSection = (k: SectionKey, v: number | null) =>
    setDraft((d) =>
      withDerivedTotal({ ...d, sections: { ...d.sections, [k]: v } }),
    );
  const [lo, hi] = totalRange(draft.sections);
  const totalFixed = lo === hi && draft.overall === lo;
  return (
    <form
      className={styles.form}
      onSubmit={(e) => {
        e.preventDefault();
        onDone(draft);
      }}
    >
      <div className={styles.fields}>
        <BandSelect
          label="Total"
          value={draft.overall}
          onChange={(v) => setDraft((d) => ({ ...d, overall: v }))}
          fits={(b) => b >= lo && b <= hi}
          disabled={totalFixed}
        />
        {TRIAL_SECTIONS.map((s) => (
          <BandSelect
            key={s.key}
            label={s.label}
            value={draft.sections[s.key]}
            onChange={(v) => setSection(s.key, v)}
            // A derived total moves with the sections instead of pinning them.
            fits={(b) => totalFixed || sectionGoalFits(draft, s.key, b)}
          />
        ))}
      </div>
      <p className={styles.note}>
        {totalFixed
          ? "With all four sections set, the total follows from them."
          : "The total is the section average, rounded to the nearest half band. Bands that can't add up are greyed out."}
      </p>
      <div className={styles.formActions}>
        <Button size="sm" type="submit">
          Save goal
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onDone(null)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

/** Estimated real-test bands, each set against the learner's own target. */
export function EstimateCard({ attempts }: { attempts: Attempt[] }) {
  const [goal, setGoal] = useState(loadScoreGoal);
  const [editing, setEditing] = useState(false);
  const estimate = estimateScore(attempts);
  const finished = attempts.filter(
    (a) => isTrial(a) && a.trial.finishedAt,
  ).length;
  const hasGoal =
    goal.overall !== null ||
    Object.values(goal.sections).some((v) => v !== null);
  const totalGap = gapText(estimate.overall, goal.overall);

  return (
    <section className={styles.card} aria-labelledby="estimate-title">
      <header className={styles.head}>
        <h2 id="estimate-title" className={styles.title}>
          Estimated score
        </h2>
        {!editing && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setEditing(true)}
          >
            {hasGoal ? "Edit goal" : "Set a goal"}
          </Button>
        )}
      </header>

      <div className={styles.total}>
        <span className={styles.totalValue}>
          {formatBand(estimate.overall)}
        </span>
        {goal.overall !== null && (
          <span className={styles.totalGoal}>
            / goal {formatBand(goal.overall)}
          </span>
        )}
        {totalGap && (
          <span
            className={[
              styles.gap,
              totalGap === "Goal met" ? styles.met : "",
            ].join(" ")}
          >
            {totalGap}
          </span>
        )}
      </div>

      <ul className={styles.sections}>
        {TRIAL_SECTIONS.map((s) => {
          const est = estimate.sections[s.key];
          const target = goal.sections[s.key];
          const met = est !== null && target !== null && est >= target;
          return (
            <li key={s.key} className={styles.section}>
              <span className={styles.sectionLabel}>{s.label}</span>
              <span
                className={styles.track}
                role="img"
                aria-label={`${s.label}: ${formatBand(est)}${target === null ? "" : `, goal ${formatBand(target)}`}`}
              >
                {est !== null && (
                  <span
                    className={[styles.fill, met ? styles.fillMet : ""].join(
                      " ",
                    )}
                    style={{ width: pos(est) }}
                  />
                )}
                {target !== null && (
                  <span className={styles.tick} style={{ left: pos(target) }} />
                )}
              </span>
              <span className={styles.sectionValue}>{formatBand(est)}</span>
              <span className={styles.sectionGoal}>
                {target === null ? "" : `goal ${formatBand(target)}`}
              </span>
            </li>
          );
        })}
      </ul>

      {editing && (
        <GoalForm
          initial={goal}
          onDone={(next) => {
            if (next) {
              saveScoreGoal(next);
              setGoal(next);
            }
            setEditing(false);
          }}
        />
      )}

      <p className={styles.note}>
        From {finished} practice {finished === 1 ? "test" : "tests"} and your
        task practice. Bands run 1–6.
      </p>
    </section>
  );
}

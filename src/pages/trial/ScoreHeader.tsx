import { SectionHeader } from "../../components/layout/SectionHeader";
import { ScorePips } from "../../components/pixel/ScorePips";
import {
  formatBand,
  type Estimate,
  type Route,
  type SectionKey,
  type TrialResult,
} from "../../lib/trial";
import styles from "./Trial.module.css";

/** The report's header: page title, then one frosted panel with the band. */
export function ScoreHeader({
  title,
  date,
  result,
  estimate,
  routes,
}: {
  title: string;
  date: string;
  result: TrialResult;
  estimate: Estimate;
  routes?: Partial<Record<SectionKey, Route>>;
}) {
  const single = result.sections.length === 1 ? result.sections[0] : null;
  const total = single ? single.band : result.overall;
  const route = single && routes?.[single.key];
  const stats = [
    ...(single
      ? [{ label: "Points", value: `${single.points} / ${single.max}` }]
      : result.sections.map((s) => ({
          label: s.label,
          value: formatBand(s.band),
        }))),
    ...(route
      ? [{ label: "Module 2", value: route === "hard" ? "Harder" : "Easier" }]
      : []),
    {
      label: "Estimated real test",
      value: formatBand(
        single ? estimate.sections[single.key] : estimate.overall,
      ),
    },
  ];

  const when = new Date(date).toLocaleString(undefined, {
    dateStyle: "long",
    timeStyle: "short",
  });
  return (
    <>
      <SectionHeader
        title={title}
        subtitle={`Score report · ${when} · ${single ? single.label : "Full test"}`}
        backTo="/trial"
      />
      <section className={`glass ${styles.scoreHeader}`} aria-label="Score">
        <dl className={styles.stats}>
          {stats.map((s) => (
            <div key={s.label} className={styles.stat}>
              <dt>{s.label}</dt>
              <dd>{s.value}</dd>
            </div>
          ))}
        </dl>
        <div className={styles.scoreCard}>
          <p className="micro-label">Band</p>
          <p className={styles.bigScore}>
            {formatBand(total)}
            <span>/ 6</span>
          </p>
          <ol className={styles.pipStrip} aria-label="Section bands">
            {result.sections.map((s) => (
              <li key={s.key}>
                <span>{s.label}</span>
                <ScorePips score={s.band} max={6} />
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}

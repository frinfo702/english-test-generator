import { PixelIcon } from "../../components/pixel/PixelIcon";
import type { PixelIconName } from "../../components/pixel/pixelIcons";
import { ScorePips } from "../../components/pixel/ScorePips";
import {
  formatBand,
  type Estimate,
  type Route,
  type SectionKey,
  type TrialResult,
} from "../../lib/trial";
import styles from "./Trial.module.css";

const SECTION_ICONS: Record<SectionKey, PixelIconName> = {
  reading: "book",
  listening: "headphones",
  writing: "pencil",
  speaking: "microphone",
};

/** The speaking result's header, for a whole test: sprite, band, pips. */
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

  return (
    <header className={styles.scoreHeader}>
      <div className={styles.scoreHeaderText}>
        <p className={styles.eyebrow}>Score report</p>
        <h1 className={styles.scoreTitle}>{title}</h1>
        <p className={styles.eyebrow}>
          {new Date(date).toLocaleString(undefined, {
            dateStyle: "long",
            timeStyle: "short",
          })}{" "}
          · {single ? single.label : "Full test"}
        </p>
        <dl className={styles.stats}>
          {stats.map((s) => (
            <div key={s.label} className={styles.stat}>
              <dt>{s.label}</dt>
              <dd>{s.value}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className={styles.scoreCard}>
        <PixelIcon
          name={single ? SECTION_ICONS[single.key] : "university"}
          className={styles.sprite}
        />
        <div>
          <p className={styles.bigScore}>
            {formatBand(total)}
            <span>/6</span>
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
      </div>
    </header>
  );
}

import { formatBand, type TrialResult } from "../../lib/trial";
import styles from "./Trial.module.css";

/** Section bands over a heavier total row; "NS" when the test was abandoned. */
export function BandTable({
  result,
  finished,
}: {
  result: TrialResult;
  finished: boolean;
}) {
  const single = result.sections.length === 1;
  return (
    <dl className={styles.bandTable}>
      {!single &&
        result.sections.map((s) => (
          <div key={s.key} className={styles.bandRow}>
            <dt>{s.label}</dt>
            <dd className={styles.bandCell}>
              {finished ? formatBand(s.band) : "NS"}
            </dd>
          </div>
        ))}
      <div className={`${styles.bandRow} ${styles.bandTotal}`}>
        <dt>{single ? `${result.sections[0].label} Score` : "Total Score"}</dt>
        <dd
          className={[styles.bandCell, finished ? "" : styles.bandNs].join(" ")}
        >
          {finished
            ? formatBand(single ? result.sections[0].band : result.overall)
            : "NS"}
        </dd>
      </div>
    </dl>
  );
}

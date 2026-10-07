import type { AlignedWord } from "./listenRepeat";
import styles from "./ListenRepeatPage.module.css";

export function DiffLegend() {
  return (
    <div className={styles.legend}>
      <p className={styles.fbLabel}>How to read the answer</p>
      <div className={styles.legendItems}>
        <div className={styles.legendItem}>
          <span
            className={[styles.diffWord, styles.diffCorrect].join(" ")}
            title="Correctly spoken"
          >
            correct
          </span>
          <span className={styles.legendLabel}>Correctly spoken</span>
        </div>
        <div className={styles.legendItem}>
          <span
            className={[styles.diffWord, styles.diffWrong].join(" ")}
            title="Wrong word"
          >
            wrong
          </span>
          <span className={styles.legendLabel}>Wrong word</span>
        </div>
        <div className={styles.legendItem}>
          <span
            className={[
              styles.diffWord,
              styles.diffWrong,
              styles.diffMissing,
            ].join(" ")}
            title="Missing word"
          >
            ▪
          </span>
          <span className={styles.legendLabel}>Missing word</span>
        </div>
        <div className={styles.legendItem}>
          <span
            className={[
              styles.diffWord,
              styles.diffWrong,
              styles.diffExtra,
            ].join(" ")}
            title="Extra word"
          >
            extra
          </span>
          <span className={styles.legendLabel}>Extra word</span>
        </div>
      </div>
    </div>
  );
}

export function ListenRepeatDiffView({
  alignment,
  showLabels = true,
}: {
  alignment: AlignedWord[];
  showLabels?: boolean;
}) {
  return (
    <div className={styles.sideBySideDiff}>
      {showLabels && (
        <div className={styles.diffColumn}>
          <div
            className={[styles.diffCell, styles.diffRowLabel].join(" ")}
            aria-hidden="true"
          >
            Prompt
          </div>
          <div
            className={[styles.diffCell, styles.diffRowLabel].join(" ")}
            aria-hidden="true"
          >
            Response
          </div>
        </div>
      )}
      {alignment.map((a, j) => {
        const isMatch = a.type === "match";
        const isDeletion = a.type === "deletion";
        const isInsertion = a.type === "insertion";

        const topClasses = [styles.diffCell];
        const bottomClasses = [styles.diffCell];

        if (isMatch) {
          topClasses.push(styles.diffCorrect);
          bottomClasses.push(styles.diffCorrect);
        } else if (isDeletion) {
          topClasses.push(styles.diffWrong, styles.diffMissing);
          bottomClasses.push(styles.diffPlaceholder);
        } else if (isInsertion) {
          topClasses.push(styles.diffPlaceholder);
          bottomClasses.push(styles.diffWrong, styles.diffExtra);
        } else {
          topClasses.push(styles.diffWrong);
          bottomClasses.push(styles.diffWrong);
        }

        return (
          <div key={j} className={styles.diffColumn}>
            <div
              className={topClasses.join(" ")}
              title={
                a.type === "match"
                  ? "Correct"
                  : a.type === "deletion"
                    ? `Missing: ${a.original}`
                    : a.type === "insertion"
                      ? "(not in original)"
                      : `Expected: ${a.original}`
              }
            >
              {a.original ?? "▪"}
            </div>
            <div
              className={bottomClasses.join(" ")}
              title={
                a.type === "match"
                  ? "Correct"
                  : a.type === "deletion"
                    ? "(not spoken)"
                    : a.type === "insertion"
                      ? `Extra: ${a.recognized}`
                      : `Got: ${a.recognized}`
              }
            >
              {a.recognized ?? "▪"}
            </div>
          </div>
        );
      })}
    </div>
  );
}

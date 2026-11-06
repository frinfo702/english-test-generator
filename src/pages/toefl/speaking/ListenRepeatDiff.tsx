import type { AlignedWord } from "./listenRepeat";
import styles from "./ListenRepeatDiff.module.css";

/** One aligned pair: the prompt's word over what was heard. */
function Pair({
  top,
  bottom,
  kind,
  title,
}: {
  top: string;
  bottom: string;
  kind: AlignedWord["type"];
  title?: string;
}) {
  return (
    <span className={styles.pair} data-kind={kind} title={title}>
      <span className={styles.top}>{top || " "}</span>
      <span className={styles.bottom}>{bottom}</span>
    </span>
  );
}

/** The key, drawn with the same marks as the diff below it. */
export function DiffLegend() {
  return (
    <div className={styles.legend} aria-label="How to read the answer">
      <span className={styles.key}>
        <Pair top="word" bottom="ward" kind="substitution" />
        Said differently
      </span>
      <span className={styles.key}>
        <Pair top="word" bottom="—" kind="deletion" />
        Not said
      </span>
      <span className={styles.key}>
        <Pair top="" bottom="extra" kind="insertion" />
        Extra word
      </span>
    </div>
  );
}

/**
 * The prompt and the transcript word by word, aligned in columns that wrap
 * like a sentence: matches recede, differences are marked.
 */
export function ListenRepeatDiffView({
  alignment,
}: {
  alignment: AlignedWord[];
}) {
  return (
    <div className={styles.diff}>
      <span className={styles.labels} aria-hidden="true">
        <span>Prompt</span>
        <span>You</span>
      </span>
      {alignment.map((a, j) => (
        <Pair
          key={j}
          kind={a.type}
          top={a.original ?? ""}
          bottom={a.recognized ?? "—"}
          title={
            a.type === "match"
              ? undefined
              : a.type === "deletion"
                ? `Not said: ${a.original}`
                : a.type === "insertion"
                  ? `Extra: ${a.recognized}`
                  : `Expected “${a.original}”, heard “${a.recognized}”`
          }
        />
      ))}
    </div>
  );
}

import styles from "./TakeInterviewPage.module.css";

type TranscriptKind = "scenario" | "question";

interface InterviewTranscriptProps {
  kind: TranscriptKind;
  scenario?: string;
  question?: string;
}

/**
 * Collapsed transcript for audio-only scenario / question playback.
 * Expand only when the user could not hear the audio.
 */
export function InterviewTranscript({
  kind,
  scenario,
  question,
}: InterviewTranscriptProps) {
  const lines =
    kind === "scenario" && scenario
      ? scenario.split("\n").filter((line) => line.length > 0)
      : null;

  return (
    <details className={styles.transcriptDetails}>
      <summary className={styles.transcriptSummary}>
        Couldn&apos;t hear? Show text
      </summary>
      <div className={styles.transcriptBody}>
        {kind === "scenario" && lines && (
          <div className={styles.transcriptBlock}>
            <p className={styles.transcriptLabel}>Scenario</p>
            {lines.map((line, i) => (
              <p key={i} className={styles.scenarioLine}>
                {line}
              </p>
            ))}
          </div>
        )}
        {kind === "question" && question && (
          <div className={styles.transcriptBlock}>
            <p className={styles.transcriptLabel}>Question</p>
            <p className={styles.scenarioLine}>{question}</p>
          </div>
        )}
      </div>
    </details>
  );
}

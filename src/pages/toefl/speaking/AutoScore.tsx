import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../../../components/ui/Button";
import { ThinkingOrb } from "../../../components/ui/ThinkingOrb";
import { VercelMark } from "../../../components/ui/VercelMark";
import { useScoringJob } from "../../../hooks/useAutoScore";
import {
  autoScoring,
  loadScoringSettings,
  modelName,
} from "../../../lib/aiGateway";
import { retryScoring, type ScoringJob } from "../../../lib/backgroundScoring";
import { AiScorePanel } from "./AiScorePanel";
import styles from "./AutoScore.module.css";

/**
 * Where the copy & paste panel would sit while a background score runs: the
 * waiting orb, or an error with retry and a way back to copy & paste.
 */
export function ScoringStatus({
  job,
  onRetry,
  onManual,
}: {
  job: ScoringJob;
  onRetry: () => void;
  onManual: () => void;
}) {
  if (job.status === "scoring") {
    return (
      <div className={styles.status} role="status">
        <ThinkingOrb />
        <span className={styles.label}>
          Scoring with {modelName(loadScoringSettings().model)}
          <span className={styles.via}>
            <VercelMark size={9} /> AI Gateway
          </span>
        </span>
      </div>
    );
  }
  return (
    <div className={styles.failed}>
      <p className={styles.error} role="alert">
        {job.message}
      </p>
      <div className={styles.status}>
        <Button size="sm" variant="secondary" onClick={onRetry}>
          Try again
        </Button>
        <button type="button" className={styles.quiet} onClick={onManual}>
          Copy &amp; paste instead
        </button>
        <Link to="/settings" className={styles.quiet}>
          Settings
        </Link>
      </div>
    </div>
  );
}

/** A facet the AI hasn't scored yet, in the slot its bar will take. */
export function PendingFacet({
  label,
  job,
}: {
  label: string;
  job: ScoringJob;
}) {
  return (
    <div className={styles.facet}>
      <span className={styles.facetLabel}>{label}</span>
      {job.status === "scoring" ? (
        <>
          <ThinkingOrb />
          <span className={styles.facetNote}>Scoring</span>
        </>
      ) : (
        <span className={styles.facetNote}>—</span>
      )}
    </div>
  );
}

/**
 * The AI score slot for one unscored response. With the user's key, scoring
 * started when the answer was finished, so this only shows its progress; an
 * old answer nobody is scoring just reads "Not scored". Without a key, it is
 * today's copy & paste panel.
 */
export function AiScore<T>({
  attemptId,
  index,
  message,
  parse,
  note,
  onApply,
}: {
  attemptId: string;
  index: number;
  message: string;
  parse: (reply: string) => T;
  note?: string;
  onApply: (ai: { reply: string; scores: T }) => void;
}) {
  const job = useScoringJob(attemptId, index);
  const [auto] = useState(() => autoScoring() !== null);
  const [manual, setManual] = useState(false);
  if (job && !manual) {
    return (
      <ScoringStatus
        job={job}
        onRetry={() => retryScoring(attemptId, index)}
        onManual={() => setManual(true)}
      />
    );
  }
  if (auto && !manual) return <p className={styles.unscored}>Not scored</p>;
  return (
    <AiScorePanel
      message={message}
      parse={parse}
      note={note}
      onApply={onApply}
    />
  );
}

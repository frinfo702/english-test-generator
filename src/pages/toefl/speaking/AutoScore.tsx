import { Link } from "react-router-dom";
import { Button } from "../../../components/ui/Button";
import { ThinkingOrb } from "../../../components/ui/ThinkingOrb";
import { VercelMark } from "../../../components/ui/VercelMark";
import { useAutoScore, type AutoScore } from "../../../hooks/useAutoScore";
import { modelName } from "../../../lib/aiGateway";
import { AiScorePanel } from "./AiScorePanel";
import styles from "./AutoScore.module.css";

/**
 * Where the copy & paste panel would sit: the waiting orb, or an error with
 * retry and a way back to copy & paste. Renders nothing once scored.
 */
export function ScoringStatus({ auto }: { auto: AutoScore }) {
  const model = auto.model ? modelName(auto.model) : "";
  if (auto.phase === "ready") {
    return (
      <div className={styles.status}>
        <Button size="sm" onClick={auto.start}>
          Score with {model}
        </Button>
        <button
          type="button"
          className={styles.quiet}
          onClick={auto.switchToManual}
        >
          Copy &amp; paste instead
        </button>
      </div>
    );
  }
  if (auto.phase === "scoring") {
    return (
      <div className={styles.status} role="status">
        <ThinkingOrb />
        <span className={styles.label}>
          Scoring with {model}
          <span className={styles.via}>
            <VercelMark size={9} /> AI Gateway
          </span>
        </span>
      </div>
    );
  }
  if (auto.phase === "error") {
    return (
      <div className={styles.failed}>
        <p className={styles.error} role="alert">
          {auto.error}
        </p>
        <div className={styles.status}>
          <Button size="sm" variant="secondary" onClick={auto.start}>
            Try again
          </Button>
          <button
            type="button"
            className={styles.quiet}
            onClick={auto.switchToManual}
          >
            Copy &amp; paste instead
          </button>
          <Link to="/settings" className={styles.quiet}>
            Settings
          </Link>
        </div>
      </div>
    );
  }
  return null;
}

/** A facet the AI hasn't scored yet, in the slot its bar will take. */
export function PendingFacet({
  label,
  auto,
}: {
  label: string;
  auto: AutoScore;
}) {
  return (
    <div className={styles.facet}>
      <span className={styles.facetLabel}>{label}</span>
      {auto.phase === "scoring" ? (
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

/** Auto-scores with the user's key when set up; otherwise copy & paste. */
export function AiScore<T>({
  message,
  parse,
  note,
  onApply,
  autoStart,
}: {
  message: string;
  parse: (reply: string) => T;
  note?: string;
  onApply: (ai: { reply: string; scores: T }) => void;
  autoStart?: boolean;
}) {
  const auto = useAutoScore({ message, parse, onApply, autoStart });
  if (auto.phase === "off" || auto.phase === "manual") {
    return (
      <AiScorePanel
        message={message}
        parse={parse}
        note={note}
        onApply={onApply}
      />
    );
  }
  return <ScoringStatus auto={auto} />;
}

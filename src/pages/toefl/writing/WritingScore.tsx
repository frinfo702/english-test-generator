import { PoweredByGateway } from "../../../components/ui/VercelMark";
import {
  buildWritingTaskMessage,
  WRITING_SCORE_NOTE,
} from "../../../lib/answerSubmission";
import type { Attempt } from "../../../lib/attempts";
import {
  parseWritingScore,
  stripScoreBlock,
  withWritingAi,
} from "../../../lib/interviewScoring";
import { AiScore } from "../speaking/AutoScore";
import styles from "./WritingScore.module.css";

/**
 * The AI score for a submitted Writing response, fetched with the user's key
 * while the rubric and model answer below are already on the page.
 */
export function WritingScore({
  taskId,
  question,
  attempt,
  error,
  onChange,
}: {
  taskId: "toefl/writing/email" | "toefl/writing/discussion";
  question: unknown;
  attempt: Attempt;
  error: string | null;
  onChange: (next: Attempt) => void;
}) {
  const r = attempt.responses[0];
  return (
    <section className={styles.sheet} aria-label="AI score">
      <header className={styles.head}>
        <p className="micro-label">AI score</p>
        {/* While scoring, the status line already names the gateway. */}
        {r.itemScore !== undefined && r.aiReply && (
          <PoweredByGateway prefix="" />
        )}
      </header>
      {r.itemScore !== undefined ? (
        <>
          <p className={styles.score}>
            {r.itemScore}
            <span>/5</span>
          </p>
          {r.aiReply && (
            <p className={styles.feedback}>{stripScoreBlock(r.aiReply)}</p>
          )}
        </>
      ) : (
        <AiScore
          message={buildWritingTaskMessage(taskId, question, r.text ?? "")}
          parse={parseWritingScore}
          note={WRITING_SCORE_NOTE}
          onApply={(ai) => onChange(withWritingAi(attempt, ai))}
        />
      )}
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </section>
  );
}

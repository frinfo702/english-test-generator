import { PoweredByGateway } from "../../../components/ui/VercelMark";
import {
  buildWritingTaskMessage,
  WRITING_SCORE_NOTE,
  writingCriteria,
} from "../../../lib/answerSubmission";
import type { Attempt } from "../../../lib/attempts";
import {
  parseWritingCriteria,
  parseWritingScore,
  stripScoreBlock,
  withWritingAi,
} from "../../../lib/interviewScoring";
import { AiScore } from "../speaking/AutoScore";
import styles from "./WritingScore.module.css";

type WritingTaskId = "toefl/writing/email" | "toefl/writing/discussion";

/**
 * Every rubric point the AI rated, in prompt order, with its own 0–5 and a
 * note. Before the criteria prompt ships (old replies) there is nothing to
 * show, so the whole block is skipped.
 */
export function WritingCriteria({
  taskId,
  question,
  reply,
}: {
  taskId: WritingTaskId;
  question: unknown;
  reply: string;
}) {
  const rated = parseWritingCriteria(reply);
  if (rated.length === 0) return null;
  const criteria = writingCriteria(taskId, question);
  return (
    <ul className={styles.criteria}>
      {rated.map((s, i) => (
        <li key={i} className={styles.criterion}>
          <div className={styles.criterionHead}>
            <span className={styles.criterionName}>
              {criteria[i]?.name ?? `Criterion ${i + 1}`}
            </span>
            <span className={styles.criterionPoints}>{s.points}/5</span>
          </div>
          {s.note && <p className={styles.criterionNote}>{s.note}</p>}
        </li>
      ))}
    </ul>
  );
}

/**
 * The AI score for a submitted Writing response: the progress of background
 * scoring with the user's key, or the copy & paste panel without one.
 */
export function WritingScore({
  taskId,
  question,
  attempt,
  error,
  onChange,
}: {
  taskId: WritingTaskId;
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
            <>
              <p className={styles.feedback}>{stripScoreBlock(r.aiReply)}</p>
              <WritingCriteria
                taskId={taskId}
                question={question}
                reply={r.aiReply}
              />
            </>
          )}
        </>
      ) : (
        <AiScore
          attemptId={attempt.id}
          index={0}
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

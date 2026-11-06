import { ScorePips } from "../../../components/pixel/ScorePips";
import { Prose } from "../../../components/ui/Prose";
import { PoweredByGateway } from "../../../components/ui/VercelMark";
import {
  buildWritingTaskMessage,
  WRITING_SCORE_NOTE,
  writingCriteria,
} from "../../../lib/answerSubmission";
import type { Attempt } from "../../../lib/attempts";
import {
  parseWritingCriteria,
  parseWritingNotes,
  parseWritingScore,
  stripScoreBlock,
  withWritingAi,
} from "../../../lib/interviewScoring";
import type { WritingTaskId } from "../../../lib/writingFeedback";
import { AiScore } from "../speaking/AutoScore";
import { WritingFeedback } from "./SuggestedEdits";
import styles from "./WritingScore.module.css";

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
          <span className={styles.criterionName}>
            {criteria[i]?.name ?? `Criterion ${i + 1}`}
          </span>
          <ScorePips score={s.points} />
          <span className={styles.criterionPoints}>{s.points}/5</span>
          {s.note && <p className={styles.criterionNote}>{s.note}</p>}
        </li>
      ))}
    </ul>
  );
}

/**
 * A scored Writing response, read top-down: the score and one-line verdict,
 * each rubric point as pips, what to do next time, the template and edits on
 * the response itself, and the model's full write-up folded away at the end.
 * Replies from before the summary/criteria fields have only the prose, so it
 * starts open for them.
 */
export function WritingReport({
  taskId,
  question,
  text,
  score,
  reply,
}: {
  taskId: WritingTaskId;
  question: unknown;
  text: string;
  score: number;
  reply: string;
}) {
  const { summary, tips } = parseWritingNotes(reply);
  const structured =
    summary !== null ||
    tips.length > 0 ||
    parseWritingCriteria(reply).length > 0;
  return (
    <div className={styles.report}>
      <div className={styles.verdict}>
        <p className={styles.score}>
          {score}
          <span>/ 5</span>
        </p>
        <div className={styles.verdictText}>
          <ScorePips score={score} />
          {summary && <p className={styles.summary}>{summary}</p>}
        </div>
      </div>
      <WritingCriteria taskId={taskId} question={question} reply={reply} />
      {tips.length > 0 && (
        <section className={styles.block} aria-label="Next time">
          <p className="micro-label">Next time</p>
          <ol className={styles.tips}>
            {tips.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ol>
        </section>
      )}
      <WritingFeedback taskId={taskId} text={text} reply={reply} />
      <details className={styles.full} open={!structured}>
        <summary>Full feedback</summary>
        <Prose text={stripScoreBlock(reply)} className={styles.feedback} />
      </details>
    </div>
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
      {r.itemScore !== undefined && r.aiReply ? (
        <WritingReport
          taskId={taskId}
          question={question}
          text={r.text ?? ""}
          score={r.itemScore}
          reply={r.aiReply}
        />
      ) : r.itemScore !== undefined ? (
        <p className={styles.score}>
          {r.itemScore}
          <span>/ 5</span>
        </p>
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

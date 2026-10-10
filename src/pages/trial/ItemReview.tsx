import { Link } from "react-router-dom";
import {
  ChoiceQuestionCard,
  type ChoiceQuestion,
} from "../../components/question/QuestionStepper";
import type { TaskId } from "../../hooks/useScoreHistory";
import { useAttemptUpdater } from "../../hooks/useAutoScore";
import {
  buildInterviewQaCopyMessage,
  buildWritingTaskMessage,
  WRITING_SCORE_NOTE,
} from "../../lib/answerSubmission";
import type { Attempt } from "../../lib/attempts";
import {
  parseAiScores,
  parseWritingScore,
  stripScoreBlock,
  withInterviewAi,
  withWritingAi,
} from "../../lib/interviewScoring";
import { pendingAiResponses } from "../../lib/trial";
import type { CompleteWordsItem } from "../toefl/reading/completeWords";
import type { DailyLifeData } from "../toefl/reading/dailyLife";
import { DailyLifeTextView } from "../toefl/reading/DailyLifeTextView";
import { isCorrectOrder } from "../toefl/writing/buildSentence";
import { AiScore } from "../toefl/speaking/AutoScore";
import {
  INTERVIEW_TYPE_LABELS,
  type InterviewProblemData,
} from "../toefl/speaking/interviewTypes";
import styles from "./Trial.module.css";

/* Question files are untyped JSON; these are the fields the review reads. */
interface ChoiceData {
  title?: string;
  passage?: string;
  transcript?: string;
  questions: ChoiceQuestion[];
}
/** Options keyed by letter, as the TOEIC files and Choose a Response store them. */
interface LetterQuestion {
  id: string;
  stem: string;
  options: Record<string, string>;
  correct: string;
  explanation: string;
}
interface ResponseData {
  questions: LetterQuestion[];
}
interface EmailData {
  scenario: { description: string; recipient: string; keyPoints: string[] };
  modelAnswer: string;
  rubric: { criterion: string; description: string }[];
}
interface DiscussionData {
  professorQuestion: string;
  student1: { name: string; response: string };
  student2: { name: string; response: string };
  modelAnswer: string;
  evaluationPoints: string[];
}
interface SentenceData {
  sentences: {
    id: string;
    chunks: string[];
    correctOrder: number[];
    fullSentence: string;
  }[];
}

const noop = () => undefined;

const GONE = "This question is no longer available.";

function choicesOf(attempt: Attempt | undefined): Map<string, number> {
  return new Map(
    (attempt?.responses ?? []).flatMap((r) =>
      r.itemId !== undefined && typeof r.choice === "number"
        ? [[r.itemId, r.choice]]
        : [],
    ),
  );
}

function Choices({
  questions,
  choices,
}: {
  questions: ChoiceQuestion[];
  choices: Map<string, number>;
}) {
  return (
    <div className={styles.reviewList}>
      {questions.map((q, i) => (
        <ChoiceQuestionCard
          key={q.id}
          question={q}
          index={i}
          total={questions.length}
          selected={choices.get(q.id)}
          graded
          onSelect={noop}
        />
      ))}
    </div>
  );
}

/** Letter-keyed options shown through the same graded card as the rest. */
function LetterChoices({
  questions,
  attempt,
}: {
  questions: LetterQuestion[];
  attempt: Attempt | undefined;
}) {
  const picked = new Map(
    (attempt?.responses ?? []).map((r) => [r.itemId, String(r.choice)]),
  );
  const choices = new Map<string, number>();
  const cards = questions.map((q) => {
    const keys = Object.keys(q.options);
    const selected = keys.indexOf(picked.get(q.id) ?? "");
    if (selected >= 0) choices.set(q.id, selected);
    return {
      id: q.id,
      stem: q.stem,
      options: Object.values(q.options),
      correctIndex: keys.indexOf(q.correct),
      explanation: q.explanation,
    };
  });
  return <Choices questions={cards} choices={choices} />;
}

function Source({ label, text }: { label: string; text?: string }) {
  if (!text) return null;
  return (
    <details className={styles.source}>
      <summary>{label}</summary>
      {text.split(/\n+/).map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </details>
  );
}

/**
 * AI scoring for whatever in this attempt is still unscored: automatic with
 * the user's AI Gateway key, otherwise copy and paste.
 */
export function AiScoring({
  taskId,
  attempt,
  question,
  onChange,
  autoScore,
}: {
  taskId: TaskId;
  attempt: Attempt;
  question: unknown;
  onChange: (next: Attempt) => void;
  /** False waits for a click instead of spending the user's credits. */
  autoScore: boolean;
}) {
  const update = useAttemptUpdater(attempt, onChange);
  const pending = pendingAiResponses(attempt);
  if (pending.length === 0) return null;
  if (question === null && attempt.question === undefined) {
    return <p className={styles.note}>{GONE}</p>;
  }

  if (taskId === "toefl/speaking/interview") {
    const data = (attempt.question ?? question) as InterviewProblemData;
    return (
      <>
        {pending.map((i) => {
          const q = data.questions[i];
          return (
            <div key={i} className={styles.scoreItem}>
              <p className="micro-label">Interview question {i + 1}</p>
              <AiScore
                message={buildInterviewQaCopyMessage({
                  question: q.question,
                  userAnswer: attempt.responses[i].transcript ?? "",
                  modelAnswer: q.modelAnswer,
                  evaluationPoints: q.evaluationPoints,
                  questionType: INTERVIEW_TYPE_LABELS[q.type] ?? q.type,
                })}
                parse={parseAiScores}
                autoStart={autoScore}
                onApply={(ai) => update((a) => withInterviewAi(a, i, ai))}
              />
            </div>
          );
        })}
      </>
    );
  }

  if (taskId !== "toefl/writing/email" && taskId !== "toefl/writing/discussion")
    return null;
  return (
    <div className={styles.scoreItem}>
      <AiScore
        message={buildWritingTaskMessage(
          taskId,
          question,
          attempt.responses[0].text ?? "",
        )}
        parse={parseWritingScore}
        note={WRITING_SCORE_NOTE}
        autoStart={autoScore}
        onApply={(ai) => update((a) => withWritingAi(a, ai))}
      />
    </div>
  );
}

/** The question beside what was answered, after the test. */
export function ItemReview({
  taskId,
  attempt,
  question,
  onChange,
  autoScore,
}: {
  taskId: TaskId;
  attempt: Attempt | undefined;
  question: unknown;
  onChange: (next: Attempt) => void;
  autoScore: boolean;
}) {
  if (question === undefined) return <p className={styles.note}>Loading…</p>;
  // null: the file failed to load, e.g. a question removed from the pool
  // after the test; the rest of the report must still render.
  if (question === null) return <p className={styles.note}>{GONE}</p>;

  switch (taskId) {
    case "toefl/reading/academic": {
      const d = question as ChoiceData;
      return (
        <>
          <Source label="Passage" text={d.passage} />
          <Choices questions={d.questions} choices={choicesOf(attempt)} />
        </>
      );
    }
    case "toefl/listening/conversation":
    case "toefl/listening/announcement":
    case "toefl/listening/lecture":
    case "toeic/part3":
    case "toeic/part4": {
      const d = question as ChoiceData;
      return (
        <>
          <Source label="Transcript" text={d.transcript} />
          <Choices questions={d.questions} choices={choicesOf(attempt)} />
        </>
      );
    }
    case "toefl/reading/daily-life": {
      const d = question as DailyLifeData;
      const choices = choicesOf(attempt);
      return (
        <>
          {d.texts.map((t) => (
            <div key={t.id}>
              <details className={styles.source}>
                <summary>Text</summary>
                <DailyLifeTextView text={t} />
              </details>
              <Choices questions={t.questions} choices={choices} />
            </div>
          ))}
        </>
      );
    }
    case "toefl/listening/response":
    case "toeic/part2": {
      const d = question as ResponseData;
      return (
        <LetterChoices
          questions={d.questions.map((q) => ({ ...q, stem: `“${q.stem}”` }))}
          attempt={attempt}
        />
      );
    }
    case "toeic/part5": {
      const d = question as {
        questions: (LetterQuestion & { sentence: string })[];
      };
      return (
        <LetterChoices
          questions={d.questions.map((q) => ({ ...q, stem: q.sentence }))}
          attempt={attempt}
        />
      );
    }
    case "toeic/part6": {
      const d = question as {
        passages: {
          id: string;
          text: string;
          questions: (LetterQuestion & { blankNumber: number })[];
        }[];
      };
      return (
        <>
          {d.passages.map((p) => (
            <div key={p.id}>
              <Source label="Text" text={p.text} />
              <LetterChoices
                questions={p.questions.map((q) => ({
                  ...q,
                  stem: `Blank ${q.blankNumber}`,
                }))}
                attempt={attempt}
              />
            </div>
          ))}
        </>
      );
    }
    case "toeic/part7": {
      const d = question as {
        passages: { id: string; title?: string; content: string }[];
        questions: LetterQuestion[];
      };
      return (
        <>
          {d.passages.map((p) => (
            <Source key={p.id} label={p.title ?? "Text"} text={p.content} />
          ))}
          <LetterChoices questions={d.questions} attempt={attempt} />
        </>
      );
    }
    case "toefl/reading/complete-words": {
      const items = (question as { items: CompleteWordsItem[] }).items;
      const typed = new Map(
        (attempt?.responses ?? []).map((r) => [r.itemId, r.text ?? ""]),
      );
      return (
        <table className={styles.reviewTable}>
          <thead>
            <tr>
              <th>Answer</th>
              <th>Yours</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => {
              const yours = typed.get(String(it.index)) ?? "";
              const full = it.answer
                .toLowerCase()
                .startsWith(it.hint.toLowerCase())
                ? it.hint + yours
                : yours;
              const ok = full.toLowerCase() === it.answer.toLowerCase();
              return (
                <tr key={it.index}>
                  <td>{it.answer}</td>
                  <td className={ok ? styles.ok : styles.wrong}>
                    {yours ? full : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      );
    }
    case "toefl/writing/build-sentence": {
      const d = question as SentenceData;
      return (
        <table className={styles.reviewTable}>
          <tbody>
            {d.sentences.map((s, i) => {
              const order = attempt?.responses[i]?.order ?? [];
              const yours = order
                .map((c) => (c === null ? "___" : s.chunks[c]))
                .join(" ");
              return (
                <tr key={s.id}>
                  <td>
                    <span className={styles.reviewLabel}>Answer</span>
                    {s.fullSentence}
                    <br />
                    <span className={styles.reviewLabel}>Yours</span>
                    <span
                      className={
                        isCorrectOrder(order, s.correctOrder)
                          ? styles.ok
                          : styles.wrong
                      }
                    >
                      {yours || "—"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      );
    }
    case "toefl/writing/email":
    case "toefl/writing/discussion": {
      const d = question as EmailData & DiscussionData;
      const r = attempt?.responses[0];
      return (
        <div className={styles.reviewList}>
          <Source
            label="Task"
            text={
              taskId === "toefl/writing/email"
                ? d.scenario.description
                : d.professorQuestion
            }
          />
          <section>
            <h4 className={styles.reviewHeading}>Your response</h4>
            <p className={styles.prose}>{r?.text || "—"}</p>
          </section>
          {r?.aiReply && (
            <section>
              <h4 className={styles.reviewHeading}>AI feedback</h4>
              <p className={styles.prose}>{stripScoreBlock(r.aiReply)}</p>
            </section>
          )}
          {attempt && (
            <AiScoring
              taskId={taskId}
              attempt={attempt}
              question={question}
              onChange={onChange}
              autoScore={autoScore}
            />
          )}
          <Source label="Model answer" text={d.modelAnswer} />
        </div>
      );
    }
    case "dictation": {
      const d = question as { sentences: { id: string; text: string }[] };
      const misses = new Map(
        (attempt?.responses ?? []).map((r) => [r.itemId, r.misses ?? 0]),
      );
      return (
        <table className={styles.reviewTable}>
          <thead>
            <tr>
              <th>Sentence</th>
              <th>Wrong taps</th>
            </tr>
          </thead>
          <tbody>
            {d.sentences.map((s) => {
              const m = misses.get(s.id) ?? 0;
              return (
                <tr key={s.id}>
                  <td>{s.text}</td>
                  <td className={m > 0 ? styles.wrong : styles.ok}>{m}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      );
    }
    case "toefl/speaking/listen-repeat":
    case "toefl/speaking/interview":
      return (
        <div className={styles.reviewList}>
          {attempt && (
            <AiScoring
              taskId={taskId}
              attempt={attempt}
              question={question}
              onChange={onChange}
              autoScore={autoScore}
            />
          )}
          {attempt ? (
            <Link to={`/results/${attempt.id}`} className={styles.quietLink}>
              Open the full result: recordings, transcripts and sample answers
            </Link>
          ) : (
            <p className={styles.note}>Not answered.</p>
          )}
        </div>
      );
    default:
      return null;
  }
}

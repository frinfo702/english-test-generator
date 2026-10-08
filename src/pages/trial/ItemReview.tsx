import { Link } from "react-router-dom";
import {
  ChoiceQuestionCard,
  type ChoiceQuestion,
} from "../../components/question/QuestionStepper";
import type { TaskId } from "../../hooks/useScoreHistory";
import {
  buildInterviewQaCopyMessage,
  buildWritingCopyMessage,
} from "../../lib/answerSubmission";
import type { Attempt } from "../../lib/attempts";
import {
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
import { AiScorePanel } from "../toefl/speaking/AiScorePanel";
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
interface ResponseData {
  questions: {
    id: string;
    stem: string;
    options: Record<string, string>;
    correct: string;
    explanation: string;
  }[];
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

/** Copy-and-paste AI scoring for whatever in this attempt is still unscored. */
export function AiScoring({
  taskId,
  attempt,
  question,
  onChange,
}: {
  taskId: TaskId;
  attempt: Attempt;
  question: unknown;
  onChange: (next: Attempt) => void;
}) {
  const pending = pendingAiResponses(attempt);
  if (pending.length === 0) return null;

  if (taskId === "toefl/speaking/interview") {
    const data = (attempt.question ?? question) as InterviewProblemData;
    return (
      <>
        {pending.map((i) => {
          const q = data.questions[i];
          return (
            <div key={i} className={styles.scoreItem}>
              <p className="micro-label">Interview question {i + 1}</p>
              <AiScorePanel
                message={buildInterviewQaCopyMessage({
                  question: q.question,
                  userAnswer: attempt.responses[i].transcript ?? "",
                  modelAnswer: q.modelAnswer,
                  evaluationPoints: q.evaluationPoints,
                  questionType: INTERVIEW_TYPE_LABELS[q.type] ?? q.type,
                })}
                onApply={(ai) => onChange(withInterviewAi(attempt, i, ai))}
              />
            </div>
          );
        })}
      </>
    );
  }

  const text = attempt.responses[0].text ?? "";
  const message =
    taskId === "toefl/writing/email"
      ? (() => {
          const d = question as EmailData;
          return buildWritingCopyMessage({
            task: "Write an Email",
            prompt: `${d.scenario.description}\nWrite an email to ${d.scenario.recipient}. In your email, do the following:\n${d.scenario.keyPoints.map((p) => `- ${p}`).join("\n")}`,
            userAnswer: text,
            modelAnswer: d.modelAnswer,
            criteria: d.rubric.map((r) => `${r.criterion}: ${r.description}`),
          });
        })()
      : (() => {
          const d = question as DiscussionData;
          return buildWritingCopyMessage({
            task: "Write for an Academic Discussion",
            prompt: `Professor: ${d.professorQuestion}\n${d.student1.name}: ${d.student1.response}\n${d.student2.name}: ${d.student2.response}`,
            userAnswer: text,
            modelAnswer: d.modelAnswer,
            criteria: d.evaluationPoints,
          });
        })();
  return (
    <div className={styles.scoreItem}>
      <AiScorePanel
        message={message}
        parse={parseWritingScore}
        note="1. Copy the prompt into your AI chat. 2. Paste its whole reply here. The AI scores your response on the 0–5 TOEFL rubric."
        onApply={(ai) => onChange(withWritingAi(attempt, ai))}
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
}: {
  taskId: TaskId;
  attempt: Attempt | undefined;
  question: unknown;
  onChange: (next: Attempt) => void;
}) {
  if (question === undefined) return <p className={styles.note}>Loading…</p>;

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
    case "toefl/listening/lecture": {
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
    case "toefl/listening/response": {
      const d = question as ResponseData;
      const picked = new Map(
        (attempt?.responses ?? []).map((r) => [r.itemId, String(r.choice)]),
      );
      const questions = d.questions.map((q) => {
        const keys = Object.keys(q.options);
        return {
          q: {
            id: q.id,
            stem: `“${q.stem}”`,
            options: Object.values(q.options),
            correctIndex: keys.indexOf(q.correct),
            explanation: q.explanation,
          },
          selected: picked.has(q.id) ? keys.indexOf(picked.get(q.id)!) : -1,
        };
      });
      return (
        <Choices
          questions={questions.map((x) => x.q)}
          choices={
            new Map(
              questions
                .filter((x) => x.selected >= 0)
                .map((x) => [x.q.id, x.selected]),
            )
          }
        />
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
            />
          )}
          <Source label="Model answer" text={d.modelAnswer} />
        </div>
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

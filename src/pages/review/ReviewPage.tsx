import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { SectionHeader } from "../../components/layout/SectionHeader";
import { PixelHamster } from "../../components/pixel/PixelHamster";
import { Button } from "../../components/ui/Button";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { PixelArrowIcon } from "../../components/ui/PixelArrowIcon";
import type { TaskId } from "../../hooks/useScoreHistory";
import { getAllAttempts, putAttempts, type Attempt } from "../../lib/attempts";
import { fetchQuestionByIdWithMeta } from "../../lib/questions";
import {
  buildReviewItems,
  difficultyOf,
  dueItems,
  filterItems,
  isDue,
  RECALL_PATH,
  sectionOf,
  sortItems,
  testOf,
  toSort,
  type Difficulty,
  type ReviewFilter,
  type ReviewItem,
  type Test,
} from "../../lib/review";
import { readingGrade } from "../../lib/trial";
import { ItemReview } from "../trial/ItemReview";
import { TASK_NAMES } from "../trial/taskNames";
import styles from "./ReviewPage.module.css";

const DAY = 86_400_000;
const TEST_NAMES: Record<Test, string> = {
  toefl: "TOEFL",
  toeic: "TOEIC",
  other: "Extra",
};

const typeName = (taskId: TaskId) =>
  `${TEST_NAMES[testOf(taskId)]} · ${TASK_NAMES[taskId] ?? taskId}`;

const shortDate = (iso: string) => new Date(iso).toLocaleDateString();

function dueLabel(item: ReviewItem, now: Date): string {
  if (!item.card) return "—";
  if (isDue(item, now)) return "Due";
  return `in ${Math.ceil((item.card.due.getTime() - now.getTime()) / DAY)}d`;
}

async function loadReview() {
  const items = buildReviewItems(await getAllAttempts());
  // Most recently answered first.
  items.sort((a, b) => (a.latest.date < b.latest.date ? 1 : -1));
  return { items, now: new Date() };
}

export function ReviewPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [loaded, setLoaded] = useState<{ items: ReviewItem[]; now: Date }>();
  const [error, setError] = useState<string | null>(null);
  // undefined while loading, null when the file is gone.
  const [questions, setQuestions] = useState<Map<string, unknown>>(new Map());

  const reload = useCallback(
    () =>
      loadReview().then(setLoaded, (e: unknown) =>
        setError(e instanceof Error ? e.message : String(e)),
      ),
    [],
  );
  useEffect(() => void reload(), [reload]);

  // One read per question, for its difficulty and its review.
  useEffect(() => {
    if (!loaded) return;
    let cancelled = false;
    Promise.all(
      loaded.items.map(async (i) => {
        const snapshot = [...i.attempts]
          .reverse()
          .find((a) => a.question)?.question;
        const data =
          snapshot ??
          (await fetchQuestionByIdWithMeta<unknown>(i.taskId, i.problemId)
            .then((q) => q.data)
            .catch(() => null));
        return [i.key, data] as const;
      }),
    ).then((entries) => !cancelled && setQuestions(new Map(entries)));
    return () => {
      cancelled = true;
    };
  }, [loaded]);

  const difficulty = useMemo(() => {
    const m = new Map<string, Difficulty>();
    questions.forEach((q, key) => {
      if (q) m.set(key, difficultyOf(readingGrade(q)));
    });
    return m;
  }, [questions]);

  const filter: ReviewFilter = {
    test: (params.get("test") || undefined) as Test | undefined,
    section: (params.get("section") || undefined) as
      ReviewFilter["section"] | undefined,
    taskId: (params.get("type") || undefined) as TaskId | undefined,
    difficulty: (params.get("difficulty") || undefined) as
      Difficulty | undefined,
    minMistakes: Number(params.get("mistakes")) || undefined,
    result: (params.get("result") || undefined) as
      ReviewFilter["result"] | undefined,
    dueOnly: params.get("due") === "1",
  };
  const sort = toSort(params.get("sort"));
  // In the URL, so coming back from a question keeps the filters.
  const setParam = (key: string, value: string) =>
    setParams(
      (p) => {
        if (value) p.set(key, value);
        else p.delete(key);
        return p;
      },
      { replace: true },
    );

  if (error) return <p role="alert">{error}</p>;
  if (!loaded) return <LoadingSpinner message="Loading your answers..." />;

  const { items, now } = loaded;
  const due = dueItems(items, now);
  const shown = sortItems(filterItems(items, filter, now, difficulty), sort);
  const types = [...new Set(items.map((i) => i.taskId))].sort();

  const update = (next: Attempt) =>
    putAttempts([next]).then(reload, (e: unknown) =>
      setError(e instanceof Error ? e.message : "Failed to save."),
    );

  return (
    <div>
      <SectionHeader
        title="Review"
        subtitle="Every reading and listening question you've answered, with what's due to recall."
        backTo="/"
      />

      <div className={styles.perch}>
        <PixelHamster className={styles.hamster} />
        <dl className={styles.summary}>
          <div>
            <dt>Answered</dt>
            <dd>{items.length}</dd>
          </div>
          <div>
            <dt>Due now</dt>
            <dd>{due.length}</dd>
          </div>
          <div>
            <dt>With mistakes</dt>
            <dd>{items.filter((i) => i.mistakes > 0).length}</dd>
          </div>
        </dl>
      </div>

      <div className={styles.recallRow}>
        <Button
          disabled={due.length === 0}
          onClick={() => navigate(RECALL_PATH + due[0].key)}
        >
          {due.length === 0 ? "Nothing due" : `Start recall · ${due.length}`}
          {due.length > 0 && <PixelArrowIcon />}
        </Button>
        <p className={styles.hint}>
          Recall brings questions back on an FSRS schedule. Full marks pushes a
          question further out; a miss brings it back sooner.
        </p>
      </div>

      {items.length === 0 ? (
        <p className={styles.hint}>
          Nothing answered yet. Questions appear here once you finish one.
        </p>
      ) : (
        <>
          <div
            className={styles.filters}
            role="group"
            aria-label="Filter questions"
          >
            <Select
              label="Test"
              value={filter.test}
              onChange={(v) => setParam("test", v)}
              options={[
                ["toefl", "TOEFL"],
                ["toeic", "TOEIC"],
                ["other", "Extra"],
              ]}
            />
            <Select
              label="Section"
              value={filter.section}
              onChange={(v) => setParam("section", v)}
              options={[
                ["reading", "Reading"],
                ["listening", "Listening"],
              ]}
            />
            <Select
              label="Question type"
              value={filter.taskId}
              onChange={(v) => setParam("type", v)}
              options={types.map((t) => [t, typeName(t)])}
            />
            <Select
              label="Difficulty"
              value={filter.difficulty}
              onChange={(v) => setParam("difficulty", v)}
              options={[
                ["easy", "Easy"],
                ["medium", "Medium"],
                ["hard", "Hard"],
              ]}
            />
            <Select
              label="Mistakes"
              value={filter.minMistakes ? String(filter.minMistakes) : ""}
              onChange={(v) => setParam("mistakes", v)}
              options={[
                ["1", "1 or more"],
                ["2", "2 or more"],
                ["3", "3 or more"],
              ]}
            />
            <Select
              label="Result"
              value={filter.result}
              onChange={(v) => setParam("result", v)}
              options={[
                ["correct", "Solved"],
                ["incorrect", "Unsolved"],
              ]}
            />
            <label className={styles.select}>
              <span className="micro-label">Sort</span>
              <select
                value={sort}
                onChange={(e) =>
                  setParam(
                    "sort",
                    e.target.value === "mistakes" ? "" : e.target.value,
                  )
                }
              >
                <option value="mistakes">Most mistakes</option>
                <option value="accuracy">Lowest accuracy</option>
                <option value="recent-wrong">Recently wrong</option>
                <option value="due">Due soonest</option>
              </select>
            </label>
            <label className={styles.check}>
              <input
                type="checkbox"
                checked={filter.dueOnly}
                onChange={(e) => setParam("due", e.target.checked ? "1" : "")}
              />
              Due for recall
            </label>
          </div>

          <p className={styles.count}>
            {shown.length} of {items.length} questions
          </p>

          <div className={styles.head} aria-hidden="true">
            <span>Question</span>
            <span>Result</span>
            <span>Tries</span>
            <span>Missed</span>
            <span>Last</span>
            <span>Recall</span>
          </div>
          <ol className={styles.rows}>
            {shown.map((i) => (
              <Row
                key={i.key}
                item={i}
                now={now}
                question={questions.get(i.key)}
                onChange={update}
              />
            ))}
          </ol>
        </>
      )}
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string | undefined;
  onChange: (value: string) => void;
  options: [string, string][];
}) {
  return (
    <label className={styles.select}>
      <span className="micro-label">{label}</span>
      <select value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
        <option value="">All</option>
        {options.map(([v, text]) => (
          <option key={v} value={v}>
            {text}
          </option>
        ))}
      </select>
    </label>
  );
}

const scoreText = (a: Attempt) =>
  a.score ? `${a.score.correct}/${a.score.total}` : "Not scored";

function Row({
  item,
  now,
  question,
  onChange,
}: {
  item: ReviewItem;
  now: Date;
  question: unknown;
  onChange: (next: Attempt) => void;
}) {
  const scored = [...item.attempts].reverse().find((a) => a.score);
  const hue =
    testOf(item.taskId) === "toeic"
      ? "--color-toeic"
      : `--color-${sectionOf(item.taskId)}`;
  return (
    <li>
      <details className={styles.row}>
        <summary>
          <span className={styles.name}>
            <span
              className={styles.mark}
              style={{ background: `var(${hue})` }}
              aria-hidden="true"
            />
            {typeName(item.taskId)}
            <span className={styles.id}>#{item.problemId}</span>
          </span>
          <Cell label="Result">
            <span
              className={
                item.correct === null
                  ? undefined
                  : item.correct
                    ? styles.ok
                    : styles.wrong
              }
            >
              {scored ? scoreText(scored) : "Not scored"}
            </span>
          </Cell>
          <Cell label="Tries">{item.attempts.length}</Cell>
          <Cell label="Missed">{item.mistakes}</Cell>
          <Cell label="Last">{shortDate(item.latest.date)}</Cell>
          <Cell label="Recall">
            <span className={isDue(item, now) ? styles.due : undefined}>
              {dueLabel(item, now)}
            </span>
          </Cell>
        </summary>
        <div className={styles.body}>
          <p className={styles.history}>
            {item.attempts.map((a) => (
              <span key={a.id}>
                {shortDate(a.date)} {scoreText(a)}
              </span>
            ))}
          </p>
          <ItemReview
            taskId={item.taskId}
            attempt={item.latest}
            question={question}
            onChange={onChange}
          />
          <div className={styles.actions}>
            <Link to={`/${item.key}`} className={styles.action}>
              Answer again <PixelArrowIcon />
            </Link>
          </div>
        </div>
      </details>
    </li>
  );
}

/** The label repeats per cell so the row still reads on a phone. */
function Cell({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span className={styles.cell}>
      <span className={styles.cellLabel}>{label}</span>
      {children}
    </span>
  );
}

/**
 * Wraps a practice page during recall: the page answers and saves as usual,
 * which reschedules the question, and this bar moves on to the next due one.
 */
export function RecallFrame({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { pathname, state } = useLocation();
  const current = pathname.slice(RECALL_PATH.length);
  // Served this session, so a skipped question doesn't come straight back.
  const seen: string[] = [
    ...((state as { seen?: string[] } | null)?.seen ?? []),
    current,
  ];
  const [left, setLeft] = useState<ReviewItem[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    getAllAttempts()
      .then((a) => dueItems(buildReviewItems(a), new Date()))
      .then(
        (due) => !cancelled && setLeft(due),
        () => !cancelled && setLeft([]),
      );
    return () => {
      cancelled = true;
    };
  }, [current]);

  const queue = (left ?? []).filter((i) => !seen.includes(i.key));
  const next = async () => {
    // Fresh read: the answer just given may have changed what is due.
    const due = dueItems(buildReviewItems(await getAllAttempts()), new Date());
    const upcoming = due.find((i) => !seen.includes(i.key));
    if (upcoming) navigate(RECALL_PATH + upcoming.key, { state: { seen } });
    else navigate("/review");
  };

  return (
    <>
      <div className={styles.recallBar} role="region" aria-label="Recall">
        <span className="micro-label">Recall</span>
        <span className={styles.recallLeft}>
          {left === null
            ? ""
            : queue.length === 0
              ? "Last due question"
              : `${queue.length} more due`}
        </span>
        <Button size="sm" variant="secondary" onClick={next}>
          {left !== null && queue.length === 0 ? "Finish" : "Next due"}
          <PixelArrowIcon />
        </Button>
        <Link to="/review" className={styles.action}>
          End recall
        </Link>
      </div>
      {children}
    </>
  );
}

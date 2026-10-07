import { useEffect, useRef, type ReactNode } from "react";
import { Button } from "../ui/Button";
import { FeedbackPanel } from "../ui/FeedbackPanel";
import { PixelArrowIcon } from "../ui/PixelArrowIcon";
import { PixelCheckIcon } from "../ui/PixelCheckIcon";
import styles from "./QuestionStepper.module.css";

// Shared by the split-view reading tasks: the passage stays on the left
// while the right pane shows one multiple-choice question at a time.

export interface ChoiceQuestion {
  id: string;
  stem: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface SplitViewProps {
  left: ReactNode;
  right: ReactNode;
  /** Changes when the left pane shows a different passage. */
  leftKey?: string;
}

export function SplitView({ left, right, leftKey }: SplitViewProps) {
  const ref = useRef<HTMLDivElement>(null);

  // On narrow screens the passage sits above the question; bring a new
  // passage into view when the set moves on to it.
  useEffect(() => {
    const el = ref.current;
    if (el && el.getBoundingClientRect().top < 0) {
      el.scrollIntoView({ block: "start" });
    }
  }, [leftKey]);

  return (
    <div className={styles.split} ref={ref}>
      <div className={styles.leftPane}>{left}</div>
      <div className={styles.rightPane}>{right}</div>
    </div>
  );
}

function cleanOptionText(text: string): string {
  return text.replace(/^[A-Da-d][.)]\s*/, "");
}

interface ChoiceQuestionCardProps {
  question: ChoiceQuestion;
  index: number;
  total: number;
  /** Extra position info, e.g. "Text 2 of 3". */
  context?: string;
  typeLabel?: string;
  selected: number | undefined;
  graded: boolean;
  onSelect: (questionId: string, optionIndex: number) => void;
}

export function ChoiceQuestionCard({
  question: q,
  index,
  total,
  context,
  typeLabel,
  selected,
  graded,
  onSelect,
}: ChoiceQuestionCardProps) {
  return (
    <div className={styles.qBlock}>
      <div className={styles.qHeader}>
        <span className={styles.qNum}>{index + 1}</span>
        <span className={styles.qMeta}>
          Question {index + 1} of {total}
          {context && ` · ${context}`}
        </span>
        {typeLabel && <span className={styles.qType}>{typeLabel}</span>}
      </div>
      <p className={styles.stem}>{q.stem}</p>
      <div className={styles.options} role="radiogroup">
        {q.options.map((opt, i) => (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={selected === i}
            className={[
              styles.option,
              selected === i ? styles.selected : "",
              graded && i === q.correctIndex ? styles.correctOpt : "",
              graded && selected === i && i !== q.correctIndex
                ? styles.wrongOpt
                : "",
            ].join(" ")}
            onClick={() => onSelect(q.id, i)}
          >
            <span className={styles.optLabel}>
              {String.fromCharCode(65 + i)}
            </span>
            {cleanOptionText(opt)}
          </button>
        ))}
      </div>
      {graded && (
        <FeedbackPanel
          correct={selected === q.correctIndex}
          explanation={q.explanation}
          correctAnswer={`(${String.fromCharCode(
            65 + q.correctIndex,
          )}) ${cleanOptionText(q.options[q.correctIndex])}`}
        />
      )}
    </div>
  );
}

interface QuestionNavProps {
  /** Questions in order, grouped (one group per passage/text). */
  groups: ChoiceQuestion[][];
  answers: Record<string, number>;
  currentIndex: number;
  graded: boolean;
  onGo: (index: number) => void;
  onSubmit: () => void;
}

/** Back / numbered jump buttons / Next, with Submit on the last question. */
export function QuestionNav({
  groups,
  answers,
  currentIndex,
  graded,
  onGo,
  onSubmit,
}: QuestionNavProps) {
  const total = groups.reduce((n, g) => n + g.length, 0);
  const isLast = currentIndex >= total - 1;
  const starts = groups.map((_, g) =>
    groups.slice(0, g).reduce((n, prev) => n + prev.length, 0),
  );

  return (
    <nav className={styles.navBar} aria-label="Questions">
      <Button
        variant="secondary"
        onClick={() => onGo(currentIndex - 1)}
        disabled={currentIndex === 0}
        aria-label="Previous question"
      >
        <PixelArrowIcon direction="left" />
        Back
      </Button>

      <div className={styles.navGroups}>
        {groups.map((group, g) => {
          const start = starts[g];
          return (
            <div key={g} className={styles.navGroup}>
              {group.map((q, j) => {
                const i = start + j;
                const answered = answers[q.id] !== undefined;
                const correct = answers[q.id] === q.correctIndex;
                return (
                  <button
                    key={q.id}
                    type="button"
                    className={[
                      styles.navDot,
                      i === currentIndex ? styles.navCurrent : "",
                      !graded && answered ? styles.navAnswered : "",
                      graded && correct ? styles.navCorrect : "",
                      graded && !correct ? styles.navWrong : "",
                    ].join(" ")}
                    onClick={() => onGo(i)}
                    aria-label={`Question ${i + 1}${answered ? ", answered" : ""}`}
                    aria-current={i === currentIndex ? "step" : undefined}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {isLast && !graded ? (
        <Button onClick={onSubmit}>
          Submit
          <PixelCheckIcon />
        </Button>
      ) : (
        <Button
          variant={graded ? "secondary" : "primary"}
          onClick={() => onGo(currentIndex + 1)}
          disabled={isLast}
          aria-label="Next question"
        >
          Next
          <PixelArrowIcon />
        </Button>
      )}
    </nav>
  );
}

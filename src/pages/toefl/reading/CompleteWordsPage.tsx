import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { SectionHeader } from "../../../components/layout/SectionHeader";
import { Button } from "../../../components/ui/Button";
import { LoadingSpinner } from "../../../components/ui/LoadingSpinner";
import { FloatingElapsedTimer } from "../../../components/ui/FloatingElapsedTimer";
import { useElapsedTimer } from "../../../hooks/useElapsedTimer";
import { useQuestion } from "../../../hooks/useQuestion";
import { useScoreHistory } from "../../../hooks/useScoreHistory";
import styles from "./CompleteWordsPage.module.css";

interface Item {
  index: number;
  hint: string;
  answer: string;
  placeholder: string;
}

interface ProblemData {
  paragraph: string;
  items: Item[];
}

function getExpectedSuffix(item: Item): string {
  const answer = item.answer.trim();
  const hint = item.hint.trim();
  if (answer.toLowerCase().startsWith(hint.toLowerCase())) {
    return answer.slice(hint.length);
  }
  return answer;
}

export function CompleteWordsPage() {
  const navigate = useNavigate();
  const { questionNumber } = useParams<{ questionNumber: string }>();
  const { data, file, loading, error, loadByQuestionNumber } =
    useQuestion<ProblemData>("toefl/reading/complete-words");
  const { saveScore } = useScoreHistory();
  const {
    display,
    elapsedSeconds,
    running,
    start,
    stop,
    reset: resetTimer,
  } = useElapsedTimer();
  const [answers, setAnswers] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<{ correct: number; total: number } | null>(
    null,
  );
  const [focusedIdx, setFocusedIdx] = useState<number | null>(null);
  const inputRefs = useRef<Array<HTMLTextAreaElement | null>>([]);

  const parsedQuestionNumber = Number.parseInt(questionNumber ?? "", 10);
  const hasValidQuestionNumber =
    Number.isInteger(parsedQuestionNumber) && parsedQuestionNumber > 0;

  useEffect(() => {
    if (!hasValidQuestionNumber) return;
    loadByQuestionNumber(parsedQuestionNumber);
  }, [hasValidQuestionNumber, loadByQuestionNumber, parsedQuestionNumber]);

  useEffect(() => {
    if (data) {
      setAnswers(data.items.map(() => ""));
      setSubmitted(false);
      setScore(null);
      setFocusedIdx(null);
      inputRefs.current = [];
    }
  }, [data]);

  useEffect(() => {
    if (
      data &&
      !loading &&
      !submitted &&
      !running &&
      elapsedSeconds === 0
    ) {
      start();
    }
  }, [data, loading, submitted, running, elapsedSeconds, start]);

  useEffect(() => {
    if (focusedIdx !== null) {
      autoResize(focusedIdx);
    }
  }, [answers, focusedIdx]);

  const autoResize = (idx: number) => {
    const el = inputRefs.current[idx];
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  const findNextBlank = (fromIdx: number): number | null => {
    for (let i = fromIdx + 1; i < (data?.items.length ?? 0); i++) {
      if (getExpectedSuffix(data!.items[i]).length > 0) return i;
    }
    return null;
  };

  const findPrevBlank = (fromIdx: number): number | null => {
    for (let i = fromIdx - 1; i >= 0; i--) {
      if (getExpectedSuffix(data!.items[i]).length > 0) return i;
    }
    return null;
  };

  const handleSubmit = () => {
    if (!data) return;
    const sessionSeconds = stop();
    let correct = 0;
    data.items.forEach((item, i) => {
      const expectedSuffix = getExpectedSuffix(item);
      if (answers[i].toLowerCase() === expectedSuffix.toLowerCase()) correct++;
    });
    setScore({ correct, total: data.items.length });
    setSubmitted(true);
    setFocusedIdx(null);
    saveScore(
      "toefl/reading/complete-words",
      correct,
      data.items.length,
      sessionSeconds,
      file ?? undefined,
    );
  };

  const handleBackToList = () => {
    resetTimer();
    navigate("/toefl/reading/complete-words");
  };

  const handleAnswerChange = (idx: number, value: string) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (!data) return;
    const expectedLen = getExpectedSuffix(data.items[idx]).length;
    if (expectedLen === 0) return;

    if (e.key === "Tab" && !e.shiftKey) {
      e.preventDefault();
      const nextIdx = findNextBlank(idx);
      if (nextIdx !== null) {
        setFocusedIdx(nextIdx);
        requestAnimationFrame(() => {
          inputRefs.current[nextIdx]?.focus();
          inputRefs.current[nextIdx]?.setSelectionRange(
            answers[nextIdx]?.length ?? 0,
            answers[nextIdx]?.length ?? 0,
          );
        });
      }
    } else if (e.key === "Tab" && e.shiftKey) {
      e.preventDefault();
      const prevIdx = findPrevBlank(idx);
      if (prevIdx !== null) {
        setFocusedIdx(prevIdx);
        requestAnimationFrame(() => {
          inputRefs.current[prevIdx]?.focus();
          inputRefs.current[prevIdx]?.setSelectionRange(
            answers[prevIdx]?.length ?? 0,
            answers[prevIdx]?.length ?? 0,
          );
        });
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      const nextIdx = findNextBlank(idx);
      if (nextIdx !== null) {
        setFocusedIdx(nextIdx);
        requestAnimationFrame(() => {
          inputRefs.current[nextIdx]?.focus();
          inputRefs.current[nextIdx]?.setSelectionRange(
            answers[nextIdx]?.length ?? 0,
            answers[nextIdx]?.length ?? 0,
          );
        });
      }
    }
  };

  const renderParagraph = () => {
    if (!data) return null;
    const text = data.paragraph;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    data.items.forEach((item, itemIdx) => {
      const pos = text.indexOf(item.placeholder, lastIndex);
      if (pos === -1) return;
      const expectedSuffix = getExpectedSuffix(item);
      const userInput = answers[itemIdx] ?? "";
      const isCorrect =
        submitted &&
        userInput.toLowerCase() === expectedSuffix.toLowerCase();
      const isWrong = submitted && !isCorrect;
      const isFocused = focusedIdx === itemIdx;

      parts.push(
        <span key={`t${itemIdx}`}>{text.slice(lastIndex, pos)}</span>,
      );

      if (expectedSuffix.length > 0) {
        parts.push(
          <span
            key={`inp${itemIdx}`}
            className={[
              styles.blankWrapper,
              isFocused ? styles.blankFocused : "",
              submitted
                ? isCorrect
                  ? styles.blankCorrect
                  : styles.blankWrong
                : "",
            ].join(" ")}
          >
            <span className={styles.hint}>{item.hint}</span>
            <textarea
              ref={(el) => {
                inputRefs.current[itemIdx] = el;
              }}
              className={styles.blankInput}
              value={userInput}
              onChange={(e) => handleAnswerChange(itemIdx, e.target.value)}
              onFocus={() => setFocusedIdx(itemIdx)}
              onBlur={() => setFocusedIdx(null)}
              onKeyDown={(e) => handleKeyDown(itemIdx, e)}
              style={{ width: `${Math.max(expectedSuffix.length, 1)}ch` }}
              rows={1}
              maxLength={expectedSuffix.length * 2}
              autoComplete="off"
              spellCheck={false}
              disabled={submitted}
              aria-label={`Blank ${itemIdx + 1}`}
            />
          </span>,
        );
        if (isWrong) {
          parts.push(
            <span key={`hint${itemIdx}`} className={styles.correctHint}>
              {item.answer}
            </span>,
          );
        }
      } else {
        parts.push(
          <span key={`inp${itemIdx}`} className={styles.hint}>
            {item.hint}
          </span>,
        );
      }

      lastIndex = pos + item.placeholder.length;
    });

    parts.push(<span key="tail">{text.slice(lastIndex)}</span>);
    return parts;
  };

  const hasIncompleteAnswers =
    !data ||
    answers.length !== data.items.length ||
    answers.some((ans, idx) => {
      const expectedLength = getExpectedSuffix(data.items[idx]).length;
      return expectedLength > 0 && !ans.trim();
    });

  return (
    <div>
      {(running || elapsedSeconds > 0) && (
        <FloatingElapsedTimer display={display} running={running} />
      )}

      <SectionHeader
        title="Complete the Words"
        subtitle="Type only the missing continuation after the visible prefix. Tab / Enter to move between blanks."
        backTo="/toefl"
      />

      <div className={styles.topBar}>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleBackToList}
          disabled={loading}
        >
          Question List
        </Button>
      </div>

      {loading && <LoadingSpinner message="Loading question..." />}
      {error && (
        <div className={styles.error}>
          <p>{error}</p>
          <p className={styles.errorHint}>
            Generate question JSON with an AI agent and save it under
            questions/toefl/reading/complete-words/.
          </p>
        </div>
      )}
      {!hasValidQuestionNumber && (
        <div className={styles.error}>
          <p>Invalid question number in URL.</p>
        </div>
      )}

      {data && !loading && hasValidQuestionNumber && (
        <>
          <div className={styles.paragraph}>{renderParagraph()}</div>

          {!submitted ? (
            <Button onClick={handleSubmit} disabled={hasIncompleteAnswers}>
              Check Answers
            </Button>
          ) : (
            <div className={styles.result}>
              <div className={styles.scoreBox}>
                <span className={styles.scoreNum}>{score?.correct}</span>
                <span className={styles.scoreDen}>/{score?.total}</span>
                <span className={styles.scorePct}>
                  (
                  {Math.round(
                    ((score?.correct ?? 0) / (score?.total ?? 1)) * 100,
                  )}
                  %)
                </span>
              </div>
              <Button onClick={handleBackToList}>Back to Question List</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

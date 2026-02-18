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
  const { data, file, loading, error, loadByQuestionNumber } = useQuestion<ProblemData>(
    "toefl/reading/complete-words",
  );
  const { saveScore } = useScoreHistory();
  const {
    display,
    elapsedSeconds,
    running,
    start,
    stop,
    reset: resetTimer,
  } = useElapsedTimer();
  const [answers, setAnswers] = useState<string[][]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<{ correct: number; total: number } | null>(
    null,
  );
  const slotRefs = useRef<Record<number, Array<HTMLInputElement | null>>>({});

  const parsedQuestionNumber = Number.parseInt(questionNumber ?? "", 10);
  const hasValidQuestionNumber =
    Number.isInteger(parsedQuestionNumber) && parsedQuestionNumber > 0;

  useEffect(() => {
    if (!hasValidQuestionNumber) return;
    loadByQuestionNumber(parsedQuestionNumber);
  }, [hasValidQuestionNumber, loadByQuestionNumber, parsedQuestionNumber]);

  useEffect(() => {
    if (data) {
      setAnswers(
        data.items.map((item) =>
          new Array(getExpectedSuffix(item).length).fill(""),
        ),
      );
      setSubmitted(false);
      setScore(null);
      slotRefs.current = {};
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

  const handleSubmit = () => {
    if (!data) return;
    const sessionSeconds = stop();
    let correct = 0;
    data.items.forEach((item, i) => {
      const expectedSuffix = getExpectedSuffix(item);
      const userInput = (answers[i] ?? []).join("");
      if (userInput.toLowerCase() === expectedSuffix.toLowerCase()) correct++;
    });
    setScore({ correct, total: data.items.length });
    setSubmitted(true);
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

  const moveFocus = (itemIdx: number, slotIdx: number) => {
    const target = slotRefs.current[itemIdx]?.[slotIdx];
    target?.focus();
    target?.select();
  };

  const applyTextToSlots = (
    itemIdx: number,
    startIdx: number,
    rawText: string,
  ) => {
    if (!data || submitted) return;
    const expectedLength = getExpectedSuffix(data.items[itemIdx]).length;
    const chars = Array.from(rawText).filter((ch) => ch.trim().length > 0);
    if (chars.length === 0 || expectedLength === 0) return;

    setAnswers((prev) => {
      const next = prev.map((row) => [...row]);
      const row = [...(next[itemIdx] ?? new Array(expectedLength).fill(""))];
      let cursor = startIdx;

      for (const ch of chars) {
        if (cursor >= expectedLength) break;
        row[cursor] = ch;
        cursor++;
      }

      next[itemIdx] = row;
      return next;
    });

    const nextFocus = startIdx + chars.length;
    const targetIdx =
      nextFocus < expectedLength ? nextFocus : Math.max(expectedLength - 1, 0);
    requestAnimationFrame(() => moveFocus(itemIdx, targetIdx));
  };

  const clearSlot = (itemIdx: number, slotIdx: number) => {
    if (submitted) return;
    setAnswers((prev) => {
      const next = prev.map((row) => [...row]);
      if (!next[itemIdx]) return next;
      next[itemIdx][slotIdx] = "";
      return next;
    });
  };

  const renderParagraph = () => {
    if (!data) return null;
    const text = data.paragraph;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    const sorted = data.items
      .map((item, itemIdx) => ({
        item,
        itemIdx,
        firstPos: text.indexOf(item.placeholder),
      }))
      .sort(
        (a, b) =>
          a.firstPos - b.firstPos || a.itemIdx - b.itemIdx,
      );
    sorted.forEach(({ item, itemIdx }, i) => {
      const pos = text.indexOf(item.placeholder, lastIndex);
      if (pos === -1) return;
      const expectedSuffix = getExpectedSuffix(item);
      const answerChars = answers[itemIdx] ?? [];
      const userInput = answerChars.join("");
      const isCorrect =
        submitted && userInput.toLowerCase() === expectedSuffix.toLowerCase();
      const isWrong = submitted && !isCorrect;

      parts.push(<span key={`t${i}`}>{text.slice(lastIndex, pos)}</span>);
      parts.push(
        <span key={`inp${i}`} className={styles.blankWrapper}>
          <span className={styles.hint}>{item.hint}</span>
          <span className={styles.slotRow}>
            {Array.from({ length: expectedSuffix.length }).map((_, slotIdx) => (
              <input
                key={`slot-${i}-${slotIdx}`}
                ref={(el) => {
                  if (!slotRefs.current[itemIdx]) slotRefs.current[itemIdx] = [];
                  slotRefs.current[itemIdx][slotIdx] = el;
                }}
                className={[
                  styles.slotInput,
                  submitted ? (isCorrect ? styles.correct : styles.wrong) : "",
                ].join(" ")}
                value={answerChars[slotIdx] ?? ""}
                onChange={(e) => {
                  if (!e.target.value) {
                    clearSlot(itemIdx, slotIdx);
                    return;
                  }
                  applyTextToSlots(itemIdx, slotIdx, e.target.value);
                }}
                onPaste={(e) => {
                  e.preventDefault();
                  applyTextToSlots(
                    itemIdx,
                    slotIdx,
                    e.clipboardData.getData("text"),
                  );
                }}
                onKeyDown={(e) => {
                  if (e.key === "Backspace" && !answerChars[slotIdx]) {
                    if (slotIdx > 0) {
                      e.preventDefault();
                      moveFocus(itemIdx, slotIdx - 1);
                    }
                  } else if (e.key === "ArrowLeft" && slotIdx > 0) {
                    e.preventDefault();
                    moveFocus(itemIdx, slotIdx - 1);
                  } else if (
                    e.key === "ArrowRight" &&
                    slotIdx < expectedSuffix.length - 1
                  ) {
                    e.preventDefault();
                    moveFocus(itemIdx, slotIdx + 1);
                  }
                }}
                maxLength={1}
                inputMode="text"
                autoComplete="off"
                spellCheck={false}
                disabled={submitted}
                aria-label={`Blank ${itemIdx + 1} letter ${slotIdx + 1}`}
              />
            ))}
          </span>
          {isWrong && <span className={styles.correctHint}>{item.answer}</span>}
        </span>,
      );
      lastIndex = pos + item.placeholder.length;
    });
    parts.push(<span key="tail">{text.slice(lastIndex)}</span>);
    return parts;
  };

  const hasIncompleteAnswers =
    !data ||
    answers.length !== data.items.length ||
    answers.some((row, idx) => {
      const expectedLength = getExpectedSuffix(data.items[idx]).length;
      return row.length !== expectedLength || row.some((ch) => !ch.trim());
    });

  return (
    <div>
      {(running || elapsedSeconds > 0) && (
        <FloatingElapsedTimer display={display} running={running} />
      )}

      <SectionHeader
        title="Complete the Words"
        subtitle="Type only the missing continuation after the visible prefix."
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

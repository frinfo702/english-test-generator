import { useEffect } from "react";
import { SectionHeader } from "../../../components/layout/SectionHeader";
import { Button } from "../../../components/ui/Button";
import { LoadingSpinner } from "../../../components/ui/LoadingSpinner";
import { FloatingElapsedTimer } from "../../../components/ui/FloatingElapsedTimer";
import { useElapsedTimer } from "../../../hooks/useElapsedTimer";
import { useQuestion } from "../../../hooks/useQuestion";
import { useScoreHistory } from "../../../hooks/useScoreHistory";
import { useState } from "react";
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

export function CompleteWordsPage() {
  const { data, loading, error, load } = useQuestion<ProblemData>(
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
  const [answers, setAnswers] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<{ correct: number; total: number } | null>(
    null,
  );

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (data) {
      setAnswers(new Array(data.items.length).fill(""));
      setSubmitted(false);
      setScore(null);
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
      if (answers[i].trim().toLowerCase() === item.answer.toLowerCase())
        correct++;
    });
    setScore({ correct, total: data.items.length });
    setSubmitted(true);
    saveScore(
      "toefl/reading/complete-words",
      correct,
      data.items.length,
      sessionSeconds,
    );
  };

  const handleNew = () => {
    resetTimer();
    load();
  };

  const renderParagraph = () => {
    if (!data) return null;
    const text = data.paragraph;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    const sorted = [...data.items].sort(
      (a, b) => text.indexOf(a.placeholder) - text.indexOf(b.placeholder),
    );
    sorted.forEach((item, i) => {
      const pos = text.indexOf(item.placeholder, lastIndex);
      if (pos === -1) return;
      parts.push(<span key={`t${i}`}>{text.slice(lastIndex, pos)}</span>);
      const itemIdx = data.items.indexOf(item);
      const isCorrect =
        submitted &&
        answers[itemIdx].trim().toLowerCase() === item.answer.toLowerCase();
      const isWrong = submitted && !isCorrect;
      parts.push(
        <span key={`inp${i}`} className={styles.blankWrapper}>
          <span className={styles.hint}>{item.hint}</span>
          <input
            className={[
              styles.blankInput,
              submitted ? (isCorrect ? styles.correct : styles.wrong) : "",
            ].join(" ")}
            value={answers[itemIdx] ?? ""}
            onChange={(e) => {
              const next = [...answers];
              next[itemIdx] = e.target.value;
              setAnswers(next);
            }}
            disabled={submitted}
            placeholder="___"
            size={8}
          />
          {isWrong && <span className={styles.correctHint}>{item.answer}</span>}
        </span>,
      );
      lastIndex = pos + item.placeholder.length;
    });
    parts.push(<span key="tail">{text.slice(lastIndex)}</span>);
    return parts;
  };

  return (
    <div>
      {(running || elapsedSeconds > 0) && (
        <FloatingElapsedTimer display={display} running={running} />
      )}

      <SectionHeader
        title="Complete the Words"
        subtitle="Fill in the missing words in the academic paragraph."
        backTo="/toefl"
      />

      <div className={styles.topBar}>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleNew}
          disabled={loading}
        >
          Load Another Question
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

      {data && !loading && (
        <>
          <div className={styles.paragraph}>{renderParagraph()}</div>

          {!submitted ? (
            <Button
              onClick={handleSubmit}
              disabled={answers.some((a) => !a.trim())}
            >
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
              <Button onClick={handleNew}>Next Question</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

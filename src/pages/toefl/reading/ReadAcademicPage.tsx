import { useState, useEffect } from "react";
import { SectionHeader } from "../../../components/layout/SectionHeader";
import { Button } from "../../../components/ui/Button";
import { LoadingSpinner } from "../../../components/ui/LoadingSpinner";
import { FeedbackPanel } from "../../../components/ui/FeedbackPanel";
import { ProgressBar } from "../../../components/ui/ProgressBar";
import { FloatingElapsedTimer } from "../../../components/ui/FloatingElapsedTimer";
import { useElapsedTimer } from "../../../hooks/useElapsedTimer";
import { useQuestion } from "../../../hooks/useQuestion";
import { useScoreHistory } from "../../../hooks/useScoreHistory";
import styles from "./ReadAcademicPage.module.css";

interface Question {
  id: string;
  type: string;
  stem: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface ProblemData {
  passage: string;
  title: string;
  questions: Question[];
}

export function ReadAcademicPage() {
  const { data, loading, error, load } = useQuestion<ProblemData>(
    "toefl/reading/academic",
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
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [graded, setGraded] = useState(false);

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (data && !loading && !graded && !running && elapsedSeconds === 0) {
      start();
    }
  }, [data, loading, graded, running, elapsedSeconds, start]);

  const handleNew = () => {
    resetTimer();
    setCurrent(0);
    setAnswers({});
    setGraded(false);
    load();
  };

  const handleSelect = (idx: number) => {
    if (!graded) setAnswers((s) => ({ ...s, [current]: idx }));
  };

  const handleNext = () => {
    if (!data) return;
    setCurrent((c) => c + 1);
  };

  const handlePrev = () => {
    setCurrent((c) => c - 1);
  };

  const handleSubmit = () => {
    const sessionSeconds = stop();
    if (data) {
      const s = data.questions.filter(
        (q, i) => answers[i] === q.correctIndex,
      ).length;
      saveScore("toefl/reading/academic", s, data.questions.length, sessionSeconds);
    }
    setGraded(true);
  };

  const totalQ = data?.questions.length ?? 0;
  const totalAnswered = Object.keys(answers).length;
  const allAnswered = totalQ > 0 && totalAnswered === totalQ;
  const isLastQuestion = data ? current + 1 >= totalQ : false;

  const score = data
    ? data.questions.filter((q, i) => answers[i] === q.correctIndex).length
    : 0;

  const q = data?.questions[current];

  return (
    <div>
      {(running || elapsedSeconds > 0) && (
        <FloatingElapsedTimer display={display} running={running} />
      )}

      <SectionHeader
        title="Read an Academic Passage"
        subtitle="Read the academic passage and answer the questions."
        backTo="/toefl"
        current={totalAnswered}
        total={totalQ}
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
            Add question JSON under questions/toefl/reading/academic/.
          </p>
        </div>
      )}

      {data && !loading && q && (
        <>
          {graded && (
            <div className={styles.resultCard}>
              <h2>Section Complete</h2>
              <div className={styles.scoreBox}>
                <span className={styles.scoreNum}>{score}</span>
                <span className={styles.scoreDen}>/{totalQ}</span>
                <span className={styles.scorePct}>
                  ({Math.round((score / totalQ) * 100)}%)
                </span>
              </div>
              <ProgressBar current={score} total={totalQ} label="Accuracy" />
              <Button onClick={handleNew} size="lg">
                Another Passage
              </Button>
            </div>
          )}

          <div className={styles.layout}>
            <div className={styles.passageCard}>
              <h2 className={styles.passageTitle}>{data.title}</h2>
              <p className={styles.passage}>{data.passage}</p>
            </div>
            <div className={styles.questionCard}>
              <p className={styles.qNum}>
                Question {current + 1} / {totalQ}
              </p>
              <p className={styles.stem}>{q.stem}</p>
              <div className={styles.options}>
                {q.options.map((opt, i) => (
                  <button
                    key={i}
                    className={[
                      styles.option,
                      answers[current] === i ? styles.selected : "",
                      graded && i === q.correctIndex ? styles.correctOpt : "",
                      graded && answers[current] === i && i !== q.correctIndex
                        ? styles.wrongOpt
                        : "",
                    ].join(" ")}
                    onClick={() => handleSelect(i)}
                  >
                    <span className={styles.optLabel}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    {opt}
                  </button>
                ))}
              </div>
              {graded && (
                <FeedbackPanel
                  correct={answers[current] === q.correctIndex}
                  explanation={q.explanation}
                />
              )}
              <div className={styles.btnRow}>
                {current > 0 && (
                  <Button variant="secondary" onClick={handlePrev}>
                    Previous
                  </Button>
                )}
                {!graded && !isLastQuestion && answers[current] != null && (
                  <Button onClick={handleNext}>Next</Button>
                )}
                {!graded && isLastQuestion && allAnswered && (
                  <Button onClick={handleSubmit} size="lg">
                    Submit
                  </Button>
                )}
                {graded && current + 1 < totalQ && (
                  <Button onClick={handleNext}>Next</Button>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

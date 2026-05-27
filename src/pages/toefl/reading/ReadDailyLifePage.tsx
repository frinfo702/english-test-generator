import { useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { SectionHeader } from "../../../components/layout/SectionHeader";
import { Button } from "../../../components/ui/Button";
import { LoadingSpinner } from "../../../components/ui/LoadingSpinner";
import { FeedbackPanel } from "../../../components/ui/FeedbackPanel";
import { ProgressBar } from "../../../components/ui/ProgressBar";
import { FloatingElapsedTimer } from "../../../components/ui/FloatingElapsedTimer";
import { useElapsedTimer } from "../../../hooks/useElapsedTimer";
import { useQuestion } from "../../../hooks/useQuestion";
import { useScoreHistory } from "../../../hooks/useScoreHistory";
import { useState } from "react";
import styles from "./ReadDailyLifePage.module.css";

interface Question {
  id: string;
  stem: string;
  options: string[];
  correctIndex: number;
  type: string;
  explanation: string;
}

interface TextBlock {
  id: string;
  textType: string;
  content: string;
  questions: Question[];
}

interface ProblemData {
  texts: TextBlock[];
}

export function ReadDailyLifePage() {
  const navigate = useNavigate();
  const { questionNumber } = useParams<{ questionNumber: string }>();
  const { data, file, loading, error, loadByQuestionNumber } =
    useQuestion<ProblemData>("toefl/reading/daily-life");
  const { saveScore } = useScoreHistory();
  const {
    display,
    elapsedSeconds,
    running,
    start,
    stop,
    reset: resetTimer,
  } = useElapsedTimer();
  const [textIdx, setTextIdx] = useState(0);
  const [qIdx, setQIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [graded, setGraded] = useState(false);
  const sessionFileRef = useRef<string | null>(null);

  const parsedQuestionNumber = Number.parseInt(questionNumber ?? "", 10);
  const hasValidQuestionNumber =
    Number.isInteger(parsedQuestionNumber) && parsedQuestionNumber > 0;

  useEffect(() => {
    if (!hasValidQuestionNumber) return;
    sessionFileRef.current = null;
    loadByQuestionNumber(parsedQuestionNumber);
  }, [hasValidQuestionNumber, loadByQuestionNumber, parsedQuestionNumber]);

  useEffect(() => {
    if (file && !sessionFileRef.current) {
      sessionFileRef.current = file;
    }
  }, [file]);

  useEffect(() => {
    if (data && !loading && !graded && !running && elapsedSeconds === 0) {
      start();
    }
  }, [data, loading, graded, running, elapsedSeconds, start]);

  // Flatten questions across all texts
  const allQ: { text: TextBlock; question: Question }[] = [];
  if (data)
    data.texts.forEach((t) =>
      t.questions.forEach((q) => allQ.push({ text: t, question: q })),
    );

  const totalQ = allQ.length;
  const globalIdx = data
    ? data.texts.slice(0, textIdx).reduce((s, t) => s + t.questions.length, 0) +
      qIdx
    : 0;

  const currentText = data?.texts[textIdx];
  const currentQ = currentText?.questions[qIdx];
  const allAnswered = totalQ > 0 && Object.keys(answers).length === totalQ;
  const isLastQuestion = data
    ? textIdx === data.texts.length - 1 &&
      qIdx === (currentText?.questions.length ?? 1) - 1
    : false;

  const correctCount = allQ.filter(
    ({ question }) => answers[question.id] === question.correctIndex,
  ).length;

  const handleSelect = (i: number) => {
    if (!graded && currentQ) setAnswers((s) => ({ ...s, [currentQ.id]: i }));
  };

  const handleNext = () => {
    if (!data) return;
    const nextQ = qIdx + 1;
    if (nextQ < (currentText?.questions.length ?? 0)) {
      setQIdx(nextQ);
      return;
    }
    const nextT = textIdx + 1;
    if (nextT < data.texts.length) {
      setTextIdx(nextT);
      setQIdx(0);
      return;
    }
  };

  const handlePrev = () => {
    if (qIdx > 0) {
      setQIdx(qIdx - 1);
      return;
    }
    if (textIdx > 0) {
      const prevText = data?.texts[textIdx - 1];
      setTextIdx(textIdx - 1);
      setQIdx((prevText?.questions.length ?? 1) - 1);
    }
  };

  const handleSubmit = () => {
    const sessionSeconds = stop();
    saveScore(
      "toefl/reading/daily-life",
      correctCount,
      totalQ,
      sessionSeconds,
      sessionFileRef.current ?? file ?? undefined,
    );
    setGraded(true);
  };

  const handleRestart = () => {
    resetTimer();
    navigate("/toefl/reading/daily-life");
  };

  return (
    <div>
      {(running || elapsedSeconds > 0) && (
        <FloatingElapsedTimer display={display} running={running} />
      )}

      <SectionHeader
        title="Read in Daily Life"
        subtitle="Read everyday texts and answer questions."
        backTo="/toefl"
      />
      <div className={styles.moduleBar}>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate("/toefl/reading/daily-life")}
          disabled={loading}
        >
          Question List
        </Button>
      </div>
      {!hasValidQuestionNumber && (
        <div className={styles.error}>
          <p>Invalid question number in URL.</p>
        </div>
      )}

      {/* Result */}
      {graded && hasValidQuestionNumber && (
        <div className={styles.resultCard}>
          <h2 className={styles.resultTitle}>Result</h2>
          <div className={styles.resultModules}>
            <div className={styles.moduleResult}>
              <span className={styles.moduleLabel}>Score</span>
              <span className={styles.moduleScore}>
                {correctCount}/{totalQ} (
                {totalQ > 0 ? Math.round((correctCount / totalQ) * 100) : 0}
                %)
              </span>
            </div>
          </div>
          <ProgressBar current={correctCount} total={totalQ} label="Accuracy" />
          <Button size="lg" onClick={handleRestart}>
            Try Again
          </Button>
        </div>
      )}

      {/* Questions */}
      {!graded && hasValidQuestionNumber && (
        <>
          <div className={styles.moduleBar}>
            {totalQ > 0 && (
              <ProgressBar
                current={Object.keys(answers).length}
                total={totalQ}
              />
            )}
          </div>

          {loading && <LoadingSpinner message="Loading question..." />}
          {error && (
            <div className={styles.error}>
              <p>{error}</p>
              <p className={styles.errorHint}>
                Add question JSON under questions/toefl/reading/daily-life/.
              </p>
            </div>
          )}

          {data && !loading && currentText && currentQ && (
            <div className={styles.layout}>
              <div className={styles.textCard}>
                <div className={styles.textMeta}>{currentText.textType}</div>
                <p className={styles.textContent}>{currentText.content}</p>
              </div>
              <div className={styles.questionCard}>
                <p className={styles.qNum}>
                  Question {globalIdx + 1} / {totalQ}
                </p>
                <p className={styles.stem}>{currentQ.stem}</p>
                <div className={styles.options}>
                  {currentQ.options.map((opt, i) => (
                    <button
                      key={i}
                      className={[
                        styles.option,
                        answers[currentQ.id] === i ? styles.selected : "",
                        graded && i === currentQ.correctIndex
                          ? styles.correctOpt
                          : "",
                        graded &&
                        answers[currentQ.id] === i &&
                        i !== currentQ.correctIndex
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
                    correct={answers[currentQ.id] === currentQ.correctIndex}
                    explanation={currentQ.explanation}
                  />
                )}
                <div className={styles.btnRow}>
                  {globalIdx > 0 && (
                    <Button variant="secondary" onClick={handlePrev}>
                      Previous
                    </Button>
                  )}
                  {!graded &&
                    !isLastQuestion &&
                    answers[currentQ.id] != null && (
                      <Button onClick={handleNext}>Next</Button>
                    )}
                  {!graded && isLastQuestion && allAnswered && (
                    <Button onClick={handleSubmit} size="lg">
                      Submit
                    </Button>
                  )}
                  {graded && !isLastQuestion && (
                    <Button onClick={handleNext}>Next</Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

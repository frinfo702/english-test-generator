import { useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { SectionHeader } from "../../../components/layout/SectionHeader";
import { Button } from "../../../components/ui/Button";
import { LoadingSpinner } from "../../../components/ui/LoadingSpinner";
import { FeedbackPanel } from "../../../components/ui/FeedbackPanel";
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

const TYPE_LABELS: Record<string, string> = {
  factual: "Factual",
  inference: "Inference",
  purpose: "Purpose",
  vocabulary: "Vocabulary",
};

function cleanOptionText(text: string): string {
  return text.replace(/^[A-Da-d][.)]\s*/, "");
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

  // Flatten questions across all texts so we can number them globally.
  const allQ: { text: TextBlock; question: Question }[] = [];
  if (data) {
    data.texts.forEach((t) =>
      t.questions.forEach((q) => allQ.push({ text: t, question: q })),
    );
  }

  const totalQ = allQ.length;
  const answeredCount = Object.keys(answers).length;
  const allAnswered = totalQ > 0 && answeredCount === totalQ;

  const correctCount = allQ.filter(
    ({ question }) => answers[question.id] === question.correctIndex,
  ).length;

  const handleSelect = (questionId: string, optionIndex: number) => {
    if (!graded) {
      setAnswers((s) => ({ ...s, [questionId]: optionIndex }));
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
        subtitle="Read everyday texts and answer all questions."
        backTo="/toefl"
        current={answeredCount}
        total={totalQ}
      />

      <div className={styles.topBar}>
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

      {loading && <LoadingSpinner message="Loading question..." />}
      {error && (
        <div className={styles.error}>
          <p>{error}</p>
          <p className={styles.errorHint}>
            Add question JSON under questions/toefl/reading/daily-life/.
          </p>
        </div>
      )}

      {data && !loading && hasValidQuestionNumber && (
        <>
          {graded && (
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
              <Button size="lg" onClick={handleRestart}>
                Try Again
              </Button>
            </div>
          )}

          <div className={styles.texts}>
            {data.texts.map((text) => (
              <section key={text.id} className={styles.textSection}>
                <div className={styles.textCard}>
                  <div className={styles.textMeta}>{text.textType}</div>
                  <p className={styles.textContent}>{text.content}</p>
                </div>

                <div className={styles.questions}>
                  {text.questions.map((q) => {
                    const globalIdx = allQ.findIndex(
                      (item) => item.question.id === q.id,
                    );
                    const selected = answers[q.id];
                    return (
                      <div key={q.id} className={styles.qBlock}>
                        <div className={styles.qHeader}>
                          <span className={styles.qNum}>
                            {globalIdx + 1}
                          </span>
                          <span className={styles.qType}>
                            {TYPE_LABELS[q.type] ?? q.type}
                          </span>
                        </div>
                        <p className={styles.stem}>{q.stem}</p>
                        <div className={styles.options}>
                          {q.options.map((opt, i) => (
                            <button
                              key={i}
                              className={[
                                styles.option,
                                selected === i ? styles.selected : "",
                                graded && i === q.correctIndex
                                  ? styles.correctOpt
                                  : "",
                                graded &&
                                selected === i &&
                                i !== q.correctIndex
                                  ? styles.wrongOpt
                                  : "",
                              ].join(" ")}
                              onClick={() => handleSelect(q.id, i)}
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
                  })}
                </div>
              </section>
            ))}
          </div>

          {!graded && allAnswered && (
            <div className={styles.submitRow}>
              <Button onClick={handleSubmit} size="lg">
                Submit
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { SectionHeader } from "../../../components/layout/SectionHeader";
import { BackButton } from "../../../components/ui/BackButton";
import { Button } from "../../../components/ui/Button";
import { LoadingSpinner } from "../../../components/ui/LoadingSpinner";
import { FeedbackPanel } from "../../../components/ui/FeedbackPanel";
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

const TYPE_LABELS: Record<string, string> = {
  vocabulary: "Vocabulary",
  detail: "Detail",
  inference: "Inference",
  mainIdea: "Main Idea",
  paragraphRelation: "Paragraph Relation",
  importantIdea: "Important Idea",
  negativeFactual: "Negative Factual",
  rhetoricalPurpose: "Rhetorical Purpose",
  insertSentence: "Insert Sentence",
};

function cleanOptionText(text: string): string {
  return text.replace(/^[A-Da-d][.)]\s*/, "");
}

export function ReadAcademicPage() {
  const navigate = useNavigate();
  const { questionNumber } = useParams<{ questionNumber: string }>();
  const { data, file, loading, error, loadByQuestionNumber } =
    useQuestion<ProblemData>("toefl/reading/academic");
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

  const parsedQuestionNumber = Number.parseInt(questionNumber ?? "", 10);
  const hasValidQuestionNumber =
    Number.isInteger(parsedQuestionNumber) && parsedQuestionNumber > 0;

  useEffect(() => {
    if (!hasValidQuestionNumber) return;
    loadByQuestionNumber(parsedQuestionNumber);
  }, [hasValidQuestionNumber, loadByQuestionNumber, parsedQuestionNumber]);

  useEffect(() => {
    if (data && !loading && !graded && !running && elapsedSeconds === 0) {
      start();
    }
  }, [data, loading, graded, running, elapsedSeconds, start]);

  const handleBackToList = () => {
    resetTimer();
    navigate("/toefl/reading/academic");
  };

  const handleSelect = (questionId: string, optionIndex: number) => {
    if (!graded) setAnswers((s) => ({ ...s, [questionId]: optionIndex }));
  };

  const handleSubmit = () => {
    const sessionSeconds = stop();
    if (data) {
      const s = data.questions.filter(
        (q) => answers[q.id] === q.correctIndex,
      ).length;
      saveScore(
        "toefl/reading/academic",
        s,
        data.questions.length,
        sessionSeconds,
        file ?? undefined,
      );
    }
    setGraded(true);
  };

  const totalQ = data?.questions.length ?? 0;
  const totalAnswered = Object.keys(answers).length;
  const allAnswered = totalQ > 0 && totalAnswered === totalQ;

  const score = data
    ? data.questions.filter((q) => answers[q.id] === q.correctIndex).length
    : 0;

  return (
    <div>
      {(running || elapsedSeconds > 0) && (
        <FloatingElapsedTimer display={display} running={running} />
      )}

      <SectionHeader
        title="Read an Academic Passage"
        subtitle="Read the academic passage and answer all questions."
        backTo="/toefl"
        current={totalAnswered}
        total={totalQ}
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
            Add question JSON under questions/toefl/reading/academic/.
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
              <BackButton onClick={handleBackToList} size="lg" />
            </div>
          )}

          <div className={styles.layout}>
            <div className={styles.passageCard}>
              <h2 className={styles.passageTitle}>{data.title}</h2>
              <p className={styles.passage}>{data.passage}</p>
            </div>

            <div className={styles.questions}>
              {data.questions.map((q, idx) => {
                const selected = answers[q.id];
                return (
                  <div key={q.id} className={styles.questionCard}>
                    <div className={styles.qHeader}>
                      <span className={styles.qNum}>{idx + 1}</span>
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
                            graded && selected === i && i !== q.correctIndex
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

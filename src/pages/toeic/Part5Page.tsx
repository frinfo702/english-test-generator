import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { SectionHeader } from "../../components/layout/SectionHeader";
import { Button } from "../../components/ui/Button";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { FeedbackPanel } from "../../components/ui/FeedbackPanel";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { FloatingElapsedTimer } from "../../components/ui/FloatingElapsedTimer";
import { useElapsedTimer } from "../../hooks/useElapsedTimer";
import { useQuestion } from "../../hooks/useQuestion";
import { useScoreHistory } from "../../hooks/useScoreHistory";
import styles from "./Part5Page.module.css";

interface Question {
  id: string;
  sentence: string;
  options: { A: string; B: string; C: string; D: string };
  correct: "A" | "B" | "C" | "D";
  explanation: string;
  focus: string;
}

interface ProblemData {
  questions: Question[];
}

const PAGE_SIZE = 10;

export function Part5Page() {
  const navigate = useNavigate();
  const { questionNumber } = useParams<{ questionNumber: string }>();
  const { data, file, loading, error, loadByQuestionNumber } =
    useQuestion<ProblemData>("toeic/part5");
  const { saveScore } = useScoreHistory();
  const {
    display,
    elapsedSeconds,
    running,
    start,
    stop,
    reset: resetTimer,
  } = useElapsedTimer();
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Record<string, string>>({});
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

  const questions = data?.questions ?? [];
  const pageQuestions = questions.slice(
    page * PAGE_SIZE,
    (page + 1) * PAGE_SIZE,
  );
  const totalPages = Math.ceil(questions.length / PAGE_SIZE);
  const allOnPageSelected =
    pageQuestions.length > 0 && pageQuestions.every((q) => selected[q.id]);
  const allSelected =
    questions.length > 0 && questions.every((q) => selected[q.id]);
  const totalCorrect = questions.filter(
    (q) => selected[q.id] === q.correct,
  ).length;
  const totalAnswered = Object.keys(selected).length;

  const handleSelect = (id: string, opt: string) => {
    if (!graded) setSelected((s) => ({ ...s, [id]: opt }));
  };
  const handleNextPage = () => {
    setPage((p) => p + 1);
  };
  const handlePrevPage = () => {
    setPage((p) => p - 1);
  };
  const handleSubmit = () => {
    const sessionSeconds = stop();
    if (data) {
      const correct = data.questions.filter(
        (q) => selected[q.id] === q.correct,
      ).length;
      saveScore(
        "toeic/part5",
        correct,
        data.questions.length,
        sessionSeconds,
        file ?? undefined,
      );
    }
    setGraded(true);
  };
  const handleBackToList = () => {
    resetTimer();
    setPage(0);
    setSelected({});
    setGraded(false);
    navigate("/toeic/part5");
  };

  return (
    <div>
      {(running || elapsedSeconds > 0) && (
        <FloatingElapsedTimer display={display} running={running} />
      )}

      <SectionHeader
        title="Part 5: Incomplete Sentences"
        subtitle="Choose the best word or phrase for each blank (30 questions)."
        backTo="/toeic"
        current={totalAnswered}
        total={questions.length}
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

      {loading && <LoadingSpinner message="Loading question set..." />}
      {error && (
        <div className={styles.error}>
          <p>{error}</p>
          <p className={styles.errorHint}>
            Add question JSON under questions/toeic/part5/.
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
              <h2>Part 5 Complete</h2>
              <div className={styles.scoreBox}>
                <span className={styles.scoreNum}>{totalCorrect}</span>
                <span className={styles.scoreDen}>/{questions.length}</span>
                <span className={styles.scorePct}>
                  ({Math.round((totalCorrect / questions.length) * 100)}%)
                </span>
              </div>
              <ProgressBar
                current={totalCorrect}
                total={questions.length}
                label="Accuracy"
              />
              <Button onClick={handleBackToList} size="lg">
                Back to Question List
              </Button>
            </div>
          )}

          <div className={styles.pageInfo}>
            Page {page + 1} / {totalPages} (Questions {page * PAGE_SIZE + 1}-
            {Math.min((page + 1) * PAGE_SIZE, questions.length)})
          </div>
          <div className={styles.questions}>
            {pageQuestions.map((q, idx) => {
              const sel = selected[q.id];
              return (
                <div key={q.id} className={styles.qBlock}>
                  <div className={styles.qHeader}>
                    <span className={styles.qNum}>
                      {page * PAGE_SIZE + idx + 1}
                    </span>
                    <span className={styles.focus}>{q.focus}</span>
                  </div>
                  <p className={styles.sentence}>{q.sentence}</p>
                  <div className={styles.options}>
                    {(["A", "B", "C", "D"] as const).map((opt) => (
                      <button
                        key={opt}
                        className={[
                          styles.option,
                          sel === opt ? styles.selected : "",
                          graded && opt === q.correct ? styles.correctOpt : "",
                          graded && sel === opt && opt !== q.correct
                            ? styles.wrongOpt
                            : "",
                        ].join(" ")}
                        onClick={() => handleSelect(q.id, opt)}
                      >
                        <span className={styles.optLabel}>{opt}</span>
                        {q.options[opt]}
                      </button>
                    ))}
                  </div>
                  {graded && (
                    <FeedbackPanel
                      correct={sel === q.correct}
                      explanation={q.explanation}
                      correctAnswer={`(${q.correct}) ${q.options[q.correct]}`}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <div className={styles.pageNav}>
            {page > 0 && (
              <Button variant="secondary" onClick={handlePrevPage}>
                Previous Page
              </Button>
            )}
            {!graded && page + 1 < totalPages && allOnPageSelected && (
              <Button onClick={handleNextPage}>Next Page</Button>
            )}
            {graded && page + 1 < totalPages && (
              <Button onClick={handleNextPage}>Next Page</Button>
            )}
            {!graded && page + 1 >= totalPages && allSelected && (
              <Button onClick={handleSubmit} size="lg">
                Submit
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

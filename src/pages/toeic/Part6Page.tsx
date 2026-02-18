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
import styles from "./Part6Page.module.css";

interface Question {
  id: string;
  blankNumber: number;
  type: string;
  options: { A: string; B: string; C: string; D: string };
  correct: "A" | "B" | "C" | "D";
  explanation: string;
}

interface Passage {
  id: string;
  textType: string;
  text: string;
  questions: Question[];
}
interface ProblemData {
  passages: Passage[];
}

export function Part6Page() {
  const navigate = useNavigate();
  const { questionNumber } = useParams<{ questionNumber: string }>();
  const { data, file, loading, error, loadByQuestionNumber } =
    useQuestion<ProblemData>("toeic/part6");
  const { saveScore } = useScoreHistory();
  const {
    display,
    elapsedSeconds,
    running,
    start,
    stop,
    reset: resetTimer,
  } = useElapsedTimer();
  const [passageIdx, setPassageIdx] = useState(0);
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

  const passage = data?.passages[passageIdx];
  const allOnPassageSelected = (passage?.questions ?? []).every(
    (q) => selected[q.id],
  );
  const totalQ =
    data?.passages.reduce((s, p) => s + p.questions.length, 0) ?? 0;
  const totalAnswered = Object.keys(selected).length;
  const allSelected =
    totalQ > 0 &&
    (data?.passages ?? [])
      .flatMap((p) => p.questions)
      .every((q) => selected[q.id]);
  const totalCorrect = (data?.passages ?? [])
    .flatMap((p) => p.questions)
    .filter((q) => selected[q.id] === q.correct).length;

  const handleSelect = (id: string, opt: string) => {
    if (!graded) setSelected((s) => ({ ...s, [id]: opt }));
  };
  const handleNextPassage = () => {
    if (!data) return;
    setPassageIdx((i) => i + 1);
  };
  const handlePrevPassage = () => {
    setPassageIdx((i) => i - 1);
  };
  const handleSubmit = () => {
    const sessionSeconds = stop();
    if (data) {
      const allQ = data.passages.flatMap((p) => p.questions);
      const correct = allQ.filter((q) => selected[q.id] === q.correct).length;
      saveScore(
        "toeic/part6",
        correct,
        allQ.length,
        sessionSeconds,
        file ?? undefined,
      );
    }
    setGraded(true);
  };
  const handleBackToList = () => {
    resetTimer();
    setPassageIdx(0);
    setSelected({});
    setGraded(false);
    navigate("/toeic/part6");
  };

  const renderText = (p: Passage) => {
    const text = p.text;
    const parts: React.ReactNode[] = [];
    let last = 0;
    [1, 2, 3, 4].forEach((n) => {
      const marker = `[${n}]`;
      const pos = text.indexOf(marker, last);
      if (pos === -1) return;
      parts.push(<span key={`t${n}`}>{text.slice(last, pos)}</span>);
      const q = p.questions.find((q) => q.blankNumber === n);
      const sel = q ? selected[q.id] : undefined;
      parts.push(
        <span
          key={`b${n}`}
          className={[
            styles.inlineBlank,
            graded && sel === q?.correct
              ? styles.blankCorrect
              : graded && sel
                ? styles.blankWrong
                : "",
          ].join(" ")}
        >
          {sel
            ? `(${sel}) ${q?.options[sel as keyof typeof q.options]}`
            : `[${n}]`}
        </span>,
      );
      last = pos + marker.length;
    });
    parts.push(<span key="tail">{text.slice(last)}</span>);
    return parts;
  };

  return (
    <div>
      {(running || elapsedSeconds > 0) && (
        <FloatingElapsedTimer display={display} running={running} />
      )}

      <SectionHeader
        title="Part 6: Text Completion"
        subtitle="Choose the best words or sentence for each blank (4 passages x 4 questions)."
        backTo="/toeic"
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

      {loading && <LoadingSpinner message="Loading question set..." />}
      {error && (
        <div className={styles.error}>
          <p>{error}</p>
          <p className={styles.errorHint}>
            Add question JSON under questions/toeic/part6/.
          </p>
        </div>
      )}
      {!hasValidQuestionNumber && (
        <div className={styles.error}>
          <p>Invalid question number in URL.</p>
        </div>
      )}

      {data && !loading && hasValidQuestionNumber && passage && (
        <>
          {graded && (
            <div className={styles.resultCard}>
              <h2>Part 6 Complete</h2>
              <div className={styles.scoreBox}>
                <span className={styles.scoreNum}>{totalCorrect}</span>
                <span className={styles.scoreDen}>/{totalQ}</span>
                <span className={styles.scorePct}>
                  ({Math.round((totalCorrect / totalQ) * 100)}%)
                </span>
              </div>
              <ProgressBar
                current={totalCorrect}
                total={totalQ}
                label="Accuracy"
              />
              <Button onClick={handleBackToList} size="lg">
                Back to Question List
              </Button>
            </div>
          )}

          <div className={styles.passageNav}>
            <span className={styles.passageLabel}>
              Passage {passageIdx + 1} / {data.passages.length}
            </span>
            <span className={styles.passageType}>{passage.textType}</span>
          </div>
          <div className={styles.passageCard}>
            <p className={styles.passageText}>{renderText(passage)}</p>
          </div>
          <div className={styles.questions}>
            {passage.questions.map((q) => {
              const sel = selected[q.id];
              return (
                <div key={q.id} className={styles.qBlock}>
                  <div className={styles.qHeader}>
                    <span className={styles.blankTag}>[{q.blankNumber}]</span>
                    <span className={styles.typeTag}>{q.type}</span>
                  </div>
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
                        <span className={styles.optText}>{q.options[opt]}</span>
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
          <div className={styles.nav}>
            {passageIdx > 0 && (
              <Button variant="secondary" onClick={handlePrevPassage}>
                Previous Passage
              </Button>
            )}
            {!graded &&
              passageIdx + 1 < data.passages.length &&
              allOnPassageSelected && (
                <Button onClick={handleNextPassage}>Next Passage</Button>
              )}
            {graded && passageIdx + 1 < data.passages.length && (
              <Button onClick={handleNextPassage}>Next Passage</Button>
            )}
            {!graded &&
              passageIdx + 1 >= data.passages.length &&
              allSelected && (
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

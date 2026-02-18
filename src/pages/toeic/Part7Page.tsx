import { useState, useEffect } from "react";
import { SectionHeader } from "../../components/layout/SectionHeader";
import { Button } from "../../components/ui/Button";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { FeedbackPanel } from "../../components/ui/FeedbackPanel";
import { FloatingElapsedTimer } from "../../components/ui/FloatingElapsedTimer";
import { useElapsedTimer } from "../../hooks/useElapsedTimer";
import { useQuestion } from "../../hooks/useQuestion";
import { useScoreHistory } from "../../hooks/useScoreHistory";
import styles from "./Part7Page.module.css";

interface Passage {
  id: string;
  textType: string;
  title: string | null;
  content: string;
}
interface Question {
  id: string;
  type: string;
  stem: string;
  options: { A: string; B: string; C: string; D: string };
  correct: "A" | "B" | "C" | "D";
  explanation: string;
  passageRef: string;
}
interface ProblemData {
  setType: string;
  passages: Passage[];
  questions: Question[];
}

const TYPE_LABELS: Record<string, string> = {
  detail: "詳細",
  inference: "推論",
  vocabulary: "語彙",
  notStated: "NOT述べられている",
  purpose: "目的",
  crossReference: "クロス参照",
};

export function Part7Page() {
  const { data, loading, error, load } =
    useQuestion<ProblemData>("toeic/part7");
  const { saveScore } = useScoreHistory();
  const {
    display,
    elapsedSeconds,
    running,
    start,
    stop,
    reset: resetTimer,
  } = useElapsedTimer();
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [graded, setGraded] = useState(false);

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (data && !loading && !graded && !running && elapsedSeconds === 0) {
      start();
    }
  }, [data, loading, graded, running, elapsedSeconds, start]);

  const questions = data?.questions ?? [];
  const allSelected =
    questions.length > 0 && questions.every((q) => selected[q.id]);
  const totalCorrect = questions.filter(
    (q) => selected[q.id] === q.correct,
  ).length;

  const handleSelect = (id: string, opt: string) => {
    if (!graded) setSelected((s) => ({ ...s, [id]: opt }));
  };
  const handleSubmit = () => {
    const sessionSeconds = stop();
    if (data) {
      const correct = data.questions.filter(
        (q) => selected[q.id] === q.correct,
      ).length;
      saveScore("toeic/part7", correct, data.questions.length, sessionSeconds);
    }
    setGraded(true);
  };
  const handleNew = () => {
    resetTimer();
    setSelected({});
    setGraded(false);
    load();
  };

  const setTypeLabel =
    data?.setType === "single"
      ? "Single Passage"
      : data?.setType === "double"
        ? "Double Passage"
        : "Triple Passage";

  return (
    <div>
      {(running || elapsedSeconds > 0) && (
        <FloatingElapsedTimer display={display} running={running} />
      )}

      <SectionHeader
        title="Part 7: Reading Comprehension"
        subtitle="パッセージを読んで設問に答えてください"
        backTo="/toeic"
        current={Object.keys(selected).length}
        total={questions.length}
      />

      <div className={styles.topBar}>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleNew}
          disabled={loading}
        >
          別の問題を読み込む
        </Button>
      </div>

      {loading && <LoadingSpinner message="問題を読み込み中..." />}
      {error && (
        <div className={styles.error}>
          <p>{error}</p>
          <p className={styles.errorHint}>
            questions/toeic/part7/ に問題JSONを追加してください。
          </p>
        </div>
      )}

      {data && !loading && (
        <>
          {graded && (
            <div className={styles.resultInline}>
              <p className={styles.inlineScore}>
                正答数:{" "}
                <strong>
                  {totalCorrect} / {questions.length}
                </strong>
                （{Math.round((totalCorrect / questions.length) * 100)}%）
              </p>
              <Button onClick={handleNew}>別の問題</Button>
            </div>
          )}

          <div className={styles.setTypeBadge}>{setTypeLabel}</div>

          <div className={styles.passages}>
            {data.passages.map((p, i) => (
              <div key={p.id} className={styles.passageCard}>
                {data.passages.length > 1 && (
                  <div className={styles.passageMeta}>
                    <span className={styles.passageNum}>文書 {i + 1}</span>
                    <span className={styles.passageType}>{p.textType}</span>
                  </div>
                )}
                {p.title && <h3 className={styles.passageTitle}>{p.title}</h3>}
                <p className={styles.passageText}>{p.content}</p>
              </div>
            ))}
          </div>

          <div className={styles.questions}>
            {questions.map((q, idx) => {
              const sel = selected[q.id];
              return (
                <div key={q.id} className={styles.qBlock}>
                  <div className={styles.qHeader}>
                    <span className={styles.qNum}>{idx + 1}</span>
                    <span className={styles.qType}>
                      {TYPE_LABELS[q.type] ?? q.type}
                    </span>
                    {q.passageRef === "cross" && (
                      <span className={styles.crossTag}>クロス参照</span>
                    )}
                  </div>
                  <p className={styles.stem}>{q.stem}</p>
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

          {!graded && allSelected && (
            <div className={styles.resultInline}>
              <Button onClick={handleSubmit} size="lg">
                提出する
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

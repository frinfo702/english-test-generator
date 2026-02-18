import { useState, useEffect } from "react";
import { SectionHeader } from "../../components/layout/SectionHeader";
import { Button } from "../../components/ui/Button";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { FeedbackPanel } from "../../components/ui/FeedbackPanel";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { useQuestion } from "../../hooks/useQuestion";
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
  const { data, loading, error, load } =
    useQuestion<ProblemData>("toeic/part5");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [graded, setGraded] = useState(false);

  useEffect(() => {
    load();
  }, []);

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
    setGraded(true);
    setPage(0);
  };
  const handleNew = () => {
    setPage(0);
    setSelected({});
    setGraded(false);
    load();
  };

  return (
    <div>
      <SectionHeader
        title="Part 5: Incomplete Sentences"
        subtitle="空欄に入る最も適切な語句を選んでください（30問）"
        backTo="/toeic"
        current={totalAnswered}
        total={questions.length}
      />

      <div className={styles.topBar}>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleNew}
          disabled={loading}
        >
          別の問題セットを読み込む
        </Button>
      </div>

      {loading && <LoadingSpinner message="問題を読み込み中..." />}
      {error && (
        <div className={styles.error}>
          <p>{error}</p>
          <p className={styles.errorHint}>
            questions/toeic/part5/ に問題JSONを追加してください。
          </p>
        </div>
      )}

      {data && !loading && (
        <>
          {graded && (
            <div className={styles.resultCard}>
              <h2>Part 5 完了</h2>
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
                label="正答率"
              />
              <Button onClick={handleNew} size="lg">
                別の問題セット
              </Button>
            </div>
          )}

          <div className={styles.pageInfo}>
            {page + 1} / {totalPages} ページ（問題 {page * PAGE_SIZE + 1}〜
            {Math.min((page + 1) * PAGE_SIZE, questions.length)}）
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
                前のページ
              </Button>
            )}
            {!graded && page + 1 < totalPages && allOnPageSelected && (
              <Button onClick={handleNextPage}>次のページ</Button>
            )}
            {!graded && page + 1 >= totalPages && allSelected && (
              <Button onClick={handleSubmit} size="lg">
                提出する
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

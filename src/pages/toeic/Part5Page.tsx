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
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({});
  const [done, setDone] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const questions = data?.questions ?? [];
  const pageQuestions = questions.slice(
    page * PAGE_SIZE,
    (page + 1) * PAGE_SIZE,
  );
  const totalPages = Math.ceil(questions.length / PAGE_SIZE);
  const allOnPageAnswered =
    pageQuestions.length > 0 && pageQuestions.every((q) => submitted[q.id]);
  const totalCorrect = questions.filter(
    (q) => submitted[q.id] && selected[q.id] === q.correct,
  ).length;
  const totalAnswered = Object.keys(submitted).length;

  const handleSelect = (id: string, opt: string) => {
    if (!submitted[id]) setSelected((s) => ({ ...s, [id]: opt }));
  };
  const handleCheck = (q: Question) =>
    setSubmitted((s) => ({ ...s, [q.id]: true }));
  const handleNextPage = () => {
    if (page + 1 >= totalPages) setDone(true);
    else setPage((p) => p + 1);
  };
  const handleNew = () => {
    setPage(0);
    setSelected({});
    setSubmitted({});
    setDone(false);
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

      {data && !loading && !done && (
        <>
          <div className={styles.pageInfo}>
            {page + 1} / {totalPages} ページ（問題 {page * PAGE_SIZE + 1}〜
            {Math.min((page + 1) * PAGE_SIZE, questions.length)}）
          </div>
          <div className={styles.questions}>
            {pageQuestions.map((q, idx) => {
              const sel = selected[q.id];
              const sub = submitted[q.id];
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
                          sub && opt === q.correct ? styles.correctOpt : "",
                          sub && sel === opt && opt !== q.correct
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
                  {sub && (
                    <FeedbackPanel
                      correct={sel === q.correct}
                      explanation={q.explanation}
                      correctAnswer={`(${q.correct}) ${q.options[q.correct]}`}
                    />
                  )}
                  {!sub && (
                    <Button
                      size="sm"
                      onClick={() => handleCheck(q)}
                      disabled={!sel}
                    >
                      確認
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
          {allOnPageAnswered && (
            <div className={styles.pageNav}>
              <Button onClick={handleNextPage} size="lg">
                {page + 1 < totalPages ? "次のページ" : "結果を見る"}
              </Button>
            </div>
          )}
        </>
      )}

      {done && data && (
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
    </div>
  );
}

import { useState, useEffect } from "react";
import { SectionHeader } from "../../components/layout/SectionHeader";
import { Button } from "../../components/ui/Button";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { FeedbackPanel } from "../../components/ui/FeedbackPanel";
import { useQuestion } from "../../hooks/useQuestion";
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
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({});

  useEffect(() => {
    load();
  }, []);

  const questions = data?.questions ?? [];
  const allAnswered =
    questions.length > 0 && questions.every((q) => submitted[q.id]);
  const totalCorrect = questions.filter(
    (q) => submitted[q.id] && selected[q.id] === q.correct,
  ).length;

  const handleSelect = (id: string, opt: string) => {
    if (!submitted[id]) setSelected((s) => ({ ...s, [id]: opt }));
  };
  const handleCheck = (q: Question) =>
    setSubmitted((s) => ({ ...s, [q.id]: true }));
  const handleNew = () => {
    setSelected({});
    setSubmitted({});
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
      <SectionHeader
        title="Part 7: Reading Comprehension"
        subtitle="パッセージを読んで設問に答えてください"
        backTo="/toeic"
        current={Object.keys(submitted).length}
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
              const sub = submitted[q.id];
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

          {allAnswered && (
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
        </>
      )}
    </div>
  );
}

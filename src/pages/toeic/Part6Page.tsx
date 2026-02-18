import { useState, useEffect } from "react";
import { SectionHeader } from "../../components/layout/SectionHeader";
import { Button } from "../../components/ui/Button";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { FeedbackPanel } from "../../components/ui/FeedbackPanel";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { useQuestion } from "../../hooks/useQuestion";
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
  const { data, loading, error, load } =
    useQuestion<ProblemData>("toeic/part6");
  const [passageIdx, setPassageIdx] = useState(0);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [graded, setGraded] = useState(false);

  useEffect(() => {
    load();
  }, []);

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
    setGraded(true);
    setPassageIdx(0);
  };
  const handleNew = () => {
    setPassageIdx(0);
    setSelected({});
    setGraded(false);
    load();
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
      <SectionHeader
        title="Part 6: Text Completion"
        subtitle="文書の空欄に入る最も適切な語句・文を選んでください（4文書×4問）"
        backTo="/toeic"
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
          別の問題セットを読み込む
        </Button>
      </div>

      {loading && <LoadingSpinner message="問題を読み込み中..." />}
      {error && (
        <div className={styles.error}>
          <p>{error}</p>
          <p className={styles.errorHint}>
            questions/toeic/part6/ に問題JSONを追加してください。
          </p>
        </div>
      )}

      {data && !loading && passage && (
        <>
          {graded && (
            <div className={styles.resultCard}>
              <h2>Part 6 完了</h2>
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
                label="正答率"
              />
              <Button onClick={handleNew} size="lg">
                別の問題セット
              </Button>
            </div>
          )}

          <div className={styles.passageNav}>
            <span className={styles.passageLabel}>
              文書 {passageIdx + 1} / {data.passages.length}
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
                前の文書
              </Button>
            )}
            {!graded &&
              passageIdx + 1 < data.passages.length &&
              allOnPassageSelected && (
                <Button onClick={handleNextPassage}>次の文書</Button>
              )}
            {!graded &&
              passageIdx + 1 >= data.passages.length &&
              allSelected && (
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

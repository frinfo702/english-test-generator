import { useState, useEffect } from "react";
import { SectionHeader } from "../../../components/layout/SectionHeader";
import { Button } from "../../../components/ui/Button";
import { LoadingSpinner } from "../../../components/ui/LoadingSpinner";
import { FeedbackPanel } from "../../../components/ui/FeedbackPanel";
import { ProgressBar } from "../../../components/ui/ProgressBar";
import { useQuestion } from "../../../hooks/useQuestion";
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

export function ReadAcademicPage() {
  const { data, loading, error, load } = useQuestion<ProblemData>(
    "toefl/reading/academic",
  );
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const resetState = () => {
    setCurrent(0);
    setSelected(null);
    setShowFeedback(false);
    setScore(0);
    setDone(false);
  };

  const handleNew = () => {
    resetState();
    load();
  };

  const handleSelect = (idx: number) => {
    if (!showFeedback) setSelected(idx);
  };

  const handleCheck = () => {
    if (selected === null || !data) return;
    if (selected === data.questions[current].correctIndex)
      setScore((s) => s + 1);
    setShowFeedback(true);
  };

  const handleNext = () => {
    if (!data) return;
    if (current + 1 >= data.questions.length) {
      setDone(true);
      return;
    }
    setCurrent((c) => c + 1);
    setSelected(null);
    setShowFeedback(false);
  };

  const q = data?.questions[current];

  return (
    <div>
      <SectionHeader
        title="Read an Academic Passage"
        subtitle="学術パッセージを読んで設問に答えてください"
        backTo="/toefl"
        current={done ? data?.questions.length : current}
        total={data?.questions.length}
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
            questions/toefl/reading/academic/ に問題JSONを追加してください。
          </p>
        </div>
      )}

      {data && !loading && !done && q && (
        <div className={styles.layout}>
          <div className={styles.passageCard}>
            <h2 className={styles.passageTitle}>{data.title}</h2>
            <p className={styles.passage}>{data.passage}</p>
          </div>
          <div className={styles.questionCard}>
            <p className={styles.qNum}>
              問題 {current + 1} / {data.questions.length}
            </p>
            <p className={styles.stem}>{q.stem}</p>
            <div className={styles.options}>
              {q.options.map((opt, i) => (
                <button
                  key={i}
                  className={[
                    styles.option,
                    selected === i ? styles.selected : "",
                    showFeedback && i === q.correctIndex
                      ? styles.correctOpt
                      : "",
                    showFeedback && selected === i && i !== q.correctIndex
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
            {showFeedback && (
              <FeedbackPanel
                correct={selected === q.correctIndex}
                explanation={q.explanation}
              />
            )}
            <div className={styles.btnRow}>
              {!showFeedback ? (
                <Button onClick={handleCheck} disabled={selected === null}>
                  確認
                </Button>
              ) : (
                <Button onClick={handleNext}>
                  {current + 1 < data.questions.length
                    ? "次の問題"
                    : "結果を見る"}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {done && data && (
        <div className={styles.resultCard}>
          <h2>セクション完了</h2>
          <div className={styles.scoreBox}>
            <span className={styles.scoreNum}>{score}</span>
            <span className={styles.scoreDen}>/{data.questions.length}</span>
            <span className={styles.scorePct}>
              ({Math.round((score / data.questions.length) * 100)}%)
            </span>
          </div>
          <ProgressBar
            current={score}
            total={data.questions.length}
            label="正答率"
          />
          <Button onClick={handleNew} size="lg">
            別のパッセージ
          </Button>
        </div>
      )}
    </div>
  );
}

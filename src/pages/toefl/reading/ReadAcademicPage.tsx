import { useState, useEffect } from "react";
import { SectionHeader } from "../../../components/layout/SectionHeader";
import { Button } from "../../../components/ui/Button";
import { LoadingSpinner } from "../../../components/ui/LoadingSpinner";
import { FeedbackPanel } from "../../../components/ui/FeedbackPanel";
import { ProgressBar } from "../../../components/ui/ProgressBar";
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

export function ReadAcademicPage() {
  const { data, loading, error, load } = useQuestion<ProblemData>(
    "toefl/reading/academic",
  );
  const { saveScore } = useScoreHistory();
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [graded, setGraded] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const handleNew = () => {
    setCurrent(0);
    setAnswers({});
    setGraded(false);
    load();
  };

  const handleSelect = (idx: number) => {
    if (!graded) setAnswers((s) => ({ ...s, [current]: idx }));
  };

  const handleNext = () => {
    if (!data) return;
    setCurrent((c) => c + 1);
  };

  const handlePrev = () => {
    setCurrent((c) => c - 1);
  };

  const handleSubmit = () => {
    if (data) {
      const s = data.questions.filter(
        (q, i) => answers[i] === q.correctIndex,
      ).length;
      saveScore("toefl/reading/academic", s, data.questions.length);
    }
    setGraded(true);
  };

  const totalQ = data?.questions.length ?? 0;
  const totalAnswered = Object.keys(answers).length;
  const allAnswered = totalQ > 0 && totalAnswered === totalQ;
  const isLastQuestion = data ? current + 1 >= totalQ : false;

  const score = data
    ? data.questions.filter((q, i) => answers[i] === q.correctIndex).length
    : 0;

  const q = data?.questions[current];

  return (
    <div>
      <SectionHeader
        title="Read an Academic Passage"
        subtitle="学術パッセージを読んで設問に答えてください"
        backTo="/toefl"
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

      {data && !loading && q && (
        <>
          {graded && (
            <div className={styles.resultCard}>
              <h2>セクション完了</h2>
              <div className={styles.scoreBox}>
                <span className={styles.scoreNum}>{score}</span>
                <span className={styles.scoreDen}>/{totalQ}</span>
                <span className={styles.scorePct}>
                  ({Math.round((score / totalQ) * 100)}%)
                </span>
              </div>
              <ProgressBar current={score} total={totalQ} label="正答率" />
              <Button onClick={handleNew} size="lg">
                別のパッセージ
              </Button>
            </div>
          )}

          <div className={styles.layout}>
            <div className={styles.passageCard}>
              <h2 className={styles.passageTitle}>{data.title}</h2>
              <p className={styles.passage}>{data.passage}</p>
            </div>
            <div className={styles.questionCard}>
              <p className={styles.qNum}>
                問題 {current + 1} / {totalQ}
              </p>
              <p className={styles.stem}>{q.stem}</p>
              <div className={styles.options}>
                {q.options.map((opt, i) => (
                  <button
                    key={i}
                    className={[
                      styles.option,
                      answers[current] === i ? styles.selected : "",
                      graded && i === q.correctIndex ? styles.correctOpt : "",
                      graded && answers[current] === i && i !== q.correctIndex
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
              {graded && (
                <FeedbackPanel
                  correct={answers[current] === q.correctIndex}
                  explanation={q.explanation}
                />
              )}
              <div className={styles.btnRow}>
                {current > 0 && (
                  <Button variant="secondary" onClick={handlePrev}>
                    前の問題
                  </Button>
                )}
                {!graded && !isLastQuestion && answers[current] != null && (
                  <Button onClick={handleNext}>次の問題</Button>
                )}
                {!graded && isLastQuestion && allAnswered && (
                  <Button onClick={handleSubmit} size="lg">
                    提出する
                  </Button>
                )}
                {graded && current + 1 < totalQ && (
                  <Button onClick={handleNext}>次の問題</Button>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

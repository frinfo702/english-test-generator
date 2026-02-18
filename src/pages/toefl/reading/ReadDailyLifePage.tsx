import { useEffect } from "react";
import { SectionHeader } from "../../../components/layout/SectionHeader";
import { Button } from "../../../components/ui/Button";
import { LoadingSpinner } from "../../../components/ui/LoadingSpinner";
import { FeedbackPanel } from "../../../components/ui/FeedbackPanel";
import { ProgressBar } from "../../../components/ui/ProgressBar";
import { useAdaptive } from "../../../hooks/useAdaptive";
import { useQuestion } from "../../../hooks/useQuestion";
import { useScoreHistory } from "../../../hooks/useScoreHistory";
import { useState } from "react";
import styles from "./ReadDailyLifePage.module.css";

interface Question {
  id: string;
  stem: string;
  options: string[];
  correctIndex: number;
  type: string;
  explanation: string;
}

interface TextBlock {
  id: string;
  textType: string;
  content: string;
  questions: Question[];
}

interface ProblemData {
  module: string;
  texts: TextBlock[];
}

export function ReadDailyLifePage() {
  const adaptive = useAdaptive();
  const { data, loading, error, load } = useQuestion<ProblemData>(
    "toefl/reading/daily-life",
  );
  const { saveScore } = useScoreHistory();
  const [textIdx, setTextIdx] = useState(0);
  const [qIdx, setQIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [graded, setGraded] = useState(false);

  useEffect(() => {
    load();
  }, []);

  // Flatten questions across all texts
  const allQ: { text: TextBlock; question: Question }[] = [];
  if (data)
    data.texts.forEach((t) =>
      t.questions.forEach((q) => allQ.push({ text: t, question: q })),
    );

  const totalQ = allQ.length;
  const globalIdx = data
    ? data.texts.slice(0, textIdx).reduce((s, t) => s + t.questions.length, 0) +
      qIdx
    : 0;

  const currentText = data?.texts[textIdx];
  const currentQ = currentText?.questions[qIdx];
  const allAnswered = totalQ > 0 && Object.keys(answers).length === totalQ;
  const isLastQuestion = data
    ? textIdx === data.texts.length - 1 &&
      qIdx === (currentText?.questions.length ?? 1) - 1
    : false;

  const handleSelect = (i: number) => {
    if (!graded && currentQ) setAnswers((s) => ({ ...s, [currentQ.id]: i }));
  };

  const handleNext = () => {
    if (!data) return;
    const nextQ = qIdx + 1;
    if (nextQ < (currentText?.questions.length ?? 0)) {
      setQIdx(nextQ);
      return;
    }
    const nextT = textIdx + 1;
    if (nextT < data.texts.length) {
      setTextIdx(nextT);
      setQIdx(0);
      return;
    }
  };

  const handlePrev = () => {
    if (qIdx > 0) {
      setQIdx(qIdx - 1);
      return;
    }
    if (textIdx > 0) {
      const prevText = data?.texts[textIdx - 1];
      setTextIdx(textIdx - 1);
      setQIdx((prevText?.questions.length ?? 1) - 1);
    }
  };

  const handleSubmit = () => {
    // Record all answers to adaptive hook
    allQ.forEach(({ question }) => {
      const sel = answers[question.id];
      const correct = sel === question.correctIndex;
      if (adaptive.state.phase === "module1")
        adaptive.recordModule1Answer(correct);
      else adaptive.recordModule2Answer(correct);
    });
    // Finish module
    if (adaptive.state.phase === "module1") {
      adaptive.finishModule1();
    } else {
      // セッション全体のスコアを保存（Module1 + Module2の合計）
      const m1c = adaptive.state.module1Correct;
      const m1t = adaptive.state.module1Total;
      const m2c = allQ.filter(
        ({ question }) => answers[question.id] === question.correctIndex,
      ).length;
      const m2t = allQ.length;
      saveScore("toefl/reading/daily-life", m1c + m2c, m1t + m2t);
      adaptive.finishModule2();
    }
    setGraded(true);
    setTextIdx(0);
    setQIdx(0);
  };

  const handleStartModule2 = () => {
    adaptive.startModule2();
    setTextIdx(0);
    setQIdx(0);
    setAnswers({});
    setGraded(false);
    load();
  };

  const handleRestart = () => {
    adaptive.reset();
    setTextIdx(0);
    setQIdx(0);
    setAnswers({});
    setGraded(false);
    load();
  };

  const phase = adaptive.state.phase;

  return (
    <div>
      <SectionHeader
        title="Read in Daily Life"
        subtitle="日常テキストを読んで設問に答えてください（アダプティブ形式）"
        backTo="/toefl"
      />

      {/* branching */}
      {phase === "branching" && (
        <div className={styles.branchCard}>
          <div className={styles.branchHeader}>
            <span className={styles.branchIcon}>✓</span>
            <h2>Module 1 完了！</h2>
          </div>
          <p className={styles.branchScore}>
            正答率: <strong>{adaptive.module1Pct}%</strong> (
            {adaptive.state.module1Correct}/{adaptive.state.module1Total})
          </p>
          <div
            className={[
              styles.branchBadge,
              adaptive.state.module === "module2Hard"
                ? styles.hard
                : styles.easy,
            ].join(" ")}
          >
            {adaptive.state.module === "module2Hard"
              ? "Module 2 Hard に進みます（スコア上限なし）"
              : "Module 2 Easy に進みます（スコア上限 4.0）"}
          </div>
          <Button size="lg" onClick={handleStartModule2}>
            Module 2 を開始
          </Button>
        </div>
      )}

      {/* complete */}
      {phase === "complete" && (
        <div className={styles.resultCard}>
          <h2>セッション完了</h2>
          <div className={styles.resultModules}>
            <div className={styles.moduleResult}>
              <span className={styles.moduleLabel}>Module 1</span>
              <span className={styles.moduleScore}>
                {adaptive.state.module1Correct}/{adaptive.state.module1Total}（
                {adaptive.module1Pct}%）
              </span>
            </div>
            <div className={styles.moduleResult}>
              <span className={styles.moduleLabel}>
                {adaptive.state.module === "module2Hard"
                  ? "Module 2 Hard"
                  : "Module 2 Easy"}
              </span>
              <span className={styles.moduleScore}>
                {adaptive.state.module2Correct}/{adaptive.state.module2Total}（
                {adaptive.state.module2Total > 0
                  ? Math.round(
                      (adaptive.state.module2Correct /
                        adaptive.state.module2Total) *
                        100,
                    )
                  : 0}
                %）
              </span>
            </div>
          </div>
          <ProgressBar
            current={adaptive.totalCorrect}
            total={adaptive.totalQuestions}
            label="総合正答率"
          />
          <div className={styles.bandScore}>
            <span className={styles.bandLabel}>バンドスコア目安</span>
            <span className={styles.bandValue}>{adaptive.getBandScore()}</span>
          </div>
          <Button size="lg" onClick={handleRestart}>
            もう一度挑戦
          </Button>
        </div>
      )}

      {/* questions */}
      {(phase === "module1" || phase === "module2") && (
        <>
          <div className={styles.moduleBar}>
            <span className={styles.moduleTag}>
              {phase === "module1"
                ? "Module 1"
                : adaptive.state.module === "module2Hard"
                  ? "Module 2 Hard"
                  : "Module 2 Easy"}
            </span>
            {totalQ > 0 && (
              <ProgressBar
                current={Object.keys(answers).length}
                total={totalQ}
              />
            )}
          </div>

          {loading && <LoadingSpinner message="問題を読み込み中..." />}
          {error && (
            <div className={styles.error}>
              <p>{error}</p>
              <p className={styles.errorHint}>
                questions/toefl/reading/daily-life/
                に問題JSONを追加してください。
              </p>
            </div>
          )}

          {data && !loading && currentText && currentQ && (
            <div className={styles.layout}>
              <div className={styles.textCard}>
                <div className={styles.textMeta}>{currentText.textType}</div>
                <p className={styles.textContent}>{currentText.content}</p>
              </div>
              <div className={styles.questionCard}>
                <p className={styles.qNum}>
                  問題 {globalIdx + 1} / {totalQ}
                </p>
                <p className={styles.stem}>{currentQ.stem}</p>
                <div className={styles.options}>
                  {currentQ.options.map((opt, i) => (
                    <button
                      key={i}
                      className={[
                        styles.option,
                        answers[currentQ.id] === i ? styles.selected : "",
                        graded && i === currentQ.correctIndex
                          ? styles.correctOpt
                          : "",
                        graded &&
                        answers[currentQ.id] === i &&
                        i !== currentQ.correctIndex
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
                    correct={answers[currentQ.id] === currentQ.correctIndex}
                    explanation={currentQ.explanation}
                  />
                )}
                <div className={styles.btnRow}>
                  {globalIdx > 0 && (
                    <Button variant="secondary" onClick={handlePrev}>
                      前へ
                    </Button>
                  )}
                  {!graded &&
                    !isLastQuestion &&
                    answers[currentQ.id] != null && (
                      <Button onClick={handleNext}>次へ</Button>
                    )}
                  {!graded && isLastQuestion && allAnswered && (
                    <Button onClick={handleSubmit} size="lg">
                      提出する
                    </Button>
                  )}
                  {graded && !isLastQuestion && (
                    <Button onClick={handleNext}>次へ</Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

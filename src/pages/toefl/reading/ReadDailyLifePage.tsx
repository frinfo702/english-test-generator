import { useState, useEffect } from "react";
import { SectionHeader } from "../../../components/layout/SectionHeader";
import { Button } from "../../../components/ui/Button";
import { LoadingSpinner } from "../../../components/ui/LoadingSpinner";
import { FeedbackPanel } from "../../../components/ui/FeedbackPanel";
import { ProgressBar } from "../../../components/ui/ProgressBar";
import { useAdaptive } from "../../../hooks/useAdaptive";
import { useGenerateProblem } from "../../../hooks/useGenerateProblem";
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
  texts: TextBlock[];
}

const MODULE_CONFIG = {
  module1: {
    label: "Module 1",
    textTypes: "email, SNS post, event poster, bulletin board notice",
    cefrLevel: "B1-B2",
    wordCount: "50-120",
    distractorDifficulty: "medium",
  },
  module2Hard: {
    label: "Module 2 Hard",
    textTypes: "multi-person chat thread, email reply chain, policy excerpt, complex schedule",
    cefrLevel: "B2-C1",
    wordCount: "100-150",
    distractorDifficulty: "high",
  },
  module2Easy: {
    label: "Module 2 Easy",
    textTypes: "restaurant menu, simple SNS post, receipt, short notice, text message",
    cefrLevel: "A2-B1",
    wordCount: "15-80",
    distractorDifficulty: "low",
  },
};

export function ReadDailyLifePage() {
  const adaptive = useAdaptive();
  const [textIdx, setTextIdx] = useState(0);
  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const cfg = MODULE_CONFIG[adaptive.state.module];

  const { data, loading, error, generate } = useGenerateProblem<ProblemData>({
    promptPath: "/prompts/toefl/reading/read-in-daily-life.json",
  });

  const loadModule = (module: keyof typeof MODULE_CONFIG) => {
    const c = MODULE_CONFIG[module];
    generate({
      module,
      textTypes: c.textTypes,
      cefrLevel: c.cefrLevel,
      wordCount: c.wordCount,
      distractorDifficulty: c.distractorDifficulty,
    });
  };

  useEffect(() => {
    loadModule("module1");
  }, []);

  // Flatten all questions across texts
  const allQuestions: { text: TextBlock; question: Question }[] = [];
  if (data) {
    data.texts.forEach((t) => t.questions.forEach((q) => allQuestions.push({ text: t, question: q })));
  }

  const totalQ = allQuestions.length;
  const globalIdx = textIdx === 0
    ? qIdx
    : data ? data.texts.slice(0, textIdx).reduce((s, t) => s + t.questions.length, 0) + qIdx : 0;

  const currentText = data?.texts[textIdx];
  const currentQ = currentText?.questions[qIdx];

  const handleSelect = (i: number) => {
    if (showFeedback) return;
    setSelected(i);
  };

  const handleCheck = () => {
    if (selected === null || !currentQ) return;
    const correct = selected === currentQ.correctIndex;
    if (adaptive.state.phase === "module1") {
      adaptive.recordModule1Answer(correct);
    } else {
      adaptive.recordModule2Answer(correct);
    }
    setShowFeedback(true);
  };

  const handleNext = () => {
    if (!data) return;
    setSelected(null);
    setShowFeedback(false);

    const nextQIdx = qIdx + 1;
    if (nextQIdx < (currentText?.questions.length ?? 0)) {
      setQIdx(nextQIdx);
      return;
    }
    const nextTextIdx = textIdx + 1;
    if (nextTextIdx < data.texts.length) {
      setTextIdx(nextTextIdx);
      setQIdx(0);
      return;
    }

    // All questions in current module answered
    if (adaptive.state.phase === "module1") {
      adaptive.finishModule1();
    } else {
      adaptive.finishModule2();
    }
  };

  const handleStartModule2 = () => {
    const branch = adaptive.state.module;
    adaptive.startModule2();
    setTextIdx(0);
    setQIdx(0);
    loadModule(branch);
  };

  const handleRestart = () => {
    adaptive.reset();
    setTextIdx(0);
    setQIdx(0);
    setSelected(null);
    setShowFeedback(false);
    loadModule("module1");
  };

  const phase = adaptive.state.phase;

  return (
    <div>
      <SectionHeader
        title="Read in Daily Life"
        subtitle="日常テキストを読んで設問に答えてください（アダプティブ形式）"
        backTo="/toefl"
      />

      {/* Phase: branching */}
      {phase === "branching" && (
        <div className={styles.branchCard}>
          <div className={styles.branchHeader}>
            <span className={styles.branchIcon}>✓</span>
            <h2>Module 1 完了！</h2>
          </div>
          <p className={styles.branchScore}>
            正答率: <strong>{adaptive.module1Pct}%</strong>
            {" "}({adaptive.state.module1Correct}/{adaptive.state.module1Total})
          </p>
          <div className={[styles.branchBadge, adaptive.state.module === "module2Hard" ? styles.hard : styles.easy].join(" ")}>
            {adaptive.state.module === "module2Hard"
              ? "Module 2 Hard に進みます（スコア上限なし）"
              : "Module 2 Easy に進みます（スコア上限 4.0）"}
          </div>
          <Button size="lg" onClick={handleStartModule2}>Module 2 を開始</Button>
        </div>
      )}

      {/* Phase: complete */}
      {phase === "complete" && (
        <div className={styles.resultCard}>
          <h2 className={styles.resultTitle}>セッション完了</h2>
          <div className={styles.resultModules}>
            <div className={styles.moduleResult}>
              <span className={styles.moduleLabel}>Module 1</span>
              <span className={styles.moduleScore}>
                {adaptive.state.module1Correct}/{adaptive.state.module1Total}（{adaptive.module1Pct}%）
              </span>
            </div>
            <div className={styles.moduleResult}>
              <span className={styles.moduleLabel}>{MODULE_CONFIG[adaptive.state.module].label}</span>
              <span className={styles.moduleScore}>
                {adaptive.state.module2Correct}/{adaptive.state.module2Total}
                （{adaptive.state.module2Total > 0
                  ? Math.round((adaptive.state.module2Correct / adaptive.state.module2Total) * 100)
                  : 0}%）
              </span>
            </div>
          </div>
          <ProgressBar current={adaptive.totalCorrect} total={adaptive.totalQuestions} label="総合正答率" />
          <div className={styles.bandScore}>
            <span className={styles.bandLabel}>バンドスコア目安</span>
            <span className={styles.bandValue}>{adaptive.getBandScore()}</span>
          </div>
          <div className={styles.branchInfo}>
            {adaptive.state.module === "module2Hard"
              ? "Hard ルート通過 — 高い得点帯を狙えます"
              : "Easy ルート通過 — 基礎読解力を強化しましょう"}
          </div>
          <Button size="lg" onClick={handleRestart}>もう一度挑戦</Button>
        </div>
      )}

      {/* Phase: module1 or module2 — questions */}
      {(phase === "module1" || phase === "module2") && (
        <>
          <div className={styles.moduleBar}>
            <span className={styles.moduleTag}>{cfg.label}</span>
            {totalQ > 0 && (
              <ProgressBar current={globalIdx} total={totalQ} />
            )}
          </div>

          {loading && <LoadingSpinner message={`${cfg.label} の問題を生成中...`} />}
          {error && <p className={styles.error}>エラー: {error}</p>}

          {data && !loading && currentText && currentQ && (
            <div className={styles.layout}>
              <div className={styles.textCard}>
                <div className={styles.textMeta}>{currentText.textType}</div>
                <p className={styles.textContent}>{currentText.content}</p>
              </div>

              <div className={styles.questionCard}>
                <p className={styles.qNum}>問題 {globalIdx + 1} / {totalQ}</p>
                <p className={styles.stem}>{currentQ.stem}</p>
                <div className={styles.options}>
                  {currentQ.options.map((opt, i) => (
                    <button
                      key={i}
                      className={[
                        styles.option,
                        selected === i ? styles.selected : "",
                        showFeedback && i === currentQ.correctIndex ? styles.correctOpt : "",
                        showFeedback && selected === i && i !== currentQ.correctIndex ? styles.wrongOpt : "",
                      ].join(" ")}
                      onClick={() => handleSelect(i)}
                    >
                      <span className={styles.optLabel}>{String.fromCharCode(65 + i)}</span>
                      {opt}
                    </button>
                  ))}
                </div>

                {showFeedback && (
                  <FeedbackPanel
                    correct={selected === currentQ.correctIndex}
                    explanation={currentQ.explanation}
                  />
                )}

                <div className={styles.btnRow}>
                  {!showFeedback ? (
                    <Button onClick={handleCheck} disabled={selected === null}>確認</Button>
                  ) : (
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

import { useState, useEffect } from "react";
import { SectionHeader } from "../../../components/layout/SectionHeader";
import { Button } from "../../../components/ui/Button";
import { LoadingSpinner } from "../../../components/ui/LoadingSpinner";
import { FeedbackPanel } from "../../../components/ui/FeedbackPanel";
import { ProgressBar } from "../../../components/ui/ProgressBar";
import { useGenerateProblem } from "../../../hooks/useGenerateProblem";
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

const DIFFICULTIES = [
  { value: "Module 1 (Standard)", label: "Module 1 標準" },
  { value: "Module 2 Easy", label: "Module 2 Easy" },
  { value: "Module 2 Hard", label: "Module 2 Hard" },
];

const TOPICS = [
  "evolutionary biology", "plate tectonics", "behavioral economics",
  "ancient civilizations", "cognitive psychology", "climate science",
  "linguistics and language acquisition", "quantum physics basics",
];

export function ReadAcademicPage() {
  const [difficulty, setDifficulty] = useState(DIFFICULTIES[0].value);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];

  const { data, loading, error, generate } = useGenerateProblem<ProblemData>({
    promptPath: "/prompts/toefl/reading/read-academic-passage.json",
    variables: { difficulty, topic },
  });

  useEffect(() => { generate({ difficulty, topic }); }, []);

  const resetState = () => {
    setCurrent(0);
    setSelected(null);
    setShowFeedback(false);
    setScore(0);
    setDone(false);
  };

  const handleNew = () => {
    resetState();
    generate({
      difficulty,
      topic: TOPICS[Math.floor(Math.random() * TOPICS.length)],
    });
  };

  const handleSelect = (idx: number) => {
    if (showFeedback) return;
    setSelected(idx);
  };

  const handleCheck = () => {
    if (selected === null || !data) return;
    const q = data.questions[current];
    if (selected === q.correctIndex) setScore((s) => s + 1);
    setShowFeedback(true);
  };

  const handleNext = () => {
    if (!data) return;
    if (current + 1 >= data.questions.length) {
      setDone(true);
    } else {
      setCurrent((c) => c + 1);
      setSelected(null);
      setShowFeedback(false);
    }
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

      <div className={styles.controls}>
        <div className={styles.difficultySelector}>
          {DIFFICULTIES.map((d) => (
            <button
              key={d.value}
              className={[styles.diffBtn, difficulty === d.value ? styles.active : ""].join(" ")}
              onClick={() => setDifficulty(d.value)}
            >
              {d.label}
            </button>
          ))}
        </div>
        <Button variant="secondary" size="sm" onClick={handleNew} disabled={loading}>
          新しい問題
        </Button>
      </div>

      {loading && <LoadingSpinner />}
      {error && <p className={styles.error}>エラー: {error}</p>}

      {data && !loading && !done && (
        <div className={styles.layout}>
          <div className={styles.passageCard}>
            <h2 className={styles.passageTitle}>{data.title}</h2>
            <p className={styles.passage}>{data.passage}</p>
          </div>

          {q && (
            <div className={styles.questionCard}>
              <p className={styles.qNum}>問題 {current + 1} / {data.questions.length}</p>
              <p className={styles.stem}>{q.stem}</p>
              <div className={styles.options}>
                {q.options.map((opt, i) => (
                  <button
                    key={i}
                    className={[
                      styles.option,
                      selected === i ? styles.selected : "",
                      showFeedback && i === q.correctIndex ? styles.correctOpt : "",
                      showFeedback && selected === i && i !== q.correctIndex ? styles.wrongOpt : "",
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
                    {current + 1 < data.questions.length ? "次の問題" : "結果を見る"}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {done && data && (
        <div className={styles.resultCard}>
          <h2 className={styles.resultTitle}>セクション完了</h2>
          <div className={styles.scoreBox}>
            <span className={styles.scoreNum}>{score}</span>
            <span className={styles.scoreDen}>/{data.questions.length}</span>
            <span className={styles.scorePct}>
              ({Math.round((score / data.questions.length) * 100)}%)
            </span>
          </div>
          <ProgressBar current={score} total={data.questions.length} label="正答率" />
          <Button onClick={handleNew} size="lg">新しいパッセージ</Button>
        </div>
      )}
    </div>
  );
}

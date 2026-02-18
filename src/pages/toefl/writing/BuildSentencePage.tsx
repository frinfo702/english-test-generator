import { useState, useEffect } from "react";
import { SectionHeader } from "../../../components/layout/SectionHeader";
import { Button } from "../../../components/ui/Button";
import { LoadingSpinner } from "../../../components/ui/LoadingSpinner";
import { ProgressBar } from "../../../components/ui/ProgressBar";
import { useGenerateProblem } from "../../../hooks/useGenerateProblem";
import styles from "./BuildSentencePage.module.css";

interface Sentence {
  id: string;
  chunks: string[];
  correctOrder: number[];
  fullSentence: string;
}

interface ProblemData {
  sentences: Sentence[];
}

const DIFFICULTIES = [
  { value: "Module 1 (Standard)", label: "Module 1 標準" },
  { value: "Module 2 Easy", label: "Module 2 Easy" },
  { value: "Module 2 Hard", label: "Module 2 Hard" },
];

export function BuildSentencePage() {
  const [difficulty, setDifficulty] = useState(DIFFICULTIES[0].value);
  const [current, setCurrent] = useState(0);
  const [placed, setPlaced] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const { data, loading, error, generate } = useGenerateProblem<ProblemData>({
    promptPath: "/prompts/toefl/writing/build-a-sentence.json",
    variables: { difficulty },
  });

  useEffect(() => { generate({ difficulty }); }, []);

  const resetForSentence = () => {
    setPlaced([]);
    setSubmitted(false);
  };

  const handleNew = () => {
    setCurrent(0);
    setScore(0);
    setDone(false);
    resetForSentence();
    generate({ difficulty });
  };

  const sentence = data?.sentences[current];
  const pool = sentence ? sentence.chunks.map((_, i) => i).filter((i) => !placed.includes(i)) : [];

  const handlePlace = (chunkIdx: number) => {
    if (submitted) return;
    setPlaced((p) => [...p, chunkIdx]);
  };

  const handleRemove = (pos: number) => {
    if (submitted) return;
    setPlaced((p) => p.filter((_, i) => i !== pos));
  };

  const handleCheck = () => {
    if (!sentence) return;
    const correct = placed.every((chunkIdx, pos) => sentence.correctOrder[pos] === chunkIdx);
    if (correct) setScore((s) => s + 1);
    setSubmitted(true);
  };

  const handleNext = () => {
    if (!data) return;
    if (current + 1 >= data.sentences.length) {
      setDone(true);
    } else {
      setCurrent((c) => c + 1);
      resetForSentence();
    }
  };

  const isCorrect = sentence
    ? placed.every((chunkIdx, pos) => sentence.correctOrder[pos] === chunkIdx) && placed.length === sentence.chunks.length
    : false;

  return (
    <div>
      <SectionHeader
        title="Build a Sentence"
        subtitle="チャンクを正しい順序に並べて文を完成させてください"
        backTo="/toefl"
        current={done ? data?.sentences.length : current}
        total={data?.sentences.length}
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
          新しい問題セット
        </Button>
      </div>

      {loading && <LoadingSpinner />}
      {error && <p className={styles.error}>エラー: {error}</p>}

      {data && !loading && !done && sentence && (
        <div className={styles.card}>
          <p className={styles.qNum}>問題 {current + 1} / {data.sentences.length}</p>

          {/* Answer zone */}
          <div className={styles.zone}>
            <p className={styles.zoneLabel}>回答欄（クリックで取り除く）</p>
            <div className={styles.slots}>
              {placed.length === 0
                ? <span className={styles.placeholder}>チャンクを下から選んでください</span>
                : placed.map((chunkIdx, pos) => (
                  <button
                    key={pos}
                    className={[
                      styles.chip,
                      styles.placed,
                      submitted ? (isCorrect ? styles.correctChip : styles.wrongChip) : "",
                    ].join(" ")}
                    onClick={() => handleRemove(pos)}
                  >
                    {sentence.chunks[chunkIdx]}
                  </button>
                ))}
            </div>
          </div>

          {/* Pool */}
          <div className={styles.zone}>
            <p className={styles.zoneLabel}>語句プール（クリックで配置）</p>
            <div className={styles.slots}>
              {pool.map((chunkIdx) => (
                <button
                  key={chunkIdx}
                  className={[styles.chip, styles.poolChip].join(" ")}
                  onClick={() => handlePlace(chunkIdx)}
                  disabled={submitted}
                >
                  {sentence.chunks[chunkIdx]}
                </button>
              ))}
            </div>
          </div>

          {submitted && (
            <div className={[styles.feedback, isCorrect ? styles.fbCorrect : styles.fbWrong].join(" ")}>
              <p className={styles.fbStatus}>{isCorrect ? "✓ 正解！" : "✗ 不正解"}</p>
              {!isCorrect && (
                <p className={styles.fbAnswer}>正解: <strong>{sentence.fullSentence}</strong></p>
              )}
            </div>
          )}

          <div className={styles.btnRow}>
            {!submitted ? (
              <Button onClick={handleCheck} disabled={placed.length !== sentence.chunks.length}>
                確認
              </Button>
            ) : (
              <Button onClick={handleNext}>
                {current + 1 < data.sentences.length ? "次の問題" : "結果を見る"}
              </Button>
            )}
          </div>
        </div>
      )}

      {done && data && (
        <div className={styles.resultCard}>
          <h2>セクション完了</h2>
          <div className={styles.scoreBox}>
            <span className={styles.scoreNum}>{score}</span>
            <span className={styles.scoreDen}>/{data.sentences.length}</span>
            <span className={styles.scorePct}>({Math.round((score / data.sentences.length) * 100)}%)</span>
          </div>
          <ProgressBar current={score} total={data.sentences.length} label="正答率" />
          <Button onClick={handleNew} size="lg">新しい問題セット</Button>
        </div>
      )}
    </div>
  );
}

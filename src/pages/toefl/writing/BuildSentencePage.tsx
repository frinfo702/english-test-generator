import { useState, useEffect } from "react";
import { SectionHeader } from "../../../components/layout/SectionHeader";
import { Button } from "../../../components/ui/Button";
import { LoadingSpinner } from "../../../components/ui/LoadingSpinner";
import { ProgressBar } from "../../../components/ui/ProgressBar";
import { useQuestion } from "../../../hooks/useQuestion";
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

export function BuildSentencePage() {
  const { data, loading, error, load } = useQuestion<ProblemData>(
    "toefl/writing/build-sentence",
  );
  const [current, setCurrent] = useState(0);
  const [placed, setPlaced] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const resetForSentence = () => {
    setPlaced([]);
    setSubmitted(false);
  };

  const handleNew = () => {
    setCurrent(0);
    setScore(0);
    setDone(false);
    resetForSentence();
    load();
  };

  const sentence = data?.sentences[current];
  const pool = sentence
    ? sentence.chunks.map((_, i) => i).filter((i) => !placed.includes(i))
    : [];

  const handlePlace = (chunkIdx: number) => {
    if (!submitted) setPlaced((p) => [...p, chunkIdx]);
  };
  const handleRemove = (pos: number) => {
    if (!submitted) setPlaced((p) => p.filter((_, i) => i !== pos));
  };

  const handleCheck = () => {
    if (!sentence) return;
    const correct = placed.every(
      (chunkIdx, pos) => sentence.correctOrder[pos] === chunkIdx,
    );
    if (correct) setScore((s) => s + 1);
    setSubmitted(true);
  };

  const handleNext = () => {
    if (!data) return;
    if (current + 1 >= data.sentences.length) {
      setDone(true);
      return;
    }
    setCurrent((c) => c + 1);
    resetForSentence();
  };

  const isCorrect = sentence
    ? placed.length === sentence.chunks.length &&
      placed.every((chunkIdx, pos) => sentence.correctOrder[pos] === chunkIdx)
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
            questions/toefl/writing/build-sentence/
            に問題JSONを追加してください。
          </p>
        </div>
      )}

      {data && !loading && !done && sentence && (
        <div className={styles.card}>
          <p className={styles.qNum}>
            問題 {current + 1} / {data.sentences.length}
          </p>
          <div className={styles.zone}>
            <p className={styles.zoneLabel}>回答欄（クリックで取り除く）</p>
            <div className={styles.slots}>
              {placed.length === 0 ? (
                <span className={styles.placeholder}>
                  チャンクを下から選んでください
                </span>
              ) : (
                placed.map((chunkIdx, pos) => (
                  <button
                    key={pos}
                    className={[
                      styles.chip,
                      styles.placed,
                      submitted
                        ? isCorrect
                          ? styles.correctChip
                          : styles.wrongChip
                        : "",
                    ].join(" ")}
                    onClick={() => handleRemove(pos)}
                  >
                    {sentence.chunks[chunkIdx]}
                  </button>
                ))
              )}
            </div>
          </div>
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
            <div
              className={[
                styles.feedback,
                isCorrect ? styles.fbCorrect : styles.fbWrong,
              ].join(" ")}
            >
              <p className={styles.fbStatus}>
                {isCorrect ? "✓ 正解！" : "✗ 不正解"}
              </p>
              {!isCorrect && (
                <p className={styles.fbAnswer}>
                  正解: <strong>{sentence.fullSentence}</strong>
                </p>
              )}
            </div>
          )}

          <div className={styles.btnRow}>
            {!submitted ? (
              <Button
                onClick={handleCheck}
                disabled={placed.length !== sentence.chunks.length}
              >
                確認
              </Button>
            ) : (
              <Button onClick={handleNext}>
                {current + 1 < data.sentences.length
                  ? "次の問題"
                  : "結果を見る"}
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
            <span className={styles.scorePct}>
              ({Math.round((score / data.sentences.length) * 100)}%)
            </span>
          </div>
          <ProgressBar
            current={score}
            total={data.sentences.length}
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

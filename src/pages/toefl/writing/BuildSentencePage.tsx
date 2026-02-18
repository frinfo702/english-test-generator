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
  const [allPlaced, setAllPlaced] = useState<Record<number, number[]>>({});
  const [graded, setGraded] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const handleNew = () => {
    setCurrent(0);
    setAllPlaced({});
    setGraded(false);
    load();
  };

  const sentence = data?.sentences[current];
  const placed = allPlaced[current] ?? [];
  const pool = sentence
    ? sentence.chunks.map((_, i) => i).filter((i) => !placed.includes(i))
    : [];

  const setPlaced = (newPlaced: number[]) => {
    setAllPlaced((s) => ({ ...s, [current]: newPlaced }));
  };

  const handlePlace = (chunkIdx: number) => {
    if (!graded) setPlaced([...placed, chunkIdx]);
  };
  const handleRemove = (pos: number) => {
    if (!graded) setPlaced(placed.filter((_, i) => i !== pos));
  };

  const isComplete =
    sentence != null && placed.length === sentence.chunks.length;
  const totalSentences = data?.sentences.length ?? 0;
  const allComplete =
    totalSentences > 0 &&
    data!.sentences.every(
      (s, i) => (allPlaced[i] ?? []).length === s.chunks.length,
    );
  const isLastSentence = data ? current + 1 >= totalSentences : false;

  const isCorrectFor = (idx: number) => {
    const s = data?.sentences[idx];
    const p = allPlaced[idx] ?? [];
    if (!s || p.length !== s.chunks.length) return false;
    return p.every((chunkIdx, pos) => s.correctOrder[pos] === chunkIdx);
  };

  const isCorrect = isCorrectFor(current);
  const score = data
    ? data.sentences.filter((_, i) => isCorrectFor(i)).length
    : 0;

  const handleNext = () => {
    setCurrent((c) => c + 1);
  };
  const handlePrev = () => {
    setCurrent((c) => c - 1);
  };
  const handleSubmit = () => {
    setGraded(true);
    setCurrent(0);
  };

  return (
    <div>
      <SectionHeader
        title="Build a Sentence"
        subtitle="チャンクを正しい順序に並べて文を完成させてください"
        backTo="/toefl"
        current={
          data
            ? data.sentences.filter(
                (s, i) => (allPlaced[i] ?? []).length === s.chunks.length,
              ).length
            : 0
        }
        total={totalSentences}
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

      {data && !loading && sentence && (
        <>
          {graded && (
            <div className={styles.resultCard}>
              <h2>セクション完了</h2>
              <div className={styles.scoreBox}>
                <span className={styles.scoreNum}>{score}</span>
                <span className={styles.scoreDen}>/{totalSentences}</span>
                <span className={styles.scorePct}>
                  ({Math.round((score / totalSentences) * 100)}%)
                </span>
              </div>
              <ProgressBar
                current={score}
                total={totalSentences}
                label="正答率"
              />
              <Button onClick={handleNew} size="lg">
                別の問題セット
              </Button>
            </div>
          )}

          <div className={styles.card}>
            <p className={styles.qNum}>
              問題 {current + 1} / {totalSentences}
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
                        graded
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
                    disabled={graded}
                  >
                    {sentence.chunks[chunkIdx]}
                  </button>
                ))}
              </div>
            </div>

            {graded && (
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
              {current > 0 && (
                <Button variant="secondary" onClick={handlePrev}>
                  前の問題
                </Button>
              )}
              {!graded && !isLastSentence && isComplete && (
                <Button onClick={handleNext}>次の問題</Button>
              )}
              {!graded && isLastSentence && allComplete && (
                <Button onClick={handleSubmit} size="lg">
                  提出する
                </Button>
              )}
              {graded && current + 1 < totalSentences && (
                <Button onClick={handleNext}>次の問題</Button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

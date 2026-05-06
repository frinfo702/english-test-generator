import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { SectionHeader } from "../../../components/layout/SectionHeader";
import { Button } from "../../../components/ui/Button";
import { FloatingElapsedTimer } from "../../../components/ui/FloatingElapsedTimer";
import { LoadingSpinner } from "../../../components/ui/LoadingSpinner";
import { ProgressBar } from "../../../components/ui/ProgressBar";
import { useElapsedTimer } from "../../../hooks/useElapsedTimer";
import { useQuestion } from "../../../hooks/useQuestion";
import { useScoreHistory } from "../../../hooks/useScoreHistory";
import styles from "./BuildSentencePage.module.css";

interface Sentence {
  id: string;
  reference: string;
  chunks: string[];
  correctOrder: number[];
  fullSentence: string;
}

interface ProblemData {
  sentences: Sentence[];
}

const TASK_ID = "toefl/writing/build-sentence";

export function BuildSentencePage() {
  const navigate = useNavigate();
  const { questionNumber } = useParams<{ questionNumber: string }>();
  const { data, file, loading, error, loadByQuestionNumber } = useQuestion<ProblemData>(TASK_ID);
  const { saveScore } = useScoreHistory();
  const {
    display,
    elapsedSeconds,
    running,
    start,
    stop,
    reset: resetTimer,
  } = useElapsedTimer();
  const [current, setCurrent] = useState(0);
  const [allPlaced, setAllPlaced] = useState<Record<number, number[]>>({});
  const [phase, setPhase] = useState<"pre" | "answering" | "submitted">("pre");
  const graded = phase === "submitted";

  const parsedQuestionNumber = Number.parseInt(questionNumber ?? "", 10);
  const hasValidQuestionNumber =
    Number.isInteger(parsedQuestionNumber) && parsedQuestionNumber > 0;

  useEffect(() => {
    if (!hasValidQuestionNumber) return;
    loadByQuestionNumber(parsedQuestionNumber);
  }, [hasValidQuestionNumber, loadByQuestionNumber, parsedQuestionNumber]);

  const handleBackToList = () => {
    resetTimer();
    setCurrent(0);
    setAllPlaced({});
    setPhase("pre");
    navigate("/toefl/writing/build-sentence");
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
    if (!data || graded) return;
    const sessionSeconds = stop();
    const correct = data.sentences.filter((_, i) => isCorrectFor(i)).length;
    saveScore(TASK_ID, correct, data.sentences.length, sessionSeconds, file ?? undefined);
    setPhase("submitted");
  };
  const handleStart = () => {
    setPhase("answering");
    start();
  };
  const displayChunk = (chunk: string) => chunk.toLowerCase();

  return (
    <div>
      {(running || elapsedSeconds > 0) && (
        <FloatingElapsedTimer display={display} running={running} />
      )}

      <SectionHeader
        title="Build a Sentence"
        subtitle="Reorder word chunks to build a response to the prompt."
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
          onClick={handleBackToList}
          disabled={loading}
        >
          Question List
        </Button>
      </div>

      {loading && <LoadingSpinner message="Loading question set..." />}
      {error && (
        <div className={styles.error}>
          <p>{error}</p>
          <p className={styles.errorHint}>
            Add question JSON under questions/toefl/writing/build-sentence/.
          </p>
        </div>
      )}
      {!hasValidQuestionNumber && (
        <div className={styles.error}>
          <p>Invalid question number in URL.</p>
        </div>
      )}

      {data && !loading && hasValidQuestionNumber && sentence && (
        <>
          {phase === "pre" && (
            <div className={styles.startCard}>
              <p>Press Start when ready. The timer will begin immediately.</p>
              <Button size="lg" onClick={handleStart}>
                Start
              </Button>
            </div>
          )}

          {graded && (
            <div className={styles.resultCard}>
              <h2>Section Complete</h2>
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
                label="Accuracy"
              />
              <Button onClick={handleBackToList} size="lg">
                Back to Question List
              </Button>
            </div>
          )}

          {phase !== "pre" && (
            <div className={styles.card}>
              <p className={styles.qNum}>
                Question {current + 1} / {totalSentences}
              </p>
              <div className={styles.referenceBox}>
                <p className={styles.referenceLabel}>Reference</p>
                <p className={styles.referenceText}>{sentence.reference}</p>
              </div>
              <div className={styles.zone}>
                <p className={styles.zoneLabel}>
                  Answer Area (click to remove)
                </p>
                <div className={styles.slots}>
                  {placed.length === 0 ? (
                    <span className={styles.placeholder}>
                      Select chunks from the pool below
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
                        {displayChunk(sentence.chunks[chunkIdx])}
                      </button>
                    ))
                  )}
                </div>
              </div>
              <div className={styles.zone}>
                <p className={styles.zoneLabel}>Chunk Pool (click to place)</p>
                <div className={styles.slots}>
                  {pool.map((chunkIdx) => (
                    <button
                      key={chunkIdx}
                      className={[styles.chip, styles.poolChip].join(" ")}
                      onClick={() => handlePlace(chunkIdx)}
                      disabled={graded}
                    >
                      {displayChunk(sentence.chunks[chunkIdx])}
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
                    {isCorrect ? "✓ Correct" : "✗ Incorrect"}
                  </p>
                  {!isCorrect && (
                    <p className={styles.fbAnswer}>
                      Correct answer: <strong>{sentence.fullSentence}</strong>
                    </p>
                  )}
                </div>
              )}

              <div className={styles.btnRow}>
                {current > 0 && (
                  <Button variant="secondary" onClick={handlePrev}>
                    Previous
                  </Button>
                )}
                {!graded && !isLastSentence && isComplete && (
                  <Button onClick={handleNext}>Next</Button>
                )}
                {!graded && isLastSentence && allComplete && (
                  <Button onClick={handleSubmit} size="lg">
                    Submit
                  </Button>
                )}
                {graded && current + 1 < totalSentences && (
                  <Button onClick={handleNext}>Next</Button>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

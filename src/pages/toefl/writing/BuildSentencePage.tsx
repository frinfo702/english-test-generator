import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";
import { SectionHeader } from "../../../components/layout/SectionHeader";
import { BackButton } from "../../../components/ui/BackButton";
import { Button } from "../../../components/ui/Button";
import { CardStack } from "../../../components/ui/CardStack";
import { FloatingElapsedTimer } from "../../../components/ui/FloatingElapsedTimer";
import { LoadingSpinner } from "../../../components/ui/LoadingSpinner";
import { ProgressBar } from "../../../components/ui/ProgressBar";
import { useElapsedTimer } from "../../../hooks/useElapsedTimer";
import { useQuestion } from "../../../hooks/useQuestion";
import { useScoreHistory } from "../../../hooks/useScoreHistory";
import { NextQuestionButton } from "../../../components/question/NextQuestionButton";
import styles from "./BuildSentencePage.module.css";
import {
  applyDrop,
  emptySlots,
  isCorrectOrder,
  poolChunks,
  type DragSource,
  type DropTarget,
  endPunctuation,
  type Slots,
} from "./buildSentence";
import { useChunkDrag } from "./useChunkDrag";
import { PixelCheckIcon } from "../../../components/ui/PixelCheckIcon";

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
  const { data, file, loading, error, loadByQuestionNumber } =
    useQuestion<ProblemData>(TASK_ID);
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
  const [allSlots, setAllSlots] = useState<Record<number, Slots>>({});
  const [phase, setPhase] = useState<"answering" | "submitted">("answering");
  const graded = phase === "submitted";

  const parsedQuestionNumber = Number.parseInt(questionNumber ?? "", 10);
  const hasValidQuestionNumber =
    Number.isInteger(parsedQuestionNumber) && parsedQuestionNumber > 0;

  useEffect(() => {
    if (!hasValidQuestionNumber) return;
    loadByQuestionNumber(parsedQuestionNumber);
  }, [hasValidQuestionNumber, loadByQuestionNumber, parsedQuestionNumber]);

  // No "press start" step: the timer runs as soon as the problem is shown.
  useEffect(() => {
    if (
      data &&
      !loading &&
      phase === "answering" &&
      !running &&
      elapsedSeconds === 0
    ) {
      start();
    }
  }, [data, loading, phase, running, elapsedSeconds, start]);

  const handleBackToList = () => {
    resetTimer();
    setCurrent(0);
    setAllSlots({});
    setPhase("answering");
    navigate(`/${TASK_ID}`);
  };

  const sentence = data?.sentences[current];
  const slotsFor = (idx: number): Slots =>
    allSlots[idx] ?? emptySlots(data?.sentences[idx]?.chunks.length ?? 0);
  const slots = slotsFor(current);
  const pool = sentence ? poolChunks(sentence.chunks.length, slots) : [];

  const handleDrop = (source: DragSource, target: DropTarget) => {
    if (graded) return;
    setAllSlots((s) => ({
      ...s,
      [current]: applyDrop(
        s[current] ?? emptySlots(sentence?.chunks.length ?? 0),
        source,
        target,
      ),
    }));
  };
  const { ghost, over, startDrag, isDragClick } = useChunkDrag(
    phase === "answering",
    handleDrop,
  );

  // Clicking still works as a shortcut: pool → first empty blank, blank → pool.
  const handlePoolClick = (chunkIdx: number) => {
    if (isDragClick()) return;
    const firstEmpty = slots.indexOf(null);
    if (firstEmpty === -1) return;
    handleDrop(
      { kind: "pool", chunk: chunkIdx },
      { kind: "slot", index: firstEmpty },
    );
  };
  const handleSlotClick = (pos: number) => {
    if (isDragClick()) return;
    handleDrop({ kind: "slot", index: pos }, { kind: "pool" });
  };

  const isDraggingSlot = (pos: number) =>
    ghost?.source.kind === "slot" && ghost.source.index === pos;
  const isDraggingChunk = (chunkIdx: number) =>
    ghost?.source.kind === "pool" && ghost.source.chunk === chunkIdx;
  const isOverSlot = (pos: number) =>
    over?.kind === "slot" && over.index === pos;

  const totalSentences = data?.sentences.length ?? 0;
  const isLastSentence = data ? current + 1 >= totalSentences : false;

  const isCorrectFor = (idx: number) => {
    const s = data?.sentences[idx];
    return s != null && isCorrectOrder(slotsFor(idx), s.correctOrder);
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
    saveScore(
      TASK_ID,
      correct,
      data.sentences.length,
      sessionSeconds,
      file ?? undefined,
    );
    setPhase("submitted");
  };
  const displayChunk = (chunk: string) => chunk.toLowerCase();
  const endMark = sentence ? endPunctuation(sentence.fullSentence) : ".";

  return (
    <div>
      {(running || elapsedSeconds > 0) && (
        <FloatingElapsedTimer display={display} running={running} />
      )}

      <SectionHeader
        title="Build a Sentence"
        subtitle="Reorder word chunks to build a response to the prompt."
        backTo="/toefl"
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

      {loading && <LoadingSpinner message="Loading question..." />}
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
              <div className={styles.actions}>
                <BackButton onClick={handleBackToList} size="lg" />
                <NextQuestionButton taskId={TASK_ID} size="lg" />
              </div>
            </div>
          )}

          <CardStack index={current} total={totalSentences}>
            <div className={styles.card}>
              <p className={styles.qNum}>
                Question {current + 1} / {totalSentences}
              </p>
              <div className={styles.referenceBox}>
                <p className={styles.referenceLabel}>Reference</p>
                <p className={styles.referenceText}>{sentence.reference}</p>
              </div>
              <div className={styles.zone}>
                <p className={styles.zoneLabel}>Answer Area</p>
                <div className={styles.blanks}>
                  {slots.map((chunkIdx, pos) => {
                    const blank = (
                      <span
                        key={pos}
                        data-drop="slot"
                        data-slot={pos}
                        className={[
                          styles.blank,
                          isOverSlot(pos) ? styles.blankOver : "",
                        ].join(" ")}
                      >
                        {chunkIdx !== null && (
                          <button
                            className={[
                              styles.chip,
                              styles.placed,
                              graded
                                ? isCorrect
                                  ? styles.correctChip
                                  : styles.wrongChip
                                : "",
                              isDraggingSlot(pos) ? styles.dragging : "",
                            ].join(" ")}
                            onPointerDown={(e) =>
                              startDrag(
                                e,
                                { kind: "slot", index: pos },
                                displayChunk(sentence.chunks[chunkIdx]),
                              )
                            }
                            onClick={() => handleSlotClick(pos)}
                            disabled={graded}
                          >
                            {displayChunk(sentence.chunks[chunkIdx])}
                          </button>
                        )}
                      </span>
                    );
                    // Keep the end mark on the same line as the last blank.
                    return pos === slots.length - 1 ? (
                      <span key={pos} className={styles.lastBlank}>
                        {blank}
                        <span className={styles.endMark}>{endMark}</span>
                      </span>
                    ) : (
                      blank
                    );
                  })}
                </div>
              </div>
              <div className={styles.zone}>
                <p className={styles.zoneLabel}>
                  Chunk Pool (drag onto a blank)
                </p>
                <div
                  data-drop="pool"
                  className={[
                    styles.slots,
                    over?.kind === "pool" && ghost?.source.kind === "slot"
                      ? styles.poolOver
                      : "",
                  ].join(" ")}
                >
                  {pool.map((chunkIdx) => (
                    <button
                      key={chunkIdx}
                      className={[
                        styles.chip,
                        styles.poolChip,
                        isDraggingChunk(chunkIdx) ? styles.dragging : "",
                      ].join(" ")}
                      onPointerDown={(e) =>
                        startDrag(
                          e,
                          { kind: "pool", chunk: chunkIdx },
                          displayChunk(sentence.chunks[chunkIdx]),
                        )
                      }
                      onClick={() => handlePoolClick(chunkIdx)}
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
                    {isCorrect ? "Correct" : "Incorrect"}
                  </p>
                  {!isCorrect && (
                    <p className={styles.fbAnswer}>
                      Correct answer:{" "}
                      <strong>
                        {sentence.fullSentence.replace(/[.?!]$/, "")}
                        {endMark}
                      </strong>
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
                {!graded && !isLastSentence && (
                  <Button onClick={handleNext}>Next</Button>
                )}
                {!graded && isLastSentence && (
                  <Button onClick={handleSubmit} size="lg">
                    Submit
                    <PixelCheckIcon />
                  </Button>
                )}
                {!graded && (
                  <NextQuestionButton taskId={TASK_ID} variant="secondary" />
                )}
                {graded && current + 1 < totalSentences && (
                  <Button onClick={handleNext}>Next</Button>
                )}
              </div>
            </div>
          </CardStack>
        </>
      )}
      {ghost &&
        createPortal(
          <div
            className={[styles.chip, styles.poolChip, styles.ghost].join(" ")}
            style={{ left: ghost.left, top: ghost.top, width: ghost.width }}
            aria-hidden="true"
          >
            {ghost.label}
          </div>,
          document.body,
        )}
    </div>
  );
}

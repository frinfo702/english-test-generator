import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { SectionHeader } from "../../components/layout/SectionHeader";
import { Button } from "../../components/ui/Button";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { FloatingElapsedTimer } from "../../components/ui/FloatingElapsedTimer";
import { useElapsedTimer } from "../../hooks/useElapsedTimer";
import { useQuestion } from "../../hooks/useQuestion";
import { useScoreHistory } from "../../hooks/useScoreHistory";
import { useTts } from "../../hooks/useTts";
import styles from "./Part1Page.module.css";

interface PhotoQuestion {
  id: string;
  photoDescription: string;
  options: { A: string; B: string; C: string; D: string };
  correct: string;
  explanation: string;
}

interface ProblemData {
  title: string;
  questions: PhotoQuestion[];
  audioSegments: { role: string; text: string }[];
}

const SEGMENTS_PER_QUESTION = 5;

export function Part1Page() {
  const navigate = useNavigate();
  const { questionNumber } = useParams<{ questionNumber: string }>();
  const { data, file, loading, error, loadByQuestionNumber } =
    useQuestion<ProblemData>("toeic/part1");
  const { saveScore } = useScoreHistory();
  const { display, elapsedSeconds, running, start, stop, reset: resetTimer } =
    useElapsedTimer();
  const { loading: ttsLoading, playSegments } = useTts();
  const fileBasename = file ? file.replace(/\.json$/i, "") : "";

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [graded, setGraded] = useState(false);
  const [audioPlayed, setAudioPlayed] = useState<Record<number, boolean>>({});

  const parsedQuestionNumber = Number.parseInt(questionNumber ?? "", 10);
  const hasValidQuestionNumber =
    Number.isInteger(parsedQuestionNumber) && parsedQuestionNumber > 0;

  useEffect(() => {
    if (!hasValidQuestionNumber) return;
    loadByQuestionNumber(parsedQuestionNumber);
  }, [hasValidQuestionNumber, loadByQuestionNumber, parsedQuestionNumber]);

  useEffect(() => {
    if (data && !loading && !graded && !running && elapsedSeconds === 0) {
      start();
    }
  }, [data, loading, graded, running, elapsedSeconds, start]);

  const questions = data?.questions ?? [];

  useEffect(() => {
    if (data && !graded && !audioPlayed[currentIndex]) {
      const startIdx = currentIndex * SEGMENTS_PER_QUESTION;
      const urls = data.audioSegments
        .slice(startIdx, startIdx + SEGMENTS_PER_QUESTION)
        .map((_, i) =>
          `/audio/toeic/part1/${fileBasename}/${startIdx + i + 1}.mp3`
        );
      if (urls.length > 0) {
        playSegments(urls);
        setAudioPlayed((s) => ({ ...s, [currentIndex]: true }));
      }
    }
  }, [data, currentIndex, graded, audioPlayed, playSegments, fileBasename]);

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const allAnswered = questions.every((q) => selected[q.id]);
  const totalCorrect = questions.filter(
    (q) => selected[q.id] === q.correct
  ).length;

  const handleSelect = (opt: string) => {
    if (!currentQuestion || graded) return;
    setSelected((s) => ({ ...s, [currentQuestion.id]: opt }));
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((i) => i + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  };

  const retake = () => {
    if (!graded) return;
    setSelected({});
    setCurrentIndex(0);
    setGraded(false);
    setAudioPlayed({});
    resetTimer();
  };

  const handleSubmit = () => {
    const sessionSeconds = stop();
    if (data) {
      const correct = data.questions.filter(
        (q) => selected[q.id] === q.correct
      ).length;
      saveScore(
        "toeic/part1",
        correct,
        data.questions.length,
        sessionSeconds,
        file ?? undefined
      );
    }
    setGraded(true);
  };

  const handleBackToList = () => {
    resetTimer();
    setCurrentIndex(0);
    setSelected({});
    setGraded(false);
    setAudioPlayed({});
    navigate("/toeic/part1");
  };

  return (
    <div>
      {(running || elapsedSeconds > 0) && (
        <FloatingElapsedTimer display={display} running={running} />
      )}
      <SectionHeader
        title="Part 1: Photographs"
        subtitle="Look at the photo and choose the best description."
        backTo="/toeic"
        current={Object.keys(selected).length}
        total={totalQuestions}
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
            Add question JSON under questions/toeic/part1/.
          </p>
        </div>
      )}
      {!hasValidQuestionNumber && (
        <div className={styles.error}>
          <p>Invalid question number in URL.</p>
        </div>
      )}

      {data && !loading && hasValidQuestionNumber && (
        <>
          {graded && (
            <div className={styles.resultCard}>
              <h2>Part 1 Complete</h2>
              <div className={styles.scoreBox}>
                <span className={styles.scoreNum}>{totalCorrect}</span>
                <span className={styles.scoreDen}>/{totalQuestions}</span>
                <span className={styles.scorePct}>
                  ({Math.round((totalCorrect / totalQuestions) * 100)}%)
                </span>
              </div>
              <ProgressBar
                current={totalCorrect}
                total={totalQuestions}
                label="Accuracy"
              />
              <div className={styles.resultActions}>
                <Button onClick={retake} size="md" variant="secondary">
                  Retake
                </Button>
                <Button onClick={handleBackToList} size="md">
                  Back to Question List
                </Button>
              </div>
            </div>
          )}

          {!graded && currentQuestion && (
            <div className={styles.questionCard}>
              <div className={styles.qProgress}>
                Question {currentIndex + 1} of {totalQuestions}
              </div>

              <div className={styles.photoBox}>
                <div className={styles.photoIcon}>📷</div>
                <p className={styles.photoDescription}>
                  {currentQuestion.photoDescription}
                </p>
              </div>

              {ttsLoading && (
                <p className={styles.loadingAudio}>Loading audio...</p>
              )}

              <div className={styles.options}>
                {(["A", "B", "C", "D"] as const).map((opt) => {
                  const sel = selected[currentQuestion.id];
                  return (
                    <button
                      key={opt}
                      className={`${styles.option} ${
                        sel === opt ? styles.selected : ""
                      }`}
                      onClick={() => handleSelect(opt)}
                    >
                      <span className={styles.optLabel}>{opt}</span>
                      <span>{currentQuestion.options[opt]}</span>
                    </button>
                  );
                })}
              </div>

              <div className={styles.navButtons}>
                <Button
                  variant="secondary"
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  size="sm"
                >
                  Previous
                </Button>
                <span className={styles.qStatus}>
                  {selected[currentQuestion.id]
                    ? "Answered"
                    : "Select an answer"}
                </span>
                {currentIndex < totalQuestions - 1 ? (
                  <Button
                    onClick={handleNext}
                    disabled={!selected[currentQuestion.id]}
                    size="sm"
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={!allAnswered}
                    size="sm"
                  >
                    Submit
                  </Button>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

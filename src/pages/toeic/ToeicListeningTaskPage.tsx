import { useState, useEffect, useRef, useCallback } from "react";
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
import styles from "./ToeicListeningTaskPage.module.css";

interface ListeningQuestion {
  id: string;
  stem: string;
  options: string[];
  correctIndex: number;
  type: string;
  explanation: string;
}

interface ProblemData {
  title: string;
  audioSegments: { role: string; text: string }[];
  transcript: string;
  questions: ListeningQuestion[];
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function ToeicListeningTaskPageBase({
  taskId,
  subtitle,
  partLabel,
  readQuestionsAloud,
}: {
  taskId: "toeic/part3" | "toeic/part4";
  subtitle: string;
  partLabel: string;
  readQuestionsAloud?: boolean;
}) {
  const navigate = useNavigate();
  const { questionNumber } = useParams<{ questionNumber: string }>();
  const { data, file, loading, error, loadByQuestionNumber } =
    useQuestion<ProblemData>(taskId);
  const { saveScore } = useScoreHistory();
  const {
    display,
    elapsedSeconds,
    running,
    start,
    stop,
    reset: resetTimer,
  } = useElapsedTimer();
  const { playing, loading: ttsLoading, error: ttsError, currentTime, duration, playSegments, playSegmentsWithGaps, pause, resume, stop: stopTts, seek } =
    useTts();
  const fileBasename = file ? file.replace(/\.json$/i, "") : "";

  const [selections, setSelections] = useState<Record<number, number>>({});
  const [graded, setGraded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const progressBarRef = useRef<HTMLDivElement>(null);

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

  const handleSelect = (qIndex: number, optionIndex: number) => {
    if (graded) return;
    setSelections((s) => ({ ...s, [qIndex]: optionIndex }));
  };

  const getSeekTime = useCallback(
    (clientX: number) => {
      if (!progressBarRef.current || duration <= 0) return null;
      const rect = progressBarRef.current.getBoundingClientRect();
      const ratio = (clientX - rect.left) / rect.width;
      return Math.max(0, Math.min(ratio * duration, duration));
    },
    [duration]
  );

  const handleBarMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!graded || duration <= 0) return;
      const time = getSeekTime(e.clientX);
      if (time !== null) seek(time);
      setIsDragging(true);
    },
    [graded, duration, getSeekTime, seek]
  );

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent) => {
      const time = getSeekTime(e.clientX);
      if (time !== null) seek(time);
    };
    const onUp = () => setIsDragging(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isDragging, getSeekTime, seek]);

  const correctCount = data
    ? data.questions.filter((_, i) => selections[i] === data.questions[i].correctIndex).length
    : 0;
  const totalQuestions = data?.questions.length ?? 0;

  const handleSubmit = () => {
    const sessionSeconds = stop();
    if (data) {
      saveScore(
        taskId,
        correctCount,
        totalQuestions,
        sessionSeconds,
        file ?? undefined,
      );
    }
    setGraded(true);
    stopTts();
  };

  const handleBackToList = () => {
    resetTimer();
    setSelections({});
    setGraded(false);
    stopTts();
    navigate(`/toeic/${taskId.split("/")[1]}`);
  };

  const allAnswered = totalQuestions > 0 && Object.keys(selections).length === totalQuestions;

  return (
    <div>
      {(running || elapsedSeconds > 0) && (
        <FloatingElapsedTimer display={display} running={running} />
      )}
      <SectionHeader
        title={partLabel}
        subtitle={subtitle}
        backTo="/toeic"
        current={Object.keys(selections).length}
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
        <div className={styles.errorText}>
          <p>{error}</p>
          <p>questions/{taskId}/</p>
        </div>
      )}
      {!hasValidQuestionNumber && (
        <div className={styles.errorText}>
          <p>Invalid question number in URL.</p>
        </div>
      )}

      {data && !loading && hasValidQuestionNumber && (
        <>
          <div className={styles.playerCard}>
            <h3>{data.title}</h3>
            <div className={styles.playerControls}>
              <Button
                onClick={() => seek(Math.max(0, currentTime - 10))}
                disabled={duration <= 0}
                size="sm"
                variant="secondary"
              >
                ⏪ 10s
              </Button>
              <Button
                onClick={() => {
                  if (playing) {
                    pause();
                  } else if (currentTime > 0) {
                    resume();
                  } else {
                    const urls = data.audioSegments.map((_, i) =>
                      `/audio/${taskId}/${fileBasename}/${i + 1}.mp3`
                    );
                    if (readQuestionsAloud) {
                      const convCount = data.audioSegments.length - data.questions.length;
                      const gaps: number[] = [];
                      for (let i = 0; i < data.audioSegments.length - 1; i++) {
                        if (i < convCount - 1) gaps.push(0);
                        else if (i === convCount - 1) gaps.push(3);
                        else gaps.push(5);
                      }
                      playSegmentsWithGaps(urls, gaps);
                    } else {
                      playSegments(urls);
                    }
                  }
                }}
                disabled={ttsLoading}
                size="md"
              >
                {ttsLoading
                  ? "Loading..."
                  : playing
                    ? "⏸ Pause"
                    : currentTime > 0
                      ? "▶ Resume"
                      : "▶ Play Audio"}
              </Button>
              <Button
                onClick={() => seek(Math.min(duration, currentTime + 10))}
                disabled={duration <= 0}
                size="sm"
                variant="secondary"
              >
                ⏩ 10s
              </Button>
            </div>
            {(playing || currentTime > 0) && (
              <div className={styles.playerControls}>
                <span className={styles.timeText}>
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
                <div
                  ref={progressBarRef}
                  className={`${styles.progressBar} ${graded ? styles.progressBarSeekable : ""}`}
                  onMouseDown={handleBarMouseDown}
                >
                  <div
                    className={styles.progressFill}
                    style={{
                      width: duration > 0 ? `${(currentTime / duration) * 100}%` : "0%",
                    }}
                  />
                </div>
              </div>
            )}
            {ttsError && <p className={styles.errorText}>{ttsError}</p>}
          </div>

          {!graded && (
            <div className={styles.submitArea}>
              <Button
                onClick={handleSubmit}
                disabled={!allAnswered}
                size="lg"
              >
                Submit Answers
              </Button>
            </div>
          )}

          {graded && (
            <div className={styles.resultCard}>
              <h2>Section Complete</h2>
              <div className={styles.scoreBox}>
                <span className={styles.scoreNum}>{correctCount}</span>
                <span className={styles.scoreDen}>/{totalQuestions}</span>
                <span className={styles.scorePct}>
                  ({Math.round((correctCount / totalQuestions) * 100)}%)
                </span>
              </div>
              <ProgressBar
                current={correctCount}
                total={totalQuestions}
                label="Correct"
              />
              <Button onClick={handleBackToList} size="lg">
                Back to Question List
              </Button>
              <div className={styles.transcript}>
                <strong>Transcript</strong>
                <p>{data.transcript}</p>
              </div>
            </div>
          )}

          {data.questions.map((q, qIndex) => {
            const selected = selections[qIndex];
            const isCorrect = selected === q.correctIndex;
            return (
              <div key={q.id} className={styles.questionCard}>
                <p>
                  <strong>
                    Question {qIndex + 1} / {totalQuestions}
                  </strong>
                  {graded && (
                    <span style={{ marginLeft: 8 }}>
                      {isCorrect ? "✓ Correct" : "✗ Incorrect"}
                    </span>
                  )}
                </p>
                <p>{q.stem}</p>
                <div className={styles.options}>
                  {q.options.map((opt, optIndex) => {
                    let optionClass = styles.option;
                    if (!graded && selected === optIndex) {
                      optionClass += " " + styles.optionSelected;
                    }
                    if (graded && optIndex === q.correctIndex) {
                      optionClass += " " + styles.optionCorrect;
                    }
                    if (
                      graded &&
                      selected === optIndex &&
                      optIndex !== q.correctIndex
                    ) {
                      optionClass += " " + styles.optionIncorrect;
                    }
                    return (
                      <button
                        key={optIndex}
                        type="button"
                        className={optionClass}
                        onClick={() => handleSelect(qIndex, optIndex)}
                      >
                        <span className={styles.optionIndex}>
                          {String.fromCharCode(65 + optIndex)}.
                        </span>
                        <span>{opt}</span>
                      </button>
                    );
                  })}
                </div>
                {graded && (
                  <div className={styles.explanation}>{q.explanation}</div>
                )}
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

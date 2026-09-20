import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { SectionHeader } from "../layout/SectionHeader";
import { Button } from "../ui/Button";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import { ProgressBar } from "../ui/ProgressBar";
import { FeedbackPanel } from "../ui/FeedbackPanel";
import { FloatingElapsedTimer } from "../ui/FloatingElapsedTimer";
import { AudioPlayer } from "../ui/AudioPlayer";
import { useElapsedTimer } from "../../hooks/useElapsedTimer";
import { useQuestion } from "../../hooks/useQuestion";
import { useScoreHistory, type TaskId } from "../../hooks/useScoreHistory";
import { useTts } from "../../hooks/useTts";
import styles from "./ListeningTaskBase.module.css";

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

interface ListeningTaskBaseProps {
  taskId: TaskId;
  title: string;
  subtitle: string;
  backTo: string;
  readQuestionsAloud?: boolean;
  showSpeedControl?: boolean;
}

export function ListeningTaskBase({
  taskId,
  title,
  subtitle,
  backTo,
  readQuestionsAloud,
  showSpeedControl,
}: ListeningTaskBaseProps) {
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
  const {
    playing,
    loading: ttsLoading,
    error: ttsError,
    currentTime,
    duration,
    playbackRate,
    setPlaybackRate,
    playSegments,
    playSegmentsWithGaps,
    pause,
    resume,
    stop: stopTts,
    seek,
  } = useTts();
  const fileBasename = file ? file.replace(/\.json$/i, "") : "";

  const [selections, setSelections] = useState<Record<number, number>>({});
  const [graded, setGraded] = useState(false);

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

  const correctCount = data
    ? data.questions.filter(
        (_, i) => selections[i] === data.questions[i].correctIndex,
      ).length
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
    navigate(`/${taskId}`);
  };

  const allAnswered =
    totalQuestions > 0 && Object.keys(selections).length === totalQuestions;

  const handlePlay = () => {
    if (playing) {
      pause();
    } else if (currentTime > 0) {
      resume();
    } else {
      const urls = data!.audioSegments.map(
        (_, i) => `/audio/${taskId}/${fileBasename}/${i + 1}.mp3`,
      );
      if (readQuestionsAloud) {
        const convCount = data!.audioSegments.length - data!.questions.length;
        const gaps: number[] = [];
        for (let i = 0; i < data!.audioSegments.length - 1; i++) {
          if (i < convCount - 1) gaps.push(0);
          else if (i === convCount - 1) gaps.push(3);
          else gaps.push(5);
        }
        void playSegmentsWithGaps(urls, gaps);
      } else {
        void playSegments(urls);
      }
    }
  };

  return (
    <div>
      {(running || elapsedSeconds > 0) && (
        <FloatingElapsedTimer display={display} running={running} />
      )}
      <SectionHeader
        title={title}
        subtitle={subtitle}
        backTo={backTo}
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
          <AudioPlayer
            title={data.title}
            playing={playing}
            loading={ttsLoading}
            error={ttsError}
            currentTime={currentTime}
            duration={duration}
            playbackRate={playbackRate}
            onPlayPause={handlePlay}
            onSeek={seek}
            onPlaybackRateChange={setPlaybackRate}
            seekable={graded}
            showSpeedControl={showSpeedControl}
            src={
              data.audioSegments.length === 1
                ? `/audio/${taskId}/${fileBasename}/1.mp3`
                : undefined
            }
          />

          {!graded && (
            <div className={styles.submitArea}>
              <Button onClick={handleSubmit} disabled={!allAnswered} size="lg">
                Submit Answers
              </Button>
            </div>
          )}

          {graded && (
            <div className={styles.resultCard}>
              <p className="micro-label">Section complete</p>
              <div className="doc-score">
                <span className="doc-score-num">{correctCount}</span>
                <span className="doc-score-den">/ {totalQuestions}</span>
                <span className="doc-score-pct">
                  {Math.round((correctCount / totalQuestions) * 100)}%
                </span>
              </div>
              <ProgressBar
                current={correctCount}
                total={totalQuestions}
                label="Correct"
              />
              <details className={styles.transcript}>
                <summary>Transcript</summary>
                {data.audioSegments
                  .filter((seg) => seg.role !== "Narrator")
                  .map((seg, i) => (
                    <p key={i}>
                      <span className={styles.transcriptRole}>{seg.role}</span>
                      {seg.text}
                    </p>
                  ))}
              </details>
            </div>
          )}

          {data.questions.map((q, qIndex) => {
            const selected = selections[qIndex];
            const isCorrect = selected === q.correctIndex;
            return (
              <div key={q.id} className={styles.questionCard}>
                <div className={styles.questionHead}>
                  <span className="doc-item-num">{qIndex + 1}</span>
                  {graded && (
                    <span
                      className={[
                        styles.verdict,
                        isCorrect ? styles.verdictCorrect : styles.verdictWrong,
                      ].join(" ")}
                    >
                      {isCorrect ? "Correct" : "Incorrect"}
                    </span>
                  )}
                </div>
                <p className={styles.stem}>{q.stem}</p>
                <div className={styles.options}>
                  {q.options.map((opt, optIndex) => {
                    const className = ["doc-option"];
                    if (!graded && selected === optIndex) {
                      className.push("doc-option-selected");
                    }
                    if (graded && optIndex === q.correctIndex) {
                      className.push("doc-option-correct");
                    }
                    if (
                      graded &&
                      selected === optIndex &&
                      optIndex !== q.correctIndex
                    ) {
                      className.push("doc-option-wrong");
                    }
                    return (
                      <button
                        key={optIndex}
                        type="button"
                        className={className.join(" ")}
                        onClick={() => handleSelect(qIndex, optIndex)}
                        aria-pressed={selected === optIndex}
                        disabled={graded}
                      >
                        <span className="doc-option-label">
                          {String.fromCharCode(65 + optIndex)}
                        </span>
                        <span>{opt}</span>
                      </button>
                    );
                  })}
                </div>
                {graded && q.explanation && (
                  <FeedbackPanel
                    correct={isCorrect}
                    explanation={q.explanation}
                  />
                )}
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

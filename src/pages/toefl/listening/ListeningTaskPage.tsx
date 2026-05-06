import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { SectionHeader } from "../../../components/layout/SectionHeader";
import { Button } from "../../../components/ui/Button";
import { LoadingSpinner } from "../../../components/ui/LoadingSpinner";
import { ProgressBar } from "../../../components/ui/ProgressBar";
import { FloatingElapsedTimer } from "../../../components/ui/FloatingElapsedTimer";
import { useElapsedTimer } from "../../../hooks/useElapsedTimer";
import { useQuestion } from "../../../hooks/useQuestion";
import { useScoreHistory } from "../../../hooks/useScoreHistory";
import { useTts } from "../../../hooks/useTts";
import styles from "./ListeningTaskPage.module.css";

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

function ListeningTaskPageBase({
  taskId,
  title,
  subtitle,
}: {
  taskId: "toefl/listening/conversation" | "toefl/listening/lecture";
  title: string;
  subtitle: string;
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
  const { playing, loading: ttsLoading, error: ttsError, currentTime, duration, playSegments, pause, stop: stopTts } =
    useTts();

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
    navigate(taskId.replace("toefl/", "/toefl/").replace("listening/", "listening/"));
  };

  const allAnswered = totalQuestions > 0 && Object.keys(selections).length === totalQuestions;

  return (
    <div>
      {(running || elapsedSeconds > 0) && (
        <FloatingElapsedTimer display={display} running={running} />
      )}
      <SectionHeader
        title={title}
        subtitle={subtitle}
        backTo="/toefl"
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
              {!playing && (
                <Button
                  onClick={() => playSegments(data.audioSegments)}
                  disabled={ttsLoading}
                  size="md"
                >
                  {ttsLoading ? "Loading..." : "▶ Play Audio"}
                </Button>
              )}
              {playing && (
                <Button onClick={pause} size="md" variant="secondary">
                  ⏸ Pause
                </Button>
              )}
              {(playing || currentTime > 0) && (
                <Button onClick={stopTts} size="sm" variant="secondary">
                  ⏹ Stop
                </Button>
              )}
            </div>
            {(playing || currentTime > 0) && (
              <div className={styles.playerControls}>
                <span className={styles.timeText}>
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
                <div className={styles.progressBar}>
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

export function ConversationPage() {
  return (
    <ListeningTaskPageBase
      taskId="toefl/listening/conversation"
      title="Listen to a Conversation"
      subtitle="Listen to the audio and answer the questions."
    />
  );
}

export function LecturePage() {
  return (
    <ListeningTaskPageBase
      taskId="toefl/listening/lecture"
      title="Listen to a Lecture"
      subtitle="Listen to the audio and answer the questions."
    />
  );
}

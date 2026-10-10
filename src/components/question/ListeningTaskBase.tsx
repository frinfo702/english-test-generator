import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  useQuestionId,
  useTrialItem,
  useTrialTimeout,
} from "../../hooks/useTrialItem";
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
import { NextQuestionButton } from "./NextQuestionButton";
import styles from "./ListeningTaskBase.module.css";
import { PixelCheckIcon } from "../ui/PixelCheckIcon";
import { ChoiceQuestionCard, QuestionNav, SplitView } from "./QuestionStepper";
import { SpeakerFigure } from "./SpeakerFigure";

interface ListeningQuestion {
  id: string;
  stem: string;
  options: string[];
  correctIndex: number;
  type: string;
  explanation: string;
}

export interface ListeningProblemData {
  title: string;
  /** Class the talk belongs to, e.g. "environmental science". */
  subject?: string;
  /** Speaker photo id under public/images/speakers/. */
  speaker?: string;
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
  /**
   * "list": player above all questions.
   * "talk": exam-style — listen first (speaker + player), then one question
   * at a time beside the speaker.
   */
  layout?: "list" | "talk";
  /** Instruction above the speaker in the talk layout. */
  listenPrompt?: (data: ListeningProblemData) => string;
}

function talkPrompt({ subject }: ListeningProblemData): string {
  if (!subject) return "Listen to an academic talk.";
  const article = /^[aeiou]/i.test(subject) ? "an" : "a";
  return `Listen to a talk in ${article} ${subject} class.`;
}

/** Distinct on-screen speakers (the narrator is not pictured). */
function speakerCount(data: ListeningProblemData): number {
  const roles = new Set(
    data.audioSegments.map((s) => s.role).filter((r) => r !== "Narrator"),
  );
  return Math.min(Math.max(roles.size, 1), 2);
}

export function ListeningTaskBase({
  taskId,
  title,
  subtitle,
  backTo,
  readQuestionsAloud,
  showSpeedControl,
  layout = "list",
  listenPrompt = talkPrompt,
}: ListeningTaskBaseProps) {
  const navigate = useNavigate();
  const questionId = useQuestionId();
  const { data, file, loading, error, loadById } =
    useQuestion<ListeningProblemData>(taskId);
  const { saveScore } = useScoreHistory();
  const trial = useTrialItem();
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
  const [stage, setStage] = useState<"listen" | "questions">("listen");
  const [currentIndex, setCurrentIndex] = useState(0);
  // As in the exam, the audio plays once while answering; replay opens in
  // review. A failed playback can be tried again.
  const [heard, setHeard] = useState(false);
  const locked = heard && !graded && !ttsError;

  const hasValidQuestionId = questionId !== "";

  useEffect(() => {
    if (!hasValidQuestionId) return;
    loadById(questionId);
  }, [hasValidQuestionId, loadById, questionId]);

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
      const saved = saveScore({
        taskId: taskId,
        file: file ?? undefined,
        correct: correctCount,
        total: totalQuestions,
        elapsedSeconds: sessionSeconds,
        responses: Object.entries(selections).map(([i, choice]) => ({
          itemId: data.questions[Number(i)].id,
          choice,
        })),
      });
      trial?.complete(saved);
    }
    setGraded(true);
    stopTts();
    setCurrentIndex(0);
    if (layout === "talk") window.scrollTo({ top: 0 });
  };
  useTrialTimeout(handleSubmit);

  const handleBackToList = () => {
    resetTimer();
    setSelections({});
    setGraded(false);
    stopTts();
    navigate(`/${taskId}`);
  };

  const handlePlay = () => {
    if (playing) {
      pause();
    } else if (currentTime > 0) {
      resume();
    } else {
      if (!graded) setHeard(true);
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
        // Talk layout: the questions open once the talk has played through.
        void playSegments(
          urls,
          layout === "talk" && !graded
            ? () => setStage("questions")
            : undefined,
        );
      }
    }
  };

  const answersById: Record<string, number> = {};
  data?.questions.forEach((q, i) => {
    if (selections[i] !== undefined) answersById[q.id] = selections[i];
  });

  const goToQuestions = () => {
    stopTts();
    setStage("questions");
  };

  const audioPlayer = (seekable: boolean, minimal = false) =>
    data && (
      <AudioPlayer
        minimal={minimal}
        title={layout === "talk" ? undefined : data.title}
        playing={playing}
        loading={ttsLoading}
        error={ttsError}
        currentTime={currentTime}
        duration={duration}
        playbackRate={playbackRate}
        onPlayPause={handlePlay}
        onSeek={seek}
        onPlaybackRateChange={setPlaybackRate}
        seekable={seekable}
        disabled={locked}
        playLabel={locked ? "Audio plays once" : undefined}
        showSpeedControl={showSpeedControl}
        src={
          data.audioSegments.length === 1
            ? `/audio/${taskId}/${fileBasename}/1.mp3`
            : undefined
        }
      />
    );

  const resultCard = data && (
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
      <div className={styles.resultActions}>
        <NextQuestionButton taskId={taskId} />
      </div>
    </div>
  );

  return (
    <div>
      {(running || elapsedSeconds > 0) && (
        <FloatingElapsedTimer display={display} running={running} />
      )}
      <SectionHeader
        title={title}
        subtitle={subtitle}
        backTo={backTo}
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={handleBackToList}
            disabled={loading}
          >
            Question List
          </Button>
        }
      />

      {loading && <LoadingSpinner message="Loading question..." />}
      {error && (
        <div className={styles.errorText}>
          <p>{error}</p>
          <p>questions/{taskId}/</p>
        </div>
      )}
      {!hasValidQuestionId && (
        <div className={styles.errorText}>
          <p>Invalid question ID in URL.</p>
        </div>
      )}

      {data && !loading && hasValidQuestionId && layout === "talk" && (
        <>
          {stage === "listen" && (
            <div className={styles.listenCard}>
              <p className={styles.listenPrompt}>{listenPrompt(data)}</p>
              <SpeakerFigure
                speaker={data.speaker}
                count={speakerCount(data)}
                className={styles.speaker}
              />
              {audioPlayer(false, true)}
              <Button variant="ghost" size="sm" onClick={goToQuestions}>
                Skip to questions
              </Button>
            </div>
          )}

          {stage === "questions" && (
            <>
              {graded && resultCard}
              <SplitView
                left={
                  <div className={styles.speakerCard}>
                    <SpeakerFigure
                      speaker={data.speaker}
                      count={speakerCount(data)}
                      className={styles.speakerSmall}
                    />
                    {graded && audioPlayer(true)}
                  </div>
                }
                right={
                  <ChoiceQuestionCard
                    key={data.questions[currentIndex].id}
                    question={data.questions[currentIndex]}
                    index={currentIndex}
                    total={totalQuestions}
                    selected={selections[currentIndex]}
                    graded={graded}
                    onSelect={(_, optionIndex) =>
                      handleSelect(currentIndex, optionIndex)
                    }
                  />
                }
              />
              <QuestionNav
                groups={[data.questions]}
                answers={answersById}
                currentIndex={currentIndex}
                graded={graded}
                onGo={(i) =>
                  setCurrentIndex(Math.max(0, Math.min(i, totalQuestions - 1)))
                }
                onSubmit={handleSubmit}
              />
            </>
          )}
        </>
      )}

      {data && !loading && hasValidQuestionId && layout === "list" && (
        <>
          {audioPlayer(graded)}

          {!graded && (
            <div className={styles.submitArea}>
              <Button onClick={handleSubmit} size="lg">
                Submit Answers
                <PixelCheckIcon />
              </Button>
              <NextQuestionButton
                taskId={taskId}
                variant="secondary"
                size="lg"
              />
            </div>
          )}

          {graded && resultCard}

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

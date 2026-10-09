import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  useQuestionId,
  useTrialItem,
  useTrialTimeout,
} from "../../../hooks/useTrialItem";
import { SectionHeader } from "../../../components/layout/SectionHeader";
import { Button } from "../../../components/ui/Button";
import { LoadingSpinner } from "../../../components/ui/LoadingSpinner";
import { ProgressBar } from "../../../components/ui/ProgressBar";
import { FloatingElapsedTimer } from "../../../components/ui/FloatingElapsedTimer";
import { useElapsedTimer } from "../../../hooks/useElapsedTimer";
import { useQuestion } from "../../../hooks/useQuestion";
import { useScoreHistory } from "../../../hooks/useScoreHistory";
import { useTts } from "../../../hooks/useTts";
import { NextQuestionButton } from "../../../components/question/NextQuestionButton";
import styles from "./ListenResponsePage.module.css";
import { AudioPlayer } from "../../../components/ui/AudioPlayer";
import {
  ChoiceQuestionCard,
  QuestionNav,
  SplitView,
  type ChoiceQuestion,
} from "../../../components/question/QuestionStepper";
import { SpeakerFigure } from "../../../components/question/SpeakerFigure";

interface ResponseQuestion {
  id: string;
  /** Speaker photo for this item; each item may be a different person. */
  speaker?: string;
  context: string;
  stem: string;
  options: { A: string; B: string; C: string; D?: string };
  correct: string;
  explanation: string;
}

interface ProblemData {
  title: string;
  /** Speaker photo id under public/images/speakers/. */
  speaker?: string;
  questions: ResponseQuestion[];
  audioSegments: { role: string; text: string }[];
}

const TASK_ID = "toefl/listening/response";

export function ListenResponsePage() {
  const navigate = useNavigate();
  const questionId = useQuestionId();
  const { data, file, loading, error, loadById } =
    useQuestion<ProblemData>(TASK_ID);
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
    loading: ttsLoading,
    playing: ttsPlaying,
    error: ttsError,
    currentTime,
    playSegmentsWithGaps,
    stop: stopTts,
  } = useTts();
  const fileBasename = file ? file.replace(/\.json$/i, "") : "";

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [graded, setGraded] = useState(false);
  const audioStartedRef = useRef<Set<number>>(new Set());

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

  const questions = data?.questions ?? [];

  useEffect(() => {
    if (data && !graded && !audioStartedRef.current.has(currentIndex)) {
      const url = `/audio/${TASK_ID}/${fileBasename}/${currentIndex + 1}.mp3`;
      audioStartedRef.current = new Set(audioStartedRef.current).add(
        currentIndex,
      );
      playSegmentsWithGaps([url], []);
    }
  }, [data, currentIndex, graded, playSegmentsWithGaps, fileBasename]);

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const totalCorrect = questions.filter(
    (q) => selected[q.id] === q.correct,
  ).length;

  const handleSelect = (opt: string) => {
    if (!currentQuestion || graded) return;
    setSelected((s) => ({ ...s, [currentQuestion.id]: opt }));
  };

  const goTo = (index: number) => {
    setCurrentIndex(Math.max(0, Math.min(index, totalQuestions - 1)));
  };

  const retake = () => {
    if (!graded) return;
    setSelected({});
    setCurrentIndex(0);
    setGraded(false);
    audioStartedRef.current = new Set();
    resetTimer();
  };

  const handleSubmit = () => {
    const sessionSeconds = stop();
    if (data) {
      const correct = data.questions.filter(
        (q) => selected[q.id] === q.correct,
      ).length;
      const saved = saveScore({
        taskId: TASK_ID,
        file: file ?? undefined,
        correct: correct,
        total: data.questions.length,
        elapsedSeconds: sessionSeconds,
        responses: Object.entries(selected).map(([itemId, choice]) => ({
          itemId,
          choice,
        })),
      });
      trial?.complete(saved);
    }
    setGraded(true);
    stopTts();
    setCurrentIndex(0);
    window.scrollTo({ top: 0 });
  };
  useTrialTimeout(handleSubmit);

  // Each utterance plays on its own once, as in the exam; replay opens in
  // review. A failed playback can be tried again.
  const locked = !graded && !ttsError;

  const handleReplayAudio = () => {
    if (!data) return;
    if (ttsPlaying) {
      stopTts();
      return;
    }
    const url = `/audio/${TASK_ID}/${fileBasename}/${currentIndex + 1}.mp3`;
    playSegmentsWithGaps([url], []);
  };

  const handleBackToList = () => {
    resetTimer();
    setCurrentIndex(0);
    setSelected({});
    setGraded(false);
    audioStartedRef.current = new Set();
    navigate(`/${TASK_ID}`);
  };

  // The utterance is only revealed in review; before that the card asks for
  // the best response, as in the test.
  const LETTERS = ["A", "B", "C", "D"] as const;
  const choiceQuestions: ChoiceQuestion[] = questions.map((q) => ({
    id: q.id,
    stem: graded ? `“${q.stem}”` : "Choose the best response.",
    options: LETTERS.flatMap((l) => q.options[l] ?? []),
    correctIndex: LETTERS.indexOf(q.correct as (typeof LETTERS)[number]),
    explanation: q.explanation,
  }));
  const answersByIndex: Record<string, number> = {};
  for (const q of questions) {
    const sel = selected[q.id];
    if (sel)
      answersByIndex[q.id] = LETTERS.indexOf(sel as (typeof LETTERS)[number]);
  }

  return (
    <div>
      {(running || elapsedSeconds > 0) && (
        <FloatingElapsedTimer display={display} running={running} />
      )}
      <SectionHeader
        title="Listen and Choose a Response"
        subtitle="Listen to each utterance and choose the best response."
        backTo="/toefl"
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
        <div className={styles.error}>
          <p>{error}</p>
          <p className={styles.errorHint}>
            Add question JSON under questions/{TASK_ID}/.
          </p>
        </div>
      )}
      {!hasValidQuestionId && (
        <div className={styles.error}>
          <p>Invalid question ID in URL.</p>
        </div>
      )}

      {data && !loading && hasValidQuestionId && currentQuestion && (
        <>
          {graded && (
            <div className={styles.resultCard}>
              <h2>Section Complete</h2>
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
                <NextQuestionButton taskId={TASK_ID} size="md" />
              </div>
            </div>
          )}

          <SplitView
            leftKey={currentQuestion.id}
            left={
              <div className={styles.speakerCard}>
                <SpeakerFigure
                  speaker={currentQuestion.speaker ?? data.speaker}
                  className={styles.speaker}
                />
                <AudioPlayer
                  minimal
                  playing={ttsPlaying}
                  loading={ttsLoading}
                  error={ttsError}
                  disabled={locked}
                  currentTime={currentTime}
                  duration={0}
                  playbackRate={1}
                  onPlayPause={handleReplayAudio}
                  onSeek={() => undefined}
                  onPlaybackRateChange={() => undefined}
                  playLabel={
                    locked
                      ? "Audio plays once"
                      : ttsPlaying
                        ? "Playing audio"
                        : "Play audio"
                  }
                />
              </div>
            }
            right={
              <ChoiceQuestionCard
                key={currentQuestion.id}
                question={choiceQuestions[currentIndex]}
                index={currentIndex}
                total={totalQuestions}
                context={currentQuestion.context}
                selected={answersByIndex[currentQuestion.id]}
                graded={graded}
                onSelect={(_, i) => handleSelect(LETTERS[i])}
              />
            }
          />

          <QuestionNav
            groups={[choiceQuestions]}
            answers={answersByIndex}
            currentIndex={currentIndex}
            graded={graded}
            onGo={goTo}
            onSubmit={handleSubmit}
          />

          {!graded && (
            <div className={styles.submitRow}>
              <NextQuestionButton taskId={TASK_ID} variant="ghost" size="sm" />
            </div>
          )}
        </>
      )}
    </div>
  );
}

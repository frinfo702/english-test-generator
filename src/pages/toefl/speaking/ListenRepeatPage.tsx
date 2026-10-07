import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { SectionHeader } from "../../../components/layout/SectionHeader";
import { BackButton } from "../../../components/ui/BackButton";
import { Button } from "../../../components/ui/Button";
import { LoadingSpinner } from "../../../components/ui/LoadingSpinner";
import { ProgressBar } from "../../../components/ui/ProgressBar";
import { FloatingElapsedTimer } from "../../../components/ui/FloatingElapsedTimer";
import { AudioPlayer } from "../../../components/ui/AudioPlayer";
import { MicSelector } from "../../../components/ui/MicSelector";
import { VoiceButton } from "../../../components/ui/VoiceButton";
import { useElapsedTimer } from "../../../hooks/useElapsedTimer";
import { useQuestion } from "../../../hooks/useQuestion";
import { useScoreHistory } from "../../../hooks/useScoreHistory";
import { useTts } from "../../../hooks/useTts";
import { useSpeechRecognition } from "../../../hooks/useSpeechRecognition";
import { NextQuestionButton } from "../../../components/question/NextQuestionButton";
import type { ItemResponse } from "../../../lib/attempts";
import {
  assessPronunciation,
  type PronunciationResult,
} from "../../../lib/pronunciation";
import {
  computeSpeedMetrics,
  speedScore,
  type SpeedMetrics,
} from "../../../lib/speakingRate";
import { toWav16k } from "../../../lib/wav";
import {
  alignWords,
  countCorrectWords,
  countOriginalWords,
  type AlignedWord,
} from "./listenRepeat";
import styles from "./ListenRepeatPage.module.css";

interface Sentence {
  id: string;
  text: string;
  wordCount: number;
}
interface ProblemData {
  sentences: Sentence[];
}

const TASK_ID = "toefl/speaking/listen-repeat";
const DEFAULT_WORDS_PER_SECOND = 2.2;
const RECORDING_MULTIPLIER = 1.5;
const PROCESSING_DELAY_MS = 400;

type Phase =
  "playing" | "ready" | "recording" | "processing" | "feedback" | "review";

function DiffLegend() {
  return (
    <div className={styles.legend}>
      <p className={styles.fbLabel}>How to read the answer</p>
      <div className={styles.legendItems}>
        <div className={styles.legendItem}>
          <span
            className={[styles.diffWord, styles.diffCorrect].join(" ")}
            title="Correctly spoken"
          >
            correct
          </span>
          <span className={styles.legendLabel}>Correctly spoken</span>
        </div>
        <div className={styles.legendItem}>
          <span
            className={[styles.diffWord, styles.diffWrong].join(" ")}
            title="Wrong word"
          >
            wrong
          </span>
          <span className={styles.legendLabel}>Wrong word</span>
        </div>
        <div className={styles.legendItem}>
          <span
            className={[
              styles.diffWord,
              styles.diffWrong,
              styles.diffMissing,
            ].join(" ")}
            title="Missing word"
          >
            ▪
          </span>
          <span className={styles.legendLabel}>Missing word</span>
        </div>
        <div className={styles.legendItem}>
          <span
            className={[
              styles.diffWord,
              styles.diffWrong,
              styles.diffExtra,
            ].join(" ")}
            title="Extra word"
          >
            extra
          </span>
          <span className={styles.legendLabel}>Extra word</span>
        </div>
      </div>
    </div>
  );
}

// Azure gives omitted words no timing, so they'd read as 0-second words.
function spokenWords(result: PronunciationResult) {
  return result.words.filter((w) => w.errorType !== "Omission");
}

function ScoreBars({
  correct,
  total,
  pronunciation,
  speed,
}: {
  correct: number;
  total: number;
  pronunciation: number | null;
  speed: SpeedMetrics | null;
}) {
  return (
    <>
      <ProgressBar current={correct} total={total} label="Words Correct" />
      {pronunciation !== null && speed && (
        <>
          <ProgressBar
            current={Math.round(pronunciation)}
            total={100}
            label="Pronunciation"
          />
          <ProgressBar
            current={Math.round(speedScore(speed))}
            total={100}
            label="Speed"
          />
          <p className={styles.hint}>
            {Math.round(speed.speakingRate)} words/min ·{" "}
            {speed.longPausesPerMinute.toFixed(1)} long pauses/min
          </p>
        </>
      )}
    </>
  );
}

function ListenRepeatDiffView({
  alignment,
  showLabels = true,
}: {
  alignment: AlignedWord[];
  showLabels?: boolean;
}) {
  return (
    <div className={styles.sideBySideDiff}>
      {showLabels && (
        <div className={styles.diffColumn}>
          <div
            className={[styles.diffCell, styles.diffRowLabel].join(" ")}
            aria-hidden="true"
          >
            Prompt
          </div>
          <div
            className={[styles.diffCell, styles.diffRowLabel].join(" ")}
            aria-hidden="true"
          >
            Response
          </div>
        </div>
      )}
      {alignment.map((a, j) => {
        const isMatch = a.type === "match";
        const isDeletion = a.type === "deletion";
        const isInsertion = a.type === "insertion";

        const topClasses = [styles.diffCell];
        const bottomClasses = [styles.diffCell];

        if (isMatch) {
          topClasses.push(styles.diffCorrect);
          bottomClasses.push(styles.diffCorrect);
        } else if (isDeletion) {
          topClasses.push(styles.diffWrong, styles.diffMissing);
          bottomClasses.push(styles.diffPlaceholder);
        } else if (isInsertion) {
          topClasses.push(styles.diffPlaceholder);
          bottomClasses.push(styles.diffWrong, styles.diffExtra);
        } else {
          topClasses.push(styles.diffWrong);
          bottomClasses.push(styles.diffWrong);
        }

        return (
          <div key={j} className={styles.diffColumn}>
            <div
              className={topClasses.join(" ")}
              title={
                a.type === "match"
                  ? "Correct"
                  : a.type === "deletion"
                    ? `Missing: ${a.original}`
                    : a.type === "insertion"
                      ? "(not in original)"
                      : `Expected: ${a.original}`
              }
            >
              {a.original ?? "▪"}
            </div>
            <div
              className={bottomClasses.join(" ")}
              title={
                a.type === "match"
                  ? "Correct"
                  : a.type === "deletion"
                    ? "(not spoken)"
                    : a.type === "insertion"
                      ? `Extra: ${a.recognized}`
                      : `Got: ${a.recognized}`
              }
            >
              {a.recognized ?? "▪"}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ListenRepeatPage() {
  const navigate = useNavigate();
  const { questionId = "" } = useParams<{ questionId: string }>();
  const { data, file, loading, error, loadById } =
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
  const {
    playing,
    loading: ttsLoading,
    error: ttsError,
    currentTime,
    duration,
    playbackRate,
    setPlaybackRate,
    play,
    pause,
    resume,
    stop: stopTts,
    seek,
  } = useTts();
  const {
    supported: speechSupported,
    transcript,
    levels,
    error: speechError,
    start: startSpeech,
    stop: stopSpeech,
  } = useSpeechRecognition();
  const transcriptRef = useRef(transcript);

  const [current, setCurrent] = useState(0);
  const [phase, setPhase] = useState<Phase>("playing");
  const [transcripts, setTranscripts] = useState<Record<number, string>>({});
  const [assessments, setAssessments] = useState<
    Record<number, PronunciationResult>
  >({});
  const [assessmentError, setAssessmentError] = useState<string | null>(null);
  const [graded, setGraded] = useState(false);
  const [recordingTimeLeft, setRecordingTimeLeft] = useState(0);
  const [processingMessage, setProcessingMessage] = useState<string | null>(
    null,
  );
  const [activeReviewSentence, setActiveReviewSentence] = useState<
    number | null
  >(null);

  const durationRef = useRef(duration);
  const takesRef = useRef<Record<number, ItemResponse>>({});
  const promptEndedAtRef = useRef<number | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const processingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  const hasValidQuestionId = questionId !== "";

  const fileBasename = file ? file.replace(/\.json$/i, "") : "";
  const totalSentences = data?.sentences.length ?? 0;
  const sentence = data?.sentences[current];
  const isLastSentence = current + 1 >= totalSentences;

  useEffect(() => {
    durationRef.current = duration;
  }, [duration]);

  useEffect(() => {
    if (!hasValidQuestionId) return;
    loadById(questionId);
  }, [hasValidQuestionId, loadById, questionId]);

  useEffect(() => {
    if (data && !loading && !graded && !running && elapsedSeconds === 0) {
      start();
    }
  }, [data, loading, graded, running, elapsedSeconds, start]);

  const clearRecordingTimer = useCallback(() => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (speechError && phase === "recording") {
      clearRecordingTimer();
    }
  }, [speechError, phase, clearRecordingTimer]);

  const clearProcessingTimeout = useCallback(() => {
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current);
      processingTimeoutRef.current = null;
    }
  }, []);

  const finishingRef = useRef(false);

  const finishSentence = useCallback(async () => {
    if (finishingRef.current) return;
    finishingRef.current = true;

    clearRecordingTimer();
    clearProcessingTimeout();
    const recording = await stopSpeech();
    if (sentence && recording.audio) {
      const index = current;
      // Runs beside transcription so a missing Azure key never blocks the flow.
      void toWav16k(recording.audio)
        .then((wav) => assessPronunciation(wav, sentence.text))
        .then((result) =>
          setAssessments((prev) => ({ ...prev, [index]: result })),
        )
        .catch((e: unknown) =>
          setAssessmentError(e instanceof Error ? e.message : String(e)),
        );
    }
    if (sentence) {
      takesRef.current[current] = {
        itemId: sentence.id,
        audio: recording.audio ?? undefined,
        recordedAt: recording.startedAt ?? undefined,
        promptEndedAt: promptEndedAtRef.current ?? undefined,
      };
    }
    setPhase("processing");
    setProcessingMessage("Processing your speech...");

    processingTimeoutRef.current = setTimeout(() => {
      setTranscripts((prev) => {
        const next = { ...prev, [current]: transcriptRef.current.trim() };

        if (isLastSentence) {
          const sessionSeconds = stop();
          if (data) {
            const allAlignments = data.sentences.map((s, i) =>
              alignWords(s.text, next[i] ?? ""),
            );
            const correct = allAlignments.reduce(
              (sum, a) => sum + countCorrectWords(a),
              0,
            );
            const total = allAlignments.reduce(
              (sum, a) => sum + countOriginalWords(a),
              0,
            );
            saveScore({
              taskId: TASK_ID,
              file: file ?? undefined,
              correct,
              total,
              elapsedSeconds: sessionSeconds,
              method: "word-align",
              responses: data.sentences.map((s, i) => ({
                ...takesRef.current[i],
                itemId: s.id,
                transcript: next[i] ?? "",
              })),
            });
          }
          setGraded(true);
          setPhase("review");
          stopTts();
        }

        return next;
      });

      if (!isLastSentence) {
        setPhase("feedback");
      }
      setProcessingMessage(null);
      finishingRef.current = false;
    }, PROCESSING_DELAY_MS);
  }, [
    clearRecordingTimer,
    clearProcessingTimeout,
    stopSpeech,
    sentence,
    current,
    isLastSentence,
    data,
    stop,
    saveScore,
    file,
    stopTts,
  ]);

  const startRecording = useCallback(() => {
    if (!speechSupported) return;
    const audioDuration =
      durationRef.current > 0
        ? durationRef.current
        : (sentence?.wordCount ?? 0) / DEFAULT_WORDS_PER_SECOND;
    const recordingDuration = Math.max(
      3,
      Math.round(audioDuration * RECORDING_MULTIPLIER),
    );

    setRecordingTimeLeft(recordingDuration);
    setPhase("recording");
    startSpeech();

    recordingTimerRef.current = setInterval(() => {
      setRecordingTimeLeft((prev) => {
        if (prev <= 1) {
          void finishSentence();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [speechSupported, sentence, startSpeech, finishSentence]);

  const playCurrentSentence = useCallback(() => {
    if (!sentence || !fileBasename) return;
    const url = `/audio/toefl/speaking/listen-repeat/${fileBasename}/${current + 1}.mp3`;
    void play(url, () => {
      promptEndedAtRef.current = Date.now();
      setPhase("ready");
    });
  }, [sentence, fileBasename, current, play]);

  const playSentence = useCallback(
    (index: number) => {
      if (!fileBasename) return;
      const url = `/audio/toefl/speaking/listen-repeat/${fileBasename}/${index + 1}.mp3`;
      // A replay before answering moves the point latency is measured from.
      void play(url, () => {
        promptEndedAtRef.current = Date.now();
      });
    },
    [fileBasename, play],
  );

  const handlePlay = useCallback(() => {
    if (playing) {
      pause();
    } else if (currentTime > 0) {
      resume();
    } else {
      // Replay from start (either never played or audio ended)
      playSentence(current);
    }
  }, [playing, currentTime, pause, resume, playSentence, current]);

  const handleStartRecording = useCallback(() => {
    startRecording();
  }, [startRecording]);

  const handleNextSentence = useCallback(() => {
    if (isLastSentence) return;
    setCurrent((c) => c + 1);
    setPhase("playing");
  }, [isLastSentence]);

  useEffect(() => {
    if (
      data &&
      !loading &&
      !graded &&
      hasValidQuestionId &&
      phase === "playing" &&
      !playing &&
      !ttsLoading
    ) {
      playCurrentSentence();
    }
  }, [
    data,
    loading,
    graded,
    hasValidQuestionId,
    phase,
    playing,
    ttsLoading,
    playCurrentSentence,
  ]);

  useEffect(() => {
    return () => {
      clearRecordingTimer();
      clearProcessingTimeout();
      void stopSpeech();
      stopTts();
      finishingRef.current = false;
    };
  }, [clearRecordingTimer, clearProcessingTimeout, stopSpeech, stopTts]);

  const handleBackToList = () => {
    clearRecordingTimer();
    clearProcessingTimeout();
    void stopSpeech();
    stopTts();
    resetTimer();
    setCurrent(0);
    setTranscripts({});
    setAssessments({});
    setAssessmentError(null);
    setPhase("playing");
    setGraded(false);
    setRecordingTimeLeft(0);
    setProcessingMessage(null);
    finishingRef.current = false;
    setActiveReviewSentence(null);
    navigate(`/${TASK_ID}`);
  };

  const handleReplayAudio = () => {
    clearRecordingTimer();
    clearProcessingTimeout();
    void stopSpeech();
    finishingRef.current = false;
    setProcessingMessage(null);
    // During feedback, replay audio without changing phase (keep feedback visible)
    if (phase === "feedback") {
      playSentence(current);
    } else {
      setPhase("playing");
    }
  };

  const handleRetryRecording = () => {
    clearRecordingTimer();
    clearProcessingTimeout();
    void stopSpeech();
    finishingRef.current = false;
    setProcessingMessage(null);
    setPhase("playing");
  };

  const alignments: AlignedWord[][] = data
    ? data.sentences.map((s, i) => alignWords(s.text, transcripts[i] ?? ""))
    : [];
  const correctWords = alignments.reduce(
    (sum, a) => sum + countCorrectWords(a),
    0,
  );
  const totalWords = alignments.reduce(
    (sum, a) => sum + countOriginalWords(a),
    0,
  );
  const assessed = Object.values(assessments);
  const pronunciationScore =
    assessed.length > 0
      ? Math.round(
          assessed.reduce((sum, a) => sum + a.pronunciation, 0) /
            assessed.length,
        )
      : null;
  const speedMetrics =
    assessed.length > 0 ? computeSpeedMetrics(assessed.map(spokenWords)) : null;

  return (
    <div>
      {(running || elapsedSeconds > 0) && (
        <FloatingElapsedTimer display={display} running={running} />
      )}
      <SectionHeader
        title="Listen and Repeat"
        subtitle="Listen to the sentence, then repeat it into the microphone."
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
            questions/toefl/speaking/listen-repeat/ Add question JSON under this
            folder.
          </p>
        </div>
      )}
      {!hasValidQuestionId && (
        <div className={styles.error}>
          <p>Invalid question ID in URL.</p>
        </div>
      )}
      {!speechSupported && !loading && (
        <div className={styles.error}>
          <p>
            Microphone recording is not supported in this browser. Please use
            Chrome, Edge, or Safari.
          </p>
        </div>
      )}
      {speechError && <div className={styles.error}>{speechError}</div>}
      {ttsError && <div className={styles.error}>{ttsError}</div>}

      {data && !loading && hasValidQuestionId && !graded && sentence && (
        <div className={styles.card}>
          <p className={styles.qNum}>
            Question {current + 1} / {totalSentences}
          </p>

          {phase === "playing" && (
            <div className={styles.showPhase}>
              <p className={styles.sentenceDisplay}>Listen carefully...</p>
              <p className={styles.hint}>
                {ttsLoading ? "Loading audio…" : "The sentence is playing."}
              </p>
            </div>
          )}

          {phase === "ready" && (
            <div className={styles.showPhase}>
              <p className={styles.sentenceDisplay}>Ready to record</p>
              <p className={styles.hint}>
                Listen once more if you need to, then say the sentence back.
              </p>
              <div className={styles.recordControls}>
                <MicSelector disabled={!speechSupported} previewEnabled />
                <VoiceButton
                  state="idle"
                  label="Start Recording"
                  variant="primary"
                  size="lg"
                  onPress={handleStartRecording}
                  disabled={!speechSupported}
                />
              </div>
            </div>
          )}

          {phase === "recording" && (
            <div className={styles.showPhase}>
              <p className={styles.sentenceDisplay}>Repeat the sentence now</p>
              <VoiceButton
                state="recording"
                label="Recording"
                trailing={`${recordingTimeLeft}s`}
                variant="secondary"
                size="lg"
                levels={levels}
                onPress={() => void finishSentence()}
              />
              {transcript && (
                <p className={styles.liveTranscript}>{transcript}</p>
              )}
              {speechError && (
                <Button onClick={handleRetryRecording} variant="primary">
                  Retry this sentence
                </Button>
              )}
            </div>
          )}

          {(phase === "processing" || processingMessage) && (
            <div className={styles.showPhase}>
              <LoadingSpinner message={processingMessage ?? "Processing..."} />
            </div>
          )}

          {phase === "feedback" && (
            <div className={styles.feedbackPhase}>
              <AudioPlayer
                playing={playing}
                loading={ttsLoading}
                error={ttsError}
                currentTime={currentTime}
                duration={duration}
                playbackRate={playbackRate}
                onPlayPause={handlePlay}
                onSeek={seek}
                onPlaybackRateChange={setPlaybackRate}
                src={`/audio/toefl/speaking/listen-repeat/${fileBasename}/${current + 1}.mp3`}
                playLabel={
                  playing ? "Pause" : currentTime > 0 ? "Resume" : "Play Audio"
                }
              />
              <DiffLegend />
              <p className={styles.fbLabel}>Comparison:</p>
              <ListenRepeatDiffView
                alignment={alignWords(
                  sentence.text,
                  transcripts[current] ?? "",
                )}
              />
              <p className={styles.hint}>
                {countCorrectWords(
                  alignWords(sentence.text, transcripts[current] ?? ""),
                )}
                /
                {countOriginalWords(
                  alignWords(sentence.text, transcripts[current] ?? ""),
                )}{" "}
                words correct
              </p>
              <Button onClick={handleNextSentence} size="lg">
                Next Sentence
              </Button>
            </div>
          )}

          <div className={styles.playerControls}>
            {phase !== "feedback" && (
              <Button
                onClick={handleReplayAudio}
                disabled={phase === "playing" || ttsLoading}
                size="sm"
                variant="secondary"
              >
                Replay audio
              </Button>
            )}
            <NextQuestionButton
              taskId={TASK_ID}
              variant="secondary"
              size="sm"
            />
          </div>
        </div>
      )}

      {graded && data && hasValidQuestionId && (
        <>
          <div className={styles.resultCard}>
            <h2>Section Complete</h2>
            <div className={styles.scoreBox}>
              <span className={styles.scoreNum}>{correctWords}</span>
              <span className={styles.scoreDen}>/{totalWords}</span>
              <span className={styles.scorePct}>
                (
                {totalWords > 0
                  ? Math.round((correctWords / totalWords) * 100)
                  : 0}
                %)
              </span>
            </div>
            <ScoreBars
              correct={correctWords}
              total={totalWords}
              pronunciation={pronunciationScore}
              speed={speedMetrics}
            />
            {assessed.length > 0 && assessed.length < totalSentences && (
              <p className={styles.hint}>
                Pronunciation scored for {assessed.length}/{totalSentences}{" "}
                sentences
              </p>
            )}
            {assessmentError && pronunciationScore === null && (
              <p className={styles.hint}>
                Pronunciation scoring unavailable: {assessmentError}
              </p>
            )}
            <div className={styles.actions}>
              <BackButton onClick={handleBackToList} size="lg" />
              <NextQuestionButton taskId={TASK_ID} size="lg" />
            </div>
          </div>

          {data.sentences.map((s, i) => {
            const alignment = alignWords(s.text, transcripts[i] ?? "");
            const correct = countCorrectWords(alignment);
            const total = countOriginalWords(alignment);
            const assessment = assessments[i];
            return (
              <div key={s.id} className={styles.card}>
                <p className={styles.qNum}>Question {i + 1}</p>
                <div className={styles.feedbackPhase}>
                  <AudioPlayer
                    playing={playing && activeReviewSentence === i}
                    loading={ttsLoading && activeReviewSentence === i}
                    error={null}
                    currentTime={activeReviewSentence === i ? currentTime : 0}
                    duration={activeReviewSentence === i ? duration : 0}
                    playbackRate={playbackRate}
                    onPlayPause={() => {
                      setActiveReviewSentence(i);
                      if (playing && activeReviewSentence === i) {
                        pause();
                      } else if (
                        activeReviewSentence === i &&
                        currentTime > 0
                      ) {
                        resume();
                      } else {
                        playSentence(i);
                      }
                    }}
                    onSeek={seek}
                    onPlaybackRateChange={setPlaybackRate}
                    src={`/audio/toefl/speaking/listen-repeat/${fileBasename}/${i + 1}.mp3`}
                    playLabel={
                      playing && activeReviewSentence === i
                        ? "Pause"
                        : activeReviewSentence === i && currentTime > 0
                          ? "Resume"
                          : activeReviewSentence === i
                            ? "Replay"
                            : "Play Audio"
                    }
                  />
                  <ScoreBars
                    correct={correct}
                    total={total}
                    pronunciation={assessment?.pronunciation ?? null}
                    speed={
                      assessment
                        ? computeSpeedMetrics([spokenWords(assessment)])
                        : null
                    }
                  />
                  {i === 0 && <DiffLegend />}
                  <p className={styles.fbLabel}>Comparison:</p>
                  <ListenRepeatDiffView alignment={alignment} />
                  {assessment && (
                    <p className={styles.hint}>
                      Mispronounced:{" "}
                      {assessment.words
                        .filter((w) => w.errorType === "Mispronunciation")
                        .map((w) => w.word)
                        .join(", ") || "none"}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { SectionHeader } from "../../../components/layout/SectionHeader";
import { Button } from "../../../components/ui/Button";
import { LoadingSpinner } from "../../../components/ui/LoadingSpinner";
import { FloatingElapsedTimer } from "../../../components/ui/FloatingElapsedTimer";
import { MicSelector } from "../../../components/ui/MicSelector";
import { VoiceButton } from "../../../components/ui/VoiceButton";
import { useElapsedTimer } from "../../../hooks/useElapsedTimer";
import { useQuestion } from "../../../hooks/useQuestion";
import { useScoreHistory } from "../../../hooks/useScoreHistory";
import { useTts } from "../../../hooks/useTts";
import { useSpeechRecognition } from "../../../hooks/useSpeechRecognition";
import { NextQuestionButton } from "../../../components/question/NextQuestionButton";
import {
  RUBRIC_METHOD,
  rubricScore,
  type ItemResponse,
} from "../../../lib/attempts";
import {
  assessPronunciation,
  type PronunciationResult,
} from "../../../lib/pronunciation";
import { toWav16k } from "../../../lib/wav";
import { alignWords, listenRepeatItemScore } from "./listenRepeat";
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

// Like the real test: one Start, then each prompt plays and recording
// starts on its own; only moving to the next sentence takes a click.
type Phase = "directions" | "playing" | "recording" | "processing" | "recorded";

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
    duration,
    play,
    stop: stopTts,
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
  const [phase, setPhase] = useState<Phase>("directions");
  const [graded, setGraded] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [recordingTimeLeft, setRecordingTimeLeft] = useState(0);
  const [processingMessage, setProcessingMessage] = useState<string | null>(
    null,
  );

  const durationRef = useRef(duration);
  const takesRef = useRef<Record<number, ItemResponse>>({});
  const transcriptsRef = useRef<Record<number, string>>({});
  const assessmentsRef = useRef<
    Record<number, PronunciationResult | { error: string }>
  >({});
  const pendingAssessmentsRef = useRef<Promise<void>[]>([]);
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

  const finishSet = useCallback(
    async (finalTranscripts: Record<number, string>) => {
      if (!data) return;
      setGraded(true);
      setPhase("processing");
      setProcessingMessage("Scoring your answers...");
      const sessionSeconds = stop();
      stopTts();
      await Promise.allSettled(pendingAssessmentsRef.current);

      const responses: ItemResponse[] = data.sentences.map((s, i) => {
        const result = assessmentsRef.current[i];
        const assessment = result && "words" in result ? result : undefined;
        const transcript = finalTranscripts[i] ?? "";
        return {
          ...takesRef.current[i],
          itemId: s.id,
          prompt: s.text,
          transcript,
          assessment,
          assessmentError:
            result && "error" in result ? result.error : undefined,
          itemScore: listenRepeatItemScore(
            alignWords(s.text, transcript),
            assessment?.pronunciation ?? null,
          ),
        };
      });
      const score = rubricScore(responses)!;
      try {
        const saved = await saveScore({
          taskId: TASK_ID,
          file: file ?? undefined,
          correct: score.correct,
          total: score.total,
          elapsedSeconds: sessionSeconds,
          method: RUBRIC_METHOD,
          responses,
          question: data,
        });
        if (saved) navigate(`/results/${saved.id}`);
      } catch (e) {
        setProcessingMessage(null);
        setSaveError(
          `Couldn't save your result: ${e instanceof Error ? e.message : String(e)}`,
        );
      }
    },
    [data, stop, stopTts, saveScore, file, navigate],
  );

  const finishSentence = useCallback(async () => {
    if (finishingRef.current) return;
    finishingRef.current = true;

    clearRecordingTimer();
    clearProcessingTimeout();
    const recording = await stopSpeech();
    if (sentence && recording.audio) {
      const index = current;
      // Runs beside transcription so a missing Azure key never blocks the flow.
      pendingAssessmentsRef.current.push(
        toWav16k(recording.audio)
          .then((wav) => assessPronunciation(wav, sentence.text))
          .then(
            (result) => {
              assessmentsRef.current[index] = result;
            },
            (e: unknown) => {
              assessmentsRef.current[index] = {
                error: e instanceof Error ? e.message : String(e),
              };
            },
          ),
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
      const next = {
        ...transcriptsRef.current,
        [current]: transcriptRef.current.trim(),
      };
      transcriptsRef.current = next;
      setProcessingMessage(null);
      finishingRef.current = false;
      if (isLastSentence) {
        void finishSet(next);
      } else {
        setPhase("recorded");
      }
    }, PROCESSING_DELAY_MS);
  }, [
    clearRecordingTimer,
    clearProcessingTimeout,
    stopSpeech,
    sentence,
    current,
    isLastSentence,
    finishSet,
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
      startRecording();
    });
  }, [sentence, fileBasename, current, play, startRecording]);

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
    transcriptsRef.current = {};
    assessmentsRef.current = {};
    pendingAssessmentsRef.current = [];
    setPhase("directions");
    setGraded(false);
    setRecordingTimeLeft(0);
    setProcessingMessage(null);
    finishingRef.current = false;
    navigate(`/${TASK_ID}`);
  };

  const handleRetryRecording = () => {
    clearRecordingTimer();
    clearProcessingTimeout();
    void stopSpeech();
    finishingRef.current = false;
    setProcessingMessage(null);
    setPhase("playing");
  };

  return (
    <div>
      {(running || elapsedSeconds > 0) && (
        <FloatingElapsedTimer display={display} running={running} />
      )}
      <SectionHeader
        title="Listen and Repeat"
        subtitle="Listen to the sentence, then repeat it into the microphone."
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
          {phase !== "directions" && (
            <p className={styles.qNum}>
              Question {current + 1} / {totalSentences}
            </p>
          )}

          {phase === "playing" && (
            <div className={styles.showPhase}>
              <p className={styles.sentenceDisplay}>Listen carefully...</p>
              <p className={styles.hint}>
                {ttsLoading ? "Loading audio…" : "The sentence is playing."}
              </p>
            </div>
          )}

          {phase === "directions" && (
            <div className={styles.showPhase}>
              <p className={styles.sentenceDisplay}>Listen and Repeat</p>
              <p className={styles.hint}>
                You will listen as someone speaks to you. Listen carefully, then
                repeat what you heard. Recording starts by itself when each
                sentence ends and stops when time is up. There is no preparation
                time, and each sentence plays only once.
              </p>
              <div className={styles.recordControls}>
                <MicSelector disabled={!speechSupported} previewEnabled />
                <Button
                  size="lg"
                  onClick={() => setPhase("playing")}
                  disabled={!speechSupported}
                >
                  Start
                </Button>
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

          {phase === "recorded" && !processingMessage && (
            <div className={styles.showPhase}>
              <p className={styles.sentenceDisplay}>Response recorded</p>
              <Button onClick={handleNextSentence} size="lg">
                Next
              </Button>
            </div>
          )}

          <div className={styles.playerControls}>
            <NextQuestionButton
              taskId={TASK_ID}
              variant="secondary"
              size="sm"
            />
          </div>
        </div>
      )}

      {graded && (
        <div className={styles.card}>
          {saveError ? (
            <div className={styles.error}>{saveError}</div>
          ) : (
            <LoadingSpinner message={processingMessage ?? "Saving..."} />
          )}
        </div>
      )}
    </div>
  );
}

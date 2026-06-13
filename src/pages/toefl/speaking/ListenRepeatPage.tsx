import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { SectionHeader } from "../../../components/layout/SectionHeader";
import { BackButton } from "../../../components/ui/BackButton";
import { Button } from "../../../components/ui/Button";
import { LoadingSpinner } from "../../../components/ui/LoadingSpinner";
import { ProgressBar } from "../../../components/ui/ProgressBar";
import { FloatingElapsedTimer } from "../../../components/ui/FloatingElapsedTimer";
import { useElapsedTimer } from "../../../hooks/useElapsedTimer";
import { useQuestion } from "../../../hooks/useQuestion";
import { useScoreHistory } from "../../../hooks/useScoreHistory";
import { useTts } from "../../../hooks/useTts";
import { useSpeechRecognition } from "../../../hooks/useSpeechRecognition";
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

const DEFAULT_WORDS_PER_SECOND = 2.2;
const RECORDING_MULTIPLIER = 1.5;
const PROCESSING_DELAY_MS = 400;

type Phase =
  | "playing"
  | "ready"
  | "recording"
  | "processing"
  | "feedback"
  | "review";

export function ListenRepeatPage() {
  const navigate = useNavigate();
  const { questionNumber } = useParams<{ questionNumber: string }>();
  const { data, file, loading, error, loadByQuestionNumber } =
    useQuestion<ProblemData>("toefl/speaking/listen-repeat");
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
    error: speechError,
    start: startSpeech,
    stop: stopSpeech,
  } = useSpeechRecognition();
  const transcriptRef = useRef(transcript);

  const [current, setCurrent] = useState(0);
  const [phase, setPhase] = useState<Phase>("playing");
  const [transcripts, setTranscripts] = useState<Record<number, string>>({});
  const [graded, setGraded] = useState(false);
  const [recordingTimeLeft, setRecordingTimeLeft] = useState(0);
  const [processingMessage, setProcessingMessage] = useState<string | null>(
    null,
  );

  const durationRef = useRef(duration);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const processingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  const parsedQuestionNumber = Number.parseInt(questionNumber ?? "", 10);
  const hasValidQuestionNumber =
    Number.isInteger(parsedQuestionNumber) && parsedQuestionNumber > 0;

  const fileBasename = file ? file.replace(/\.json$/i, "") : "";
  const totalSentences = data?.sentences.length ?? 0;
  const sentence = data?.sentences[current];
  const isLastSentence = current + 1 >= totalSentences;

  useEffect(() => {
    durationRef.current = duration;
  }, [duration]);

  useEffect(() => {
    if (!hasValidQuestionNumber) return;
    loadByQuestionNumber(parsedQuestionNumber);
  }, [hasValidQuestionNumber, loadByQuestionNumber, parsedQuestionNumber]);

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
    await stopSpeech();
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
            saveScore(
              "toefl/speaking/listen-repeat",
              correct,
              total,
              sessionSeconds,
              file ?? undefined,
            );
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
      setPhase("ready");
    });
  }, [sentence, fileBasename, current, play]);

  const handleStartRecording = useCallback(() => {
    startRecording();
  }, [startRecording]);

  const handleNextQuestion = useCallback(() => {
    if (isLastSentence) return;
    setCurrent((c) => c + 1);
    setPhase("playing");
  }, [isLastSentence]);

  useEffect(() => {
    if (
      data &&
      !loading &&
      !graded &&
      hasValidQuestionNumber &&
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
    hasValidQuestionNumber,
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
    setPhase("playing");
    setGraded(false);
    setRecordingTimeLeft(0);
    setProcessingMessage(null);
    finishingRef.current = false;
    navigate("/toefl/speaking/listen-repeat");
  };

  const handleReplayAudio = () => {
    clearRecordingTimer();
    clearProcessingTimeout();
    void stopSpeech();
    finishingRef.current = false;
    setProcessingMessage(null);
    setPhase("playing");
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

  return (
    <div>
      {(running || elapsedSeconds > 0) && (
        <FloatingElapsedTimer display={display} running={running} />
      )}
      <SectionHeader
        title="Listen and Repeat"
        subtitle="Listen to the sentence, then repeat it into the microphone."
        backTo="/toefl"
        current={current}
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
            questions/toefl/speaking/listen-repeat/ Add question JSON under this
            folder.
          </p>
        </div>
      )}
      {!hasValidQuestionNumber && (
        <div className={styles.error}>
          <p>Invalid question number in URL.</p>
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

      {data && !loading && hasValidQuestionNumber && !graded && sentence && (
        <div className={styles.card}>
          <p className={styles.qNum}>
            Question {current + 1} / {totalSentences}
          </p>

          {phase === "playing" && (
            <div className={styles.showPhase}>
              <div className={styles.statusIcon}>🔊</div>
              <p className={styles.sentenceDisplay}>Listen carefully...</p>
              <p className={styles.hint}>
                {ttsLoading ? "Loading audio..." : "The sentence is playing."}
              </p>
            </div>
          )}

          {phase === "ready" && (
            <div className={styles.showPhase}>
              <div className={styles.statusIcon}>🎤</div>
              <p className={styles.sentenceDisplay}>Ready to record</p>
              <p className={styles.hint}>
                Click the button below when you are ready to repeat the
                sentence.
              </p>
              <Button onClick={handleStartRecording} variant="accent" size="lg">
                🔴 Start Recording
              </Button>
            </div>
          )}

          {phase === "recording" && (
            <div className={styles.showPhase}>
              <div className={styles.recordingIndicator}>
                <span className={styles.recordingDot} />
                <span className={styles.recordingTimer}>
                  {recordingTimeLeft}s
                </span>
              </div>
              <p className={styles.sentenceDisplay}>Repeat the sentence now</p>
              <p className={styles.hint}>
                Microphone is on. Speak clearly before time runs out.
              </p>
              {transcript && (
                <p className={styles.liveTranscript}>{transcript}</p>
              )}
              {speechError && (
                <Button onClick={handleRetryRecording} variant="accent">
                  🔄 Retry This Sentence
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
              <p className={styles.fbLabel}>Original sentence:</p>
              <p className={styles.originalSentence}>{sentence.text}</p>
              <p className={styles.fbLabel}>Your speech (diff):</p>
              <div className={styles.diffView}>
                {alignWords(sentence.text, transcripts[current] ?? "").map(
                  (a, j) => {
                    const displayWord =
                      a.type === "deletion"
                        ? (a.original ?? "▪")
                        : (a.recognized ?? "▪");
                    return (
                      <span
                        key={j}
                        className={[
                          styles.diffWord,
                          a.correct ? styles.diffCorrect : styles.diffWrong,
                          a.type === "deletion" ? styles.diffMissing : "",
                          a.type === "insertion" ? styles.diffExtra : "",
                        ].join(" ")}
                        title={
                          a.type === "match"
                            ? ""
                            : a.type === "deletion"
                              ? `Missing: ${a.original}`
                              : a.type === "insertion"
                                ? `Extra: ${a.recognized}`
                                : `Expected: ${a.original}, got: ${a.recognized}`
                        }
                      >
                        {displayWord}
                      </span>
                    );
                  },
                )}
              </div>
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
              <Button onClick={handleNextQuestion} variant="accent" size="lg">
                Next Question
              </Button>
            </div>
          )}

          {phase !== "feedback" && (
            <div className={styles.playerControls}>
              <Button
                onClick={handleReplayAudio}
                disabled={phase === "playing" || ttsLoading}
                size="sm"
                variant="secondary"
              >
                🔁 Replay Audio
              </Button>
            </div>
          )}
        </div>
      )}

      {graded && data && hasValidQuestionNumber && (
        <>
          <div className={styles.resultCard}>
            <h2>Section Complete</h2>
            <p className={styles.hint}>Review your answers below.</p>
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
            <ProgressBar
              current={correctWords}
              total={totalWords}
              label="Words Correct"
            />
            <BackButton onClick={handleBackToList} size="lg" />
          </div>

          {data.sentences.map((s, i) => {
            const alignment = alignWords(s.text, transcripts[i] ?? "");
            const correct = countCorrectWords(alignment);
            const total = countOriginalWords(alignment);
            return (
              <div key={s.id} className={styles.card}>
                <p className={styles.qNum}>
                  Question {i + 1} — {correct}/{total} words
                </p>
                <div className={styles.feedbackPhase}>
                  <p className={styles.fbLabel}>Original sentence:</p>
                  <p className={styles.originalSentence}>{s.text}</p>
                  <p className={styles.fbLabel}>Your speech (diff):</p>
                  <div className={styles.diffView}>
                    {alignment.map((a, j) => {
                      const displayWord =
                        a.type === "deletion"
                          ? (a.original ?? "▪")
                          : (a.recognized ?? "▪");
                      return (
                        <span
                          key={j}
                          className={[
                            styles.diffWord,
                            a.correct ? styles.diffCorrect : styles.diffWrong,
                            a.type === "deletion" ? styles.diffMissing : "",
                            a.type === "insertion" ? styles.diffExtra : "",
                          ].join(" ")}
                          title={
                            a.type === "match"
                              ? ""
                              : a.type === "deletion"
                                ? `Missing: ${a.original}`
                                : a.type === "insertion"
                                  ? `Extra: ${a.recognized}`
                                  : `Expected: ${a.original}, got: ${a.recognized}`
                          }
                        >
                          {displayWord}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

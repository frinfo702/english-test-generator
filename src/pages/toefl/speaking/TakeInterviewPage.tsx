import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { SectionHeader } from "../../../components/layout/SectionHeader";
import { BackButton } from "../../../components/ui/BackButton";
import { Button } from "../../../components/ui/Button";
import { AudioPlayer } from "../../../components/ui/AudioPlayer";
import { LoadingSpinner } from "../../../components/ui/LoadingSpinner";
import { MicSelector } from "../../../components/ui/MicSelector";
import { MicWaveform } from "../../../components/ui/MicWaveform";
import { Timer } from "../../../components/ui/Timer";
import { ProgressBar } from "../../../components/ui/ProgressBar";
import { useTimer } from "../../../hooks/useTimer";
import { useQuestion } from "../../../hooks/useQuestion";
import { useSpeechRecognition } from "../../../hooks/useSpeechRecognition";
import { useSingleAudio } from "../../../hooks/useSingleAudio";
import {
  buildInterviewQaCopyMessage,
  buildProblemId,
  clearDraft,
  copyText,
  saveAnswerSubmission,
} from "../../../lib/answerSubmission";
import { pickInterviewerVoice } from "../../../lib/voiceMapping";
import { InterviewerCard } from "./InterviewerCard";
import {
  INTERVIEW_TASK_ID,
  INTERVIEW_TYPE_LABELS,
  type InterviewPhase,
  type InterviewProblemData,
  interviewAudioUrl,
  phasePrompt,
} from "./interviewTypes";
import styles from "./TakeInterviewPage.module.css";

export function TakeInterviewPage() {
  const navigate = useNavigate();
  const { questionNumber } = useParams<{ questionNumber: string }>();
  const { data, file, loading, error, loadByQuestionNumber } =
    useQuestion<InterviewProblemData>(INTERVIEW_TASK_ID);

  const [current, setCurrent] = useState(0);
  const [userText, setUserText] = useState("");
  const [phase, setPhase] = useState<InterviewPhase>("pre");
  const [done, setDone] = useState(false);
  const [savingAnswer, setSavingAnswer] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const submittingRef = useRef(false);

  const audio = useSingleAudio();
  const speech = useSpeechRecognition();

  const fileBasename = file ? file.replace(/\.json$/i, "") : "";
  const interviewerVoice = useMemo(
    () => (fileBasename ? pickInterviewerVoice(fileBasename) : "ara"),
    [fileBasename],
  );

  const q = data?.questions[current];
  const problemId =
    file && q
      ? buildProblemId(INTERVIEW_TASK_ID, file, q.id || String(current + 1))
      : null;

  const questionUrl =
    fileBasename && q
      ? interviewAudioUrl(fileBasename, current, "question")
      : null;
  const modelUrl =
    fileBasename && q
      ? interviewAudioUrl(fileBasename, current, "model")
      : null;

  const qaCopyMessage = useMemo(() => {
    if (!q) return null;
    return buildInterviewQaCopyMessage({
      question: q.question,
      userAnswer: userText,
      modelAnswer: q.modelAnswer,
      evaluationPoints: q.evaluationPoints,
      questionType: INTERVIEW_TYPE_LABELS[q.type] ?? q.type,
    });
  }, [q, userText]);

  const { clearTranscript, clearError: clearSpeechError } = speech;

  const clearSessionBits = useCallback(() => {
    setUserText("");
    setSaveError(null);
    setCopied(false);
    clearTranscript();
    clearSpeechError();
    submittingRef.current = false;
  }, [clearTranscript, clearSpeechError]);

  const timerStopRef = useRef<() => void>(() => undefined);

  const finishAnswer = useCallback(async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    timerStopRef.current();
    audio.stop();
    setPhase("processing");

    try {
      const finalText = (await speech.stop()).trim();
      setUserText(finalText);
      setPhase("submitted");

      if (q && problemId) {
        setSavingAnswer(true);
        setSaveError(null);
        try {
          await saveAnswerSubmission({
            taskId: INTERVIEW_TASK_ID,
            problemId,
            response: finalText,
            question: q,
          });
          clearDraft(problemId);
        } catch (e) {
          setSaveError(
            e instanceof Error ? e.message : "Failed to save your answer.",
          );
        } finally {
          setSavingAnswer(false);
        }
      }
    } catch {
      setPhase("submitted");
      setSaveError("Failed to process your recording.");
    } finally {
      submittingRef.current = false;
    }
  }, [audio, speech, q, problemId]);

  const timer = useTimer(45, () => {
    void finishAnswer();
  });
  timerStopRef.current = timer.stop;

  const parsedQuestionNumber = Number.parseInt(questionNumber ?? "", 10);
  const hasValidQuestionNumber =
    Number.isInteger(parsedQuestionNumber) && parsedQuestionNumber > 0;

  useEffect(() => {
    if (!hasValidQuestionNumber) return;
    loadByQuestionNumber(parsedQuestionNumber);
  }, [hasValidQuestionNumber, loadByQuestionNumber, parsedQuestionNumber]);

  useEffect(() => {
    if (!problemId) return;
    clearSessionBits();
  }, [problemId, clearSessionBits]);

  useEffect(() => {
    return () => {
      audio.stop();
      void speech.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- unmount only
  }, []);

  const timerStart = timer.start;
  const startSpeech = speech.start;

  const startAnswering = useCallback(() => {
    setPhase("answering");
    clearSpeechError();
    clearTranscript();
    setUserText("");
    timerStart();
    void startSpeech();
  }, [timerStart, startSpeech, clearSpeechError, clearTranscript]);

  const handleStart = () => {
    if (!questionUrl) {
      startAnswering();
      return;
    }
    setPhase("listening");
    audio.play("question", questionUrl, startAnswering);
  };

  const handleRetryRecording = () => {
    clearSessionBits();
    setPhase("answering");
    timer.reset();
    timer.start();
    void speech.start();
  };

  const handleCopyQa = async () => {
    if (!qaCopyMessage) return;
    try {
      const ok = await copyText(qaCopyMessage);
      if (!ok) {
        setSaveError("Clipboard is not available in this environment.");
        return;
      }
      setCopied(true);
    } catch {
      setSaveError("Failed to copy.");
    }
  };

  const goToQuestionList = () => {
    audio.stop();
    void speech.stop();
    setCurrent(0);
    setPhase("pre");
    setDone(false);
    setSavingAnswer(false);
    clearSessionBits();
    timer.reset();
    navigate("/toefl/speaking/interview");
  };

  const handleNext = () => {
    if (!data) return;
    audio.stop();
    void speech.stop();
    if (current + 1 >= data.questions.length) {
      setDone(true);
      return;
    }
    setCurrent((c) => c + 1);
    setPhase("pre");
    setSavingAnswer(false);
    clearSessionBits();
    timer.reset();
  };

  const busyPhase =
    phase === "answering" || phase === "listening" || phase === "processing";
  const questionActive = audio.isActive("question");
  const modelActive = audio.isActive("model");
  const displayAnswer = userText || speech.transcript;

  return (
    <div>
      <SectionHeader
        title="Take an Interview"
        subtitle="Listen, then speak your answer (45 seconds). Text is hidden like the real test."
        backTo="/toefl"
        current={done ? data?.questions.length : current}
        total={data?.questions.length}
      />

      <div className={styles.topBar}>
        <Button
          variant="secondary"
          size="sm"
          onClick={goToQuestionList}
          disabled={loading || busyPhase}
        >
          Question List
        </Button>
      </div>

      {loading && <LoadingSpinner message="Loading question set..." />}
      {error && (
        <div className={styles.error}>
          <p>{error}</p>
          <p className={styles.errorHint}>
            Add question JSON under questions/toefl/speaking/interview/.
          </p>
        </div>
      )}
      {!hasValidQuestionNumber && (
        <div className={styles.error}>
          <p>Invalid question number in URL.</p>
        </div>
      )}

      {data && !loading && hasValidQuestionNumber && !done && q && (
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.typeTag}>
              {INTERVIEW_TYPE_LABELS[q.type] ?? q.type}
            </span>
            <span className={styles.qNum}>
              Question {current + 1} / {data.questions.length}
            </span>
          </div>

          <InterviewerCard
            voiceId={interviewerVoice}
            speaking={
              phase === "listening" || (audio.playing && questionActive)
            }
          />

          {phase === "submitted" ? (
            <p className={styles.question}>{q.question}</p>
          ) : (
            <p className={styles.questionHidden}>{phasePrompt(phase)}</p>
          )}

          {phase === "pre" && (
            <div className={styles.preBox}>
              <p className={styles.preNote}>
                There is no prep time. Press Start to hear the question, then
                speak your answer within 45 seconds.
              </p>
              <MicSelector disabled={!speech.supported} />
              {!speech.supported && (
                <p className={styles.error}>
                  Microphone recording is not supported in this browser.
                </p>
              )}
              <Button
                size="lg"
                onClick={handleStart}
                disabled={!speech.supported}
              >
                Start
              </Button>
            </div>
          )}

          {phase === "listening" && questionUrl && (
            <div className={styles.listeningBox}>
              <p className={styles.preNote}>
                Listen carefully. Recording starts when the question finishes.
              </p>
              <AudioPlayer
                playing={audio.playing && questionActive}
                loading={audio.loading && questionActive}
                error={questionActive ? audio.error : null}
                currentTime={questionActive ? audio.currentTime : 0}
                duration={questionActive ? audio.duration : 0}
                playbackRate={audio.playbackRate}
                onPlayPause={() =>
                  audio.toggle("question", questionUrl, startAnswering)
                }
                onSeek={audio.seek}
                onPlaybackRateChange={audio.setPlaybackRate}
                seekable
                playLabel={
                  audio.loading && questionActive
                    ? "Loading..."
                    : audio.playing && questionActive
                      ? "⏸ Pause"
                      : "▶ Replay question"
                }
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  audio.stop();
                  startAnswering();
                }}
              >
                Skip to answer
              </Button>
            </div>
          )}

          {phase === "answering" && (
            <div className={styles.answerArea}>
              {questionUrl && (
                <div className={styles.replayRow}>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => audio.toggle("question", questionUrl)}
                    disabled={audio.loading || speech.recording}
                  >
                    {audio.playing && questionActive
                      ? "⏸ Pause question"
                      : "🔁 Replay question"}
                  </Button>
                </div>
              )}
              <Timer
                display={timer.display}
                isWarning={timer.isWarning}
                isExpired={timer.isExpired}
              />
              <div className={styles.recordingStatus}>
                <span
                  className={
                    speech.recording
                      ? styles.recordingDot
                      : styles.recordingDotIdle
                  }
                />
                <span>
                  {speech.recording
                    ? "Recording… speak clearly"
                    : "Starting microphone…"}
                </span>
              </div>
              <MicSelector
                disabled
                requestPermissionOnMount={false}
                activeDeviceId={speech.activeDeviceId}
              />
              <MicWaveform levels={speech.levels} active={speech.recording} />
              {speech.error && (
                <div className={styles.error}>
                  <p>{speech.error}</p>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleRetryRecording}
                  >
                    Retry recording
                  </Button>
                </div>
              )}
              <Button
                onClick={() => {
                  void finishAnswer();
                }}
                disabled={!speech.recording}
              >
                Stop &amp; Submit
              </Button>
            </div>
          )}

          {phase === "processing" && (
            <div className={styles.answerArea}>
              <LoadingSpinner
                message={
                  speech.processing
                    ? "Transcribing your answer…"
                    : "Processing your answer…"
                }
              />
            </div>
          )}

          {phase === "submitted" && (
            <div className={styles.feedbackArea}>
              <div className={styles.userAnswerCard}>
                <h3>Your spoken answer</h3>
                {displayAnswer ? (
                  <p className={styles.userAnswerText}>{displayAnswer}</p>
                ) : (
                  <p className={styles.userAnswerEmpty}>
                    No speech was detected. Try the next question, or retry if
                    you can.
                  </p>
                )}
                {savingAnswer && (
                  <p className={styles.preNote}>Saving your answer…</p>
                )}
                {saveError && <p className={styles.error}>{saveError}</p>}
                {speech.error && <p className={styles.error}>{speech.error}</p>}
              </div>

              <div className={styles.copyCard}>
                <p className={styles.preNote}>
                  Copy the question and your answer, then paste into your own AI
                  chat for detailed feedback.
                </p>
                <Button
                  variant="secondary"
                  onClick={() => {
                    void handleCopyQa();
                  }}
                  disabled={!qaCopyMessage}
                >
                  {copied ? "Copied" : "Copy question and answer"}
                </Button>
              </div>

              <div className={styles.evalCard}>
                <h3>Evaluation Points</h3>
                <ul>
                  {q.evaluationPoints.map((pt, i) => (
                    <li key={i}>{pt}</li>
                  ))}
                </ul>
              </div>

              <div className={styles.modelArea}>
                <div className={styles.modelAnswer}>
                  <h3>Sample Answer</h3>
                  <p>{q.modelAnswer}</p>
                  {modelUrl && (
                    <div className={styles.modelPlayer}>
                      <AudioPlayer
                        playing={audio.playing && modelActive}
                        loading={audio.loading && modelActive}
                        error={modelActive ? audio.error : null}
                        currentTime={modelActive ? audio.currentTime : 0}
                        duration={modelActive ? audio.duration : 0}
                        playbackRate={audio.playbackRate}
                        onPlayPause={() => audio.toggle("model", modelUrl)}
                        onSeek={audio.seek}
                        onPlaybackRateChange={audio.setPlaybackRate}
                        seekable
                        playLabel={
                          audio.loading && modelActive
                            ? "Loading..."
                            : audio.playing && modelActive
                              ? "⏸ Pause"
                              : audio.currentTime > 0 && modelActive
                                ? "▶ Resume"
                                : "▶ Play sample answer"
                        }
                      />
                    </div>
                  )}
                </div>
              </div>

              <Button onClick={handleNext}>
                {current + 1 < data.questions.length
                  ? "Next Question"
                  : "Finish"}
              </Button>
            </div>
          )}
        </div>
      )}

      {done && data && hasValidQuestionNumber && (
        <div className={styles.resultCard}>
          <h2>Interview Complete</h2>
          <p>You answered all {data.questions.length} questions.</p>
          <ProgressBar
            current={data.questions.length}
            total={data.questions.length}
            label="Complete"
          />
          <BackButton onClick={goToQuestionList} size="lg" />
        </div>
      )}
    </div>
  );
}

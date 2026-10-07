import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { SectionHeader } from "../../../components/layout/SectionHeader";
import { BarGroup } from "../../../components/ui/BarGroup";
import { Button } from "../../../components/ui/Button";
import { ScorePips } from "../../../components/pixel/ScorePips";
import { AudioPlayer } from "../../../components/ui/AudioPlayer";
import { LoadingSpinner } from "../../../components/ui/LoadingSpinner";
import { MicSelector } from "../../../components/ui/MicSelector";
import { VoiceButton } from "../../../components/ui/VoiceButton";
import { Timer } from "../../../components/ui/Timer";
import { ProgressBar } from "../../../components/ui/ProgressBar";
import { useTimer } from "../../../hooks/useTimer";
import { useQuestion } from "../../../hooks/useQuestion";
import { useSpeechRecognition } from "../../../hooks/useSpeechRecognition";
import { useSingleAudio } from "../../../hooks/useSingleAudio";
import { NextQuestionButton } from "../../../components/question/NextQuestionButton";
import {
  buildInterviewQaCopyMessage,
  buildProblemId,
  clearDraft,
} from "../../../lib/answerSubmission";
import {
  putAttempts,
  rubricScore,
  type Attempt,
  type ItemResponse,
} from "../../../lib/attempts";
import {
  interviewItemScore,
  type AiInterviewScores,
} from "../../../lib/interviewScoring";
import type { PronunciationResult } from "../../../lib/pronunciation";
import { assessSpontaneousSpeech } from "../../../lib/pronunciationStream";
import { computeSpeedMetrics, speedScore } from "../../../lib/speakingRate";
import { toWav16k } from "../../../lib/wav";
import { questionIdFromFile } from "../../../lib/questions";
import { pickInterviewerVoice } from "../../../lib/voiceMapping";
import { AiScorePanel } from "./AiScorePanel";
import { InterviewerCard } from "./InterviewerCard";
import { InterviewTranscript } from "./InterviewTranscript";
import {
  INTERVIEW_TASK_ID,
  INTERVIEW_TYPE_LABELS,
  type InterviewPhase,
  type InterviewProblemData,
  interviewAudioUrl,
  interviewChrome,
  interviewScenarioAudioUrl,
  isScenarioStep,
  phasePrompt,
} from "./interviewTypes";
import styles from "./TakeInterviewPage.module.css";

export function TakeInterviewPage() {
  const navigate = useNavigate();
  const { questionId = "" } = useParams<{ questionId: string }>();
  const { data, file, loading, error, loadById } =
    useQuestion<InterviewProblemData>(INTERVIEW_TASK_ID);

  const [current, setCurrent] = useState(0);
  const [userText, setUserText] = useState("");
  const [phase, setPhase] = useState<InterviewPhase>("pre");
  const [savingAnswer, setSavingAnswer] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [assessment, setAssessment] = useState<PronunciationResult | null>(
    null,
  );
  const [assessError, setAssessError] = useState<string | null>(null);
  const [aiScores, setAiScores] = useState<AiInterviewScores | null>(null);
  const [finishing, setFinishing] = useState(false);
  const assessGenerationRef = useRef(0);
  const attemptRef = useRef<Attempt | null>(null);
  const pendingRef = useRef<Promise<unknown>[]>([]);
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

  const hasScenario = Boolean(data?.scenario?.trim());
  const scenarioUrl =
    fileBasename && hasScenario
      ? interviewScenarioAudioUrl(fileBasename)
      : null;
  const questionUrl =
    fileBasename && q
      ? interviewAudioUrl(fileBasename, current, "question")
      : null;
  const modelUrl =
    fileBasename && q
      ? interviewAudioUrl(fileBasename, current, "model")
      : null;

  const onScenarioStep = isScenarioStep(phase, current, hasScenario);
  const chrome = q
    ? interviewChrome(
        phase,
        current,
        data?.questions.length ?? 0,
        q.type,
        hasScenario,
      )
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
    setAssessment(null);
    setAssessError(null);
    setAiScores(null);
    assessGenerationRef.current += 1;
    clearTranscript();
    clearSpeechError();
    submittingRef.current = false;
  }, [clearTranscript, clearSpeechError]);

  const resetInteraction = useCallback(() => {
    setPhase("pre");
    setSavingAnswer(false);
    clearSessionBits();
  }, [clearSessionBits]);

  const timerStopRef = useRef<() => void>(() => undefined);

  /**
   * One attempt per set, rewritten after every change, so a set abandoned
   * halfway still keeps the answers already given.
   */
  const persist = useCallback(
    async (index: number, patch: Partial<ItemResponse>) => {
      if (!data || !file) return;
      const attempt: Attempt = (attemptRef.current ??= {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        taskId: INTERVIEW_TASK_ID,
        problemId: questionIdFromFile(file),
        question: data,
        responses: data.questions.map((question) => ({
          itemId: question.id,
          prompt: question.question,
        })),
      });
      const merged = { ...attempt.responses[index], ...patch };
      // Content is the part a transcript can't fake; without the AI half the
      // item stays unscored rather than scored on delivery alone.
      merged.itemScore = merged.ai
        ? interviewItemScore(merged.ai.scores, merged.assessment ?? null)?.total
        : undefined;
      attempt.responses[index] = merged;
      attempt.score = rubricScore(attempt.responses);
      try {
        await putAttempts([attempt]);
      } catch (e) {
        setSaveError(
          e instanceof Error ? e.message : "Failed to save your answer.",
        );
      }
    },
    [data, file],
  );

  const finishAnswer = useCallback(async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    timerStopRef.current();
    audio.stop();
    setPhase("processing");

    try {
      const recording = await speech.stop();
      const finalText = recording.text.trim();
      const index = current;
      if (recording.audio) {
        const generation = assessGenerationRef.current;
        const isCurrent = () => generation === assessGenerationRef.current;
        pendingRef.current.push(
          toWav16k(recording.audio)
            .then(assessSpontaneousSpeech)
            .then(
              (result) => {
                if (isCurrent()) setAssessment(result);
                return persist(index, { assessment: result });
              },
              (e: unknown) => {
                const message = e instanceof Error ? e.message : String(e);
                if (isCurrent()) setAssessError(message);
                return persist(index, { assessmentError: message });
              },
            ),
        );
      } else {
        setAssessError("No audio was recorded.");
      }
      setUserText(finalText);
      setPhase("submitted");

      setSavingAnswer(true);
      setSaveError(null);
      await persist(index, {
        audio: recording.audio ?? undefined,
        recordedAt: recording.startedAt ?? undefined,
        transcript: finalText,
      });
      setSavingAnswer(false);
      if (problemId) clearDraft(problemId);
    } catch {
      setPhase("submitted");
      setSaveError("Failed to process your recording.");
    } finally {
      submittingRef.current = false;
    }
  }, [audio, speech, current, persist, problemId]);

  const timer = useTimer(45, () => {
    void finishAnswer();
  });
  timerStopRef.current = timer.stop;

  const hasValidQuestionId = questionId !== "";

  useEffect(() => {
    if (!hasValidQuestionId) return;
    loadById(questionId);
  }, [hasValidQuestionId, loadById, questionId]);

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

  const playQuestion = useCallback(() => {
    if (!questionUrl) {
      startAnswering();
      return;
    }
    setPhase("listening");
    audio.play("question", questionUrl, startAnswering);
  }, [audio, questionUrl, startAnswering]);

  const playScenario = useCallback(() => {
    if (!scenarioUrl) {
      playQuestion();
      return;
    }
    // Scenario only — do not auto-advance; user presses Continue.
    setPhase("scenario");
    audio.play("scenario", scenarioUrl);
  }, [audio, scenarioUrl, playQuestion]);

  const handleStart = () => {
    if (onScenarioStep && scenarioUrl) {
      playScenario();
      return;
    }
    playQuestion();
  };

  const handleContinueFromScenario = () => {
    audio.stop();
    playQuestion();
  };

  const handleRetryRecording = () => {
    clearSessionBits();
    setPhase("answering");
    timer.reset();
    timer.start();
    void speech.start();
  };

  const goToQuestionList = () => {
    audio.stop();
    void speech.stop();
    setCurrent(0);
    attemptRef.current = null;
    pendingRef.current = [];
    resetInteraction();
    timer.reset();
    navigate(`/${INTERVIEW_TASK_ID}`);
  };

  const handleApplyAi = (ai: { reply: string; scores: AiInterviewScores }) => {
    setAiScores(ai.scores);
    void persist(current, { ai });
  };

  const handleNext = async () => {
    if (!data) return;
    audio.stop();
    void speech.stop();
    if (current + 1 < data.questions.length) {
      setCurrent((c) => c + 1);
      resetInteraction();
      timer.reset();
      return;
    }
    setFinishing(true);
    // The last answer's pronunciation is usually still in flight.
    await Promise.allSettled(pendingRef.current);
    const attempt = attemptRef.current;
    if (attempt) navigate(`/results/${attempt.id}`);
    else goToQuestionList();
  };

  const busyPhase =
    phase === "answering" ||
    phase === "listening" ||
    phase === "scenario" ||
    phase === "processing";
  const scenarioActive = audio.isActive("scenario");
  const questionActive = audio.isActive("question");
  const modelActive = audio.isActive("model");
  const displayAnswer = userText || speech.transcript;
  const itemScore = interviewItemScore(aiScores, assessment);
  const speedMetrics = assessment
    ? computeSpeedMetrics([assessment.words])
    : null;

  return (
    <div>
      <SectionHeader
        title="Take an Interview"
        subtitle="Listen, then speak your answer (45 seconds). Text is hidden like the real test."
        backTo="/toefl"
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

      {loading && <LoadingSpinner message="Loading question..." />}
      {error && (
        <div className={styles.error}>
          <p>{error}</p>
          <p className={styles.errorHint}>
            Add question JSON under questions/toefl/speaking/interview/.
          </p>
        </div>
      )}
      {!hasValidQuestionId && (
        <div className={styles.error}>
          <p>Invalid question ID in URL.</p>
        </div>
      )}

      {data && !loading && hasValidQuestionId && q && chrome && (
        <div
          className={[
            styles.card,
            phase === "submitted" ? styles.cardWide : "",
          ].join(" ")}
        >
          <div className={styles.cardHeader}>
            <span className={styles.typeTag}>{chrome.tag}</span>
            {chrome.position !== chrome.tag && (
              <span className={styles.qNum}>{chrome.position}</span>
            )}
          </div>

          <InterviewerCard
            voiceId={interviewerVoice}
            speaking={
              phase === "scenario" ||
              phase === "listening" ||
              (audio.playing && (scenarioActive || questionActive))
            }
          />

          {phase === "submitted" ? (
            <p className={styles.question}>{q.question}</p>
          ) : (
            <p className={styles.questionHidden}>{phasePrompt(phase)}</p>
          )}

          {phase !== "submitted" && (
            <InterviewTranscript
              kind={onScenarioStep ? "scenario" : "question"}
              scenario={data.scenario}
              question={q.question}
            />
          )}

          {phase === "pre" && (
            <div className={styles.preBox}>
              <p className={styles.preNote}>
                {onScenarioStep
                  ? "Step 1 of 2 — Scenario. Press Start Scenario to hear the research-study introduction (audio only). Continue to Question 1 with a button after the scenario."
                  : "There is no prep time. Press Start to hear the question, then speak your answer within 45 seconds."}
              </p>
              <MicSelector disabled={!speech.supported} previewEnabled />
              {!speech.supported && (
                <p className={styles.error}>
                  Microphone recording is not supported in this browser.
                </p>
              )}
              <div className={styles.actions}>
                <Button
                  size="lg"
                  onClick={handleStart}
                  disabled={!speech.supported}
                >
                  {onScenarioStep ? "Start Scenario" : "Start"}
                </Button>
                <NextQuestionButton
                  taskId={INTERVIEW_TASK_ID}
                  variant="secondary"
                  size="lg"
                />
              </div>
            </div>
          )}

          {phase === "scenario" && scenarioUrl && (
            <div className={styles.listeningBox}>
              <p className={styles.preNote}>
                Listen carefully to the scenario. It will not advance
                automatically — press Continue to Question 1 when you are ready.
              </p>
              <AudioPlayer
                playing={audio.playing && scenarioActive}
                loading={audio.loading && scenarioActive}
                error={scenarioActive ? audio.error : null}
                currentTime={scenarioActive ? audio.currentTime : 0}
                duration={scenarioActive ? audio.duration : 0}
                playbackRate={audio.playbackRate}
                onPlayPause={() => audio.toggle("scenario", scenarioUrl)}
                onSeek={audio.seek}
                onPlaybackRateChange={audio.setPlaybackRate}
                seekable
                src={scenarioUrl}
                playLabel={
                  audio.loading && scenarioActive
                    ? "Loading..."
                    : audio.playing && scenarioActive
                      ? "Pause"
                      : "Replay scenario"
                }
              />
              <div className={styles.listeningActions}>
                <Button
                  size="lg"
                  onClick={handleContinueFromScenario}
                  disabled={audio.loading && scenarioActive}
                >
                  Continue to Question 1
                </Button>
              </div>
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
                src={questionUrl}
                playLabel={
                  audio.loading && questionActive
                    ? "Loading..."
                    : audio.playing && questionActive
                      ? "Pause"
                      : "Replay question"
                }
              />
              <div className={styles.listeningActions}>
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
                      ? "Pause question"
                      : "Replay question"}
                  </Button>
                </div>
              )}
              <Timer
                display={timer.display}
                isWarning={timer.isWarning}
                isExpired={timer.isExpired}
              />
              <VoiceButton
                state={speech.recording ? "recording" : "processing"}
                label="Recording"
                size="lg"
                variant="primary"
                levels={speech.levels}
                onPress={() => {
                  void finishAnswer();
                }}
              />
              <MicSelector
                disabled
                requestPermissionOnMount={false}
                activeDeviceId={speech.activeDeviceId}
              />
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
              <div className={styles.feedbackGrid}>
                <div className={styles.feedbackMain}>
                  <section className={styles.userAnswerCard}>
                    <h3>Your spoken answer</h3>
                    {displayAnswer ? (
                      <p className={styles.userAnswerText}>{displayAnswer}</p>
                    ) : (
                      <p className={styles.userAnswerEmpty}>
                        No speech was detected. Try the next question, or retry
                        if you can.
                      </p>
                    )}
                    {savingAnswer && (
                      <p className={styles.preNote}>Saving your answer…</p>
                    )}
                    {saveError && <p className={styles.error}>{saveError}</p>}
                    {speech.error && (
                      <p className={styles.error}>{speech.error}</p>
                    )}
                  </section>

                  {qaCopyMessage && !aiScores && (
                    <AiScorePanel
                      message={qaCopyMessage}
                      onApply={handleApplyAi}
                    />
                  )}

                  <details className={styles.sampleDetails}>
                    <summary>Sample answer</summary>
                    <div className={styles.modelAnswer}>
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
                            src={modelUrl}
                            playLabel={
                              audio.loading && modelActive
                                ? "Loading..."
                                : audio.playing && modelActive
                                  ? "Pause"
                                  : audio.currentTime > 0 && modelActive
                                    ? "Resume"
                                    : "Play sample answer"
                            }
                          />
                        </div>
                      )}
                    </div>
                  </details>
                </div>

                <aside className={styles.feedbackSide}>
                  <div className={styles.scoreHead}>
                    <ScorePips
                      score={aiScores ? (itemScore?.total ?? null) : null}
                    />
                    {aiScores && itemScore ? (
                      <p>
                        <strong>{itemScore.total}</strong>/5
                        {!assessment && " · partial"}
                      </p>
                    ) : (
                      <p>Waiting for the AI score</p>
                    )}
                  </div>
                  <BarGroup>
                    {itemScore?.languageUse !== undefined && (
                      <ProgressBar
                        current={itemScore.languageUse}
                        total={5}
                        label="Language use"
                      />
                    )}
                    {itemScore?.organization !== undefined && (
                      <ProgressBar
                        current={itemScore.organization}
                        total={5}
                        label="Organization"
                      />
                    )}
                    {assessment && speedMetrics ? (
                      <>
                        <ProgressBar
                          current={Math.round(assessment.pronunciation)}
                          total={100}
                          label="Pronunciation"
                        />
                        <ProgressBar
                          current={Math.round(speedScore(speedMetrics))}
                          total={100}
                          label="Speed"
                        />
                        <p className={styles.preNote}>
                          {Math.round(speedMetrics.speakingRate)} words/min ·{" "}
                          {speedMetrics.longPausesPerMinute.toFixed(1)} long
                          pauses/min
                        </p>
                        {assessment.words.some((w) => w.accuracy < 60) && (
                          <p className={styles.preNote}>
                            Unclear words:{" "}
                            {assessment.words
                              .filter((w) => w.accuracy < 60)
                              .map((w) => w.word)
                              .join(", ")}
                          </p>
                        )}
                      </>
                    ) : (
                      <p className={styles.preNote}>
                        {assessError
                          ? `Pronunciation not scored: ${assessError}`
                          : "Scoring pronunciation…"}
                      </p>
                    )}
                  </BarGroup>

                  <div className={styles.evalCard}>
                    <h3>Evaluation points</h3>
                    <ul>
                      {q.evaluationPoints.map((pt, i) => (
                        <li key={i}>{pt}</li>
                      ))}
                    </ul>
                  </div>
                </aside>
              </div>

              <div className={styles.actions}>
                <Button onClick={() => void handleNext()} disabled={finishing}>
                  {current + 1 < data.questions.length
                    ? "Continue"
                    : finishing
                      ? "Finishing…"
                      : "Finish"}
                </Button>
                <NextQuestionButton
                  taskId={INTERVIEW_TASK_ID}
                  variant="secondary"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

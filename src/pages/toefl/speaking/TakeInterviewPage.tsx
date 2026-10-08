import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { SectionHeader } from "../../../components/layout/SectionHeader";
import { Button } from "../../../components/ui/Button";
import { LoadingSpinner } from "../../../components/ui/LoadingSpinner";
import { MicSelector } from "../../../components/ui/MicSelector";
import { VoiceButton } from "../../../components/ui/VoiceButton";
import { Timer } from "../../../components/ui/Timer";
import { useTimer } from "../../../hooks/useTimer";
import { useQuestion } from "../../../hooks/useQuestion";
import { useSpeechRecognition } from "../../../hooks/useSpeechRecognition";
import { useSingleAudio } from "../../../hooks/useSingleAudio";
import { NextQuestionButton } from "../../../components/question/NextQuestionButton";
import { buildProblemId, clearDraft } from "../../../lib/answerSubmission";
import {
  putAttempts,
  rubricScore,
  type Attempt,
  type ItemResponse,
} from "../../../lib/attempts";
import { interviewItemScore } from "../../../lib/interviewScoring";
import { assessSpontaneousSpeech } from "../../../lib/pronunciationStream";
import { toWav16k } from "../../../lib/wav";
import { questionIdFromFile } from "../../../lib/questions";
import { pickInterviewerVoice } from "../../../lib/voiceMapping";
import { InterviewerCard } from "./InterviewerCard";
import { InterviewTranscript } from "./InterviewTranscript";
import {
  INTERVIEW_TASK_ID,
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
  const [phase, setPhase] = useState<InterviewPhase>("pre");
  const [savingAnswer, setSavingAnswer] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);
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

  const { clearTranscript, clearError: clearSpeechError } = speech;

  const clearSessionBits = useCallback(() => {
    setSaveError(null);
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
      // Scored beside the flow so a missing Azure key never blocks the test.
      if (recording.audio) {
        pendingRef.current.push(
          toWav16k(recording.audio)
            .then(assessSpontaneousSpeech)
            .then(
              (result) => persist(index, { assessment: result }),
              (e: unknown) =>
                persist(index, {
                  assessmentError: e instanceof Error ? e.message : String(e),
                }),
            ),
        );
      }
      setPhase("recorded");

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
      setPhase("recorded");
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
    setPhase("scenario");
    audio.play("scenario", scenarioUrl, playQuestion);
  }, [audio, scenarioUrl, playQuestion]);

  const handleStart = () => {
    if (onScenarioStep && scenarioUrl) {
      playScenario();
      return;
    }
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

  const handleNext = async () => {
    if (!data) return;
    audio.stop();
    void speech.stop();
    if (current + 1 < data.questions.length) {
      const next = current + 1;
      setCurrent(next);
      clearSessionBits();
      timer.reset();
      // The next question plays at once and records when it ends, as on test day.
      setPhase("listening");
      audio.play(
        "question",
        interviewAudioUrl(fileBasename, next, "question"),
        startAnswering,
      );
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
  return (
    <div>
      <SectionHeader
        title="Take an Interview"
        subtitle="Listen, then speak your answer (45 seconds). Text is hidden like the real test."
        backTo="/toefl"
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={goToQuestionList}
            disabled={loading || busyPhase}
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
        <div className={styles.card}>
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

          <p className={styles.questionHidden}>{phasePrompt(phase)}</p>

          <InterviewTranscript
            kind={onScenarioStep ? "scenario" : "question"}
            scenario={data.scenario}
            question={q.question}
          />

          {phase === "pre" && (
            <div className={styles.preBox}>
              <p className={styles.preNote}>
                You will take part in a short interview. After you press Start,{" "}
                {onScenarioStep ? "you will hear the scenario, then " : ""}
                each question plays once and recording starts as soon as it
                ends. You have 45 seconds to answer, with no preparation time.
                When time is up, recording stops and you move on with Next.
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
                  Start
                </Button>
                <NextQuestionButton
                  taskId={INTERVIEW_TASK_ID}
                  variant="secondary"
                  size="lg"
                />
              </div>
            </div>
          )}

          {(phase === "scenario" || phase === "listening") && (
            <div className={styles.listeningBox}>
              <p className={styles.preNote}>
                {phase === "scenario"
                  ? "Listen to the scenario. The first question follows it."
                  : "Listen carefully. Recording starts when the question ends."}
              </p>
            </div>
          )}

          {phase === "answering" && (
            <div className={styles.answerArea}>
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

          {phase === "recorded" && (
            <div className={styles.answerArea}>
              <p className={styles.preNote}>
                {savingAnswer ? "Saving your answer…" : "Response recorded."}
              </p>
              {saveError && <p className={styles.error}>{saveError}</p>}
              {speech.error && <p className={styles.error}>{speech.error}</p>}
              <div className={styles.actions}>
                <Button
                  size="lg"
                  onClick={() => void handleNext()}
                  disabled={finishing || savingAnswer}
                >
                  {current + 1 < data.questions.length
                    ? "Next"
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

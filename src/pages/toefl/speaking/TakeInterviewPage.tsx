import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { SectionHeader } from "../../../components/layout/SectionHeader";
import { Button } from "../../../components/ui/Button";
import { GradingRequestPanel } from "../../../components/ui/GradingRequestPanel";
import { LoadingSpinner } from "../../../components/ui/LoadingSpinner";
import { Timer } from "../../../components/ui/Timer";
import { ProgressBar } from "../../../components/ui/ProgressBar";
import { useTimer } from "../../../hooks/useTimer";
import { useQuestion } from "../../../hooks/useQuestion";
import {
  buildGradingMessage,
  buildProblemId,
  clearDraft,
  copyText,
  loadDraft,
  saveAnswerSubmission,
  saveDraft,
} from "../../../lib/answerSubmission";
import styles from "./TakeInterviewPage.module.css";

interface InterviewQuestion {
  id: string;
  type: string;
  question: string;
  modelAnswer: string;
  evaluationPoints: string[];
}

interface ProblemData {
  questions: InterviewQuestion[];
}

const TYPE_LABELS: Record<string, string> = {
  personal: "Personal Experience",
  opinion: "Opinion",
  hypothetical: "Hypothetical Situation",
  comparison: "Comparison / Choice",
};
const TASK_ID = "toefl/speaking/interview";

export function TakeInterviewPage() {
  const navigate = useNavigate();
  const { questionNumber } = useParams<{ questionNumber: string }>();
  const { data, file, loading, error, loadByQuestionNumber } = useQuestion<ProblemData>(TASK_ID);
  const [current, setCurrent] = useState(0);
  const [userText, setUserText] = useState("");
  const [phase, setPhase] = useState<"pre" | "answering" | "submitted">("pre");
  const [showModel, setShowModel] = useState(false);
  const [done, setDone] = useState(false);
  const [savingAnswer, setSavingAnswer] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [answerId, setAnswerId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const q = data?.questions[current];
  const problemId =
    file && q ? buildProblemId(TASK_ID, file, q.id || String(current + 1)) : null;
  const gradingMessage =
    problemId && answerId ? buildGradingMessage(problemId, answerId) : null;

  const submitAnswer = async () => {
    setPhase("submitted");
    if (!q || !problemId || answerId || savingAnswer) return;
    setSavingAnswer(true);
    setSaveError(null);
    try {
      const result = await saveAnswerSubmission({
        taskId: TASK_ID,
        problemId,
        response: userText,
        question: q,
      });
      clearDraft(problemId);
      setAnswerId(result.answerId);
    } catch (e) {
      setSaveError(
        e instanceof Error ? e.message : "Failed to save your answer.",
      );
    } finally {
      setSavingAnswer(false);
    }
  };

  const timer = useTimer(45, () => {
    void submitAnswer();
  });

  const parsedQuestionNumber = Number.parseInt(questionNumber ?? "", 10);
  const hasValidQuestionNumber =
    Number.isInteger(parsedQuestionNumber) && parsedQuestionNumber > 0;

  useEffect(() => {
    if (!hasValidQuestionNumber) return;
    loadByQuestionNumber(parsedQuestionNumber);
  }, [hasValidQuestionNumber, loadByQuestionNumber, parsedQuestionNumber]);

  useEffect(() => {
    if (!problemId) return;
    setUserText(loadDraft(problemId));
    setSaveError(null);
    setAnswerId(null);
    setCopied(false);
  }, [problemId]);

  useEffect(() => {
    if (!problemId || phase === "submitted") return;
    saveDraft(problemId, userText);
  }, [problemId, phase, userText]);

  const handleStart = () => {
    setPhase("answering");
    timer.start();
  };
  const handleSubmit = () => {
    timer.stop();
    void submitAnswer();
  };
  const handleCopy = async () => {
    if (!gradingMessage) return;
    try {
      const ok = await copyText(gradingMessage);
      if (!ok) {
        setSaveError("Clipboard is not available in this environment.");
        return;
      }
      setCopied(true);
    } catch {
      setSaveError("Failed to copy.");
    }
  };

  const handleNext = () => {
    if (!data) return;
    if (current + 1 >= data.questions.length) {
      setDone(true);
      return;
    }
    setCurrent((c) => c + 1);
    setUserText("");
    setPhase("pre");
    setShowModel(false);
    setSavingAnswer(false);
    setSaveError(null);
    setAnswerId(null);
    setCopied(false);
    timer.reset();
  };

  const handleBackToList = () => {
    setCurrent(0);
    setUserText("");
    setPhase("pre");
    setShowModel(false);
    setDone(false);
    setSavingAnswer(false);
    setSaveError(null);
    setAnswerId(null);
    setCopied(false);
    timer.reset();
    navigate("/toefl/speaking/interview");
  };

  return (
    <div>
      <SectionHeader
        title="Take an Interview"
        subtitle="Answer interview prompts (no prep time, 45 seconds each)."
        backTo="/toefl"
        current={done ? data?.questions.length : current}
        total={data?.questions.length}
      />

      <div className={styles.topBar}>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleBackToList}
          disabled={loading || phase === "answering"}
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
              {TYPE_LABELS[q.type] ?? q.type}
            </span>
            <span className={styles.qNum}>
              Question {current + 1} / {data.questions.length}
            </span>
          </div>
          <p className={styles.question}>{q.question}</p>

          {phase === "pre" && (
            <div className={styles.preBox}>
              <p className={styles.preNote}>
                There is no prep time. Press Start to begin the 45-second timer.
              </p>
              <Button size="lg" onClick={handleStart}>
                Start
              </Button>
            </div>
          )}

          {(phase === "answering" || phase === "submitted") && (
            <div className={styles.answerArea}>
              <Timer
                display={timer.display}
                isWarning={timer.isWarning}
                isExpired={timer.isExpired}
              />
              <textarea
                className={styles.textarea}
                value={userText}
                onChange={(e) => setUserText(e.target.value)}
                placeholder="Type your response here (spoken in the real test)..."
                disabled={phase === "submitted"}
                rows={8}
              />
              {phase === "answering" && (
                <Button onClick={handleSubmit}>Submit</Button>
              )}
            </div>
          )}

          {phase === "submitted" && (
            <div className={styles.feedbackArea}>
              <GradingRequestPanel
                saving={savingAnswer}
                error={saveError}
                message={gradingMessage}
                copied={copied}
                onCopy={() => {
                  void handleCopy();
                }}
              />
              <div className={styles.evalCard}>
                <h3>Evaluation Points</h3>
                <ul>
                  {q.evaluationPoints.map((pt, i) => (
                    <li key={i}>{pt}</li>
                  ))}
                </ul>
              </div>
              <div className={styles.modelArea}>
                <Button
                  variant="secondary"
                  onClick={() => setShowModel((v) => !v)}
                >
                  {showModel ? "Hide Model Answer" : "Show Model Answer"}
                </Button>
                {showModel && (
                  <div className={styles.modelAnswer}>
                    <h3>Model Answer</h3>
                    <p>{q.modelAnswer}</p>
                  </div>
                )}
              </div>
              <Button onClick={handleNext}>
                {current + 1 < data.questions.length ? "Next Question" : "Finish"}
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
          <Button onClick={handleBackToList} size="lg">
            Back to Question List
          </Button>
        </div>
      )}
    </div>
  );
}

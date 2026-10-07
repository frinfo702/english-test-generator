import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { SectionHeader } from "../../../components/layout/SectionHeader";
import { BackButton } from "../../../components/ui/BackButton";
import { Button } from "../../../components/ui/Button";
import { GradingRequestPanel } from "../../../components/ui/GradingRequestPanel";
import { LoadingSpinner } from "../../../components/ui/LoadingSpinner";
import { FloatingElapsedTimer } from "../../../components/ui/FloatingElapsedTimer";
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
import { PoodlePerch } from "../../../components/pixel/PoodlePerch";
import { NextQuestionButton } from "../../../components/question/NextQuestionButton";
import styles from "./WriteEmailPage.module.css";
import task from "./WritingTask.module.css";
import { PixelCheckIcon } from "../../../components/ui/PixelCheckIcon";

interface Scenario {
  title: string;
  description: string;
  recipient: string;
  /** Subject line shown above the answer box; defaults to `title`. */
  subject?: string;
  purpose: string;
  keyPoints: string[];
}

interface RubricItem {
  criterion: string;
  description: string;
}

interface ProblemData {
  scenario: Scenario;
  modelAnswer: string;
  rubric: RubricItem[];
}

const TASK_ID = "toefl/writing/email";

export function WriteEmailPage() {
  const navigate = useNavigate();
  const { questionNumber } = useParams<{ questionNumber: string }>();
  const { data, file, loading, error, loadByQuestionNumber } =
    useQuestion<ProblemData>(TASK_ID);
  const [userText, setUserText] = useState("");
  const [phase, setPhase] = useState<"writing" | "submitted">("writing");
  const [showModel, setShowModel] = useState(false);
  const [savingAnswer, setSavingAnswer] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [answerId, setAnswerId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const problemId = file ? buildProblemId(TASK_ID, file) : null;
  const gradingMessage =
    problemId && answerId ? buildGradingMessage(problemId, answerId) : null;

  const submitAnswer = async () => {
    setPhase("submitted");
    if (!problemId || answerId || savingAnswer) return;
    setSavingAnswer(true);
    setSaveError(null);
    try {
      const result = await saveAnswerSubmission({
        taskId: TASK_ID,
        problemId,
        response: userText,
        question: data ?? undefined,
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

  const timer = useTimer(7 * 60, () => {
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

  // No "press start" step: the timer runs as soon as the problem is shown.
  useEffect(() => {
    if (
      data &&
      !loading &&
      phase === "writing" &&
      !timer.running &&
      timer.seconds === 7 * 60
    ) {
      timer.start();
    }
  }, [data, loading, phase, timer]);
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
  const handleBackToList = () => {
    setUserText("");
    setPhase("writing");
    setShowModel(false);
    setSavingAnswer(false);
    setSaveError(null);
    setAnswerId(null);
    setCopied(false);
    timer.reset();
    navigate(`/${TASK_ID}`);
  };

  return (
    <div>
      <FloatingElapsedTimer
        display={timer.display}
        running={timer.running}
        isWarning={timer.isWarning}
        isExpired={timer.isExpired}
      />

      <SectionHeader
        title="Write an Email"
        subtitle="Read the scenario and write an email (7 minutes)."
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
            Add question JSON under questions/toefl/writing/email/.
          </p>
        </div>
      )}
      {!hasValidQuestionNumber && (
        <div className={styles.error}>
          <p>Invalid question number in URL.</p>
        </div>
      )}

      {data && !loading && hasValidQuestionNumber && (
        <>
          <div className={task.split}>
            <div className={task.prompt}>
              <p>{data.scenario.description}</p>
              <div>
                <p>
                  Write an email to {data.scenario.recipient}. In your email, do
                  the following.
                </p>
                <ul className={task.bullets}>
                  {data.scenario.keyPoints.map((pt, i) => (
                    <li key={i}>{pt}</li>
                  ))}
                </ul>
              </div>
              <p className={task.centered}>
                Write as much as you can and in complete sentences.
              </p>
            </div>

            <div className={task.right}>
              <p className={task.responseLabel}>Your Response:</p>
              <div className={task.responseMeta}>
                <p>
                  <strong>To:</strong> {data.scenario.recipient}
                </p>
                <p>
                  <strong>Subject:</strong>{" "}
                  {data.scenario.subject ?? data.scenario.title}
                </p>
              </div>

              <>
                <PoodlePerch>
                  <textarea
                    className={task.textarea}
                    value={userText}
                    onChange={(e) => setUserText(e.target.value)}
                    placeholder="Type your email here..."
                    disabled={phase === "submitted"}
                    rows={14}
                    aria-label="Your email"
                  />
                </PoodlePerch>
                <p className={task.wordCount}>
                  Word count:{" "}
                  {userText.trim().split(/\s+/).filter(Boolean).length}
                </p>
                {phase === "writing" && (
                  <div className={task.actions}>
                    <Button onClick={handleSubmit}>
                      Submit
                      <PixelCheckIcon />
                    </Button>
                    <NextQuestionButton taskId={TASK_ID} variant="secondary" />
                  </div>
                )}
              </>
            </div>
          </div>

          {phase === "submitted" && (
            <div className={styles.feedbackSection}>
              <GradingRequestPanel
                saving={savingAnswer}
                error={saveError}
                message={gradingMessage}
                copied={copied}
                onCopy={() => {
                  void handleCopy();
                }}
              />
              <div className={styles.rubricCard}>
                <h3>Scoring Criteria</h3>
                {data.rubric.map((r, i) => (
                  <div key={i} className={styles.rubricItem}>
                    <span className={styles.criterion}>{r.criterion}</span>
                    <span className={styles.criterionDesc}>
                      {r.description}
                    </span>
                  </div>
                ))}
              </div>
              <div className={styles.modelSection}>
                <Button
                  variant="secondary"
                  onClick={() => setShowModel((v) => !v)}
                >
                  {showModel ? "Hide Model Answer" : "Show Model Answer"}
                </Button>
                {showModel && (
                  <div className={styles.modelAnswer}>
                    <h3>Model Answer</h3>
                    <p>{data.modelAnswer}</p>
                  </div>
                )}
              </div>
              <div className={styles.actions}>
                <BackButton onClick={handleBackToList} size="lg" />
                <NextQuestionButton taskId={TASK_ID} size="lg" />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

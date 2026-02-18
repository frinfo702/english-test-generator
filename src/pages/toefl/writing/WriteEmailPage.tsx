import { useState, useEffect } from "react";
import { SectionHeader } from "../../../components/layout/SectionHeader";
import { Button } from "../../../components/ui/Button";
import { GradingRequestPanel } from "../../../components/ui/GradingRequestPanel";
import { LoadingSpinner } from "../../../components/ui/LoadingSpinner";
import { Timer } from "../../../components/ui/Timer";
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
import styles from "./WriteEmailPage.module.css";

interface Scenario {
  title: string;
  description: string;
  recipient: string;
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
  const { data, file, loading, error, load } = useQuestion<ProblemData>(TASK_ID);
  const [userText, setUserText] = useState("");
  const [phase, setPhase] = useState<"pre" | "writing" | "submitted">("pre");
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

  useEffect(() => {
    load();
  }, []);

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
    setPhase("writing");
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
  const handleNew = () => {
    setUserText("");
    setPhase("pre");
    setShowModel(false);
    setSavingAnswer(false);
    setSaveError(null);
    setAnswerId(null);
    setCopied(false);
    timer.reset();
    load();
  };

  return (
    <div>
      <SectionHeader
        title="Write an Email"
        subtitle="Read the scenario and write an email (7 minutes)."
        backTo="/toefl"
      />

      <div className={styles.topBar}>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleNew}
          disabled={loading || phase === "writing"}
        >
          Load Another Question
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

      {data && !loading && (
        <>
          <div className={styles.scenarioCard}>
            <h2 className={styles.scenarioTitle}>{data.scenario.title}</h2>
            <p className={styles.scenarioDesc}>{data.scenario.description}</p>
            <div className={styles.scenarioMeta}>
              <span>
                <strong>Recipient:</strong> {data.scenario.recipient}
              </span>
              <span>
                <strong>Purpose:</strong> {data.scenario.purpose}
              </span>
            </div>
            <div className={styles.keyPoints}>
              <p className={styles.keyPointsLabel}>Include:</p>
              <ul>
                {data.scenario.keyPoints.map((pt, i) => (
                  <li key={i}>{pt}</li>
                ))}
              </ul>
            </div>
          </div>

          {phase === "pre" && (
            <div className={styles.startCard}>
              <p>Press Start when ready. The 7-minute timer will begin.</p>
              <Button size="lg" onClick={handleStart}>
                Start
              </Button>
            </div>
          )}

          {(phase === "writing" || phase === "submitted") && (
            <div className={styles.writingArea}>
              <div className={styles.writingHeader}>
                <Timer
                  display={timer.display}
                  isWarning={timer.isWarning}
                  isExpired={timer.isExpired}
                />
                <span className={styles.wordCount}>
                  {userText.trim().split(/\s+/).filter(Boolean).length} words
                </span>
              </div>
              <textarea
                className={styles.textarea}
                value={userText}
                onChange={(e) => setUserText(e.target.value)}
                placeholder="Type your email here..."
                disabled={phase === "submitted"}
                rows={14}
              />
              {phase === "writing" && (
                <Button onClick={handleSubmit}>Submit</Button>
              )}
            </div>
          )}

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
              <Button onClick={handleNew} size="lg">
                Next Question
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

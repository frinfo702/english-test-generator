import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import styles from "./WriteDiscussionPage.module.css";

interface Student {
  name: string;
  response: string;
}

interface ProblemData {
  professorQuestion: string;
  professorName: string;
  student1: Student;
  student2: Student;
  modelAnswer: string;
  evaluationPoints: string[];
}

const MIN_WORDS = 100;
const TASK_ID = "toefl/writing/discussion";

export function WriteDiscussionPage() {
  const navigate = useNavigate();
  const { questionNumber } = useParams<{ questionNumber: string }>();
  const { data, file, loading, error, loadByQuestionNumber } = useQuestion<ProblemData>(TASK_ID);
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

  const timer = useTimer(10 * 60, () => {
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

  const wordCount = userText.trim().split(/\s+/).filter(Boolean).length;
  const meetsMinWords = wordCount >= MIN_WORDS;

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
  const handleBackToList = () => {
    setUserText("");
    setPhase("pre");
    setShowModel(false);
    setSavingAnswer(false);
    setSaveError(null);
    setAnswerId(null);
    setCopied(false);
    timer.reset();
    navigate("/toefl/writing/discussion");
  };

  return (
    <div>
      <SectionHeader
        title="Write for an Academic Discussion"
        subtitle="Read the prompt and student opinions, then write your own view (10 minutes, 100+ words)."
        backTo="/toefl"
      />

      <div className={styles.topBar}>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleBackToList}
          disabled={loading || phase === "writing"}
        >
          Question List
        </Button>
      </div>

      {loading && <LoadingSpinner message="Loading question..." />}
      {error && (
        <div className={styles.error}>
          <p>{error}</p>
          <p className={styles.errorHint}>
            Add question JSON under questions/toefl/writing/discussion/.
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
          <div className={styles.discussionCard}>
            <div className={styles.professorBlock}>
              <span className={styles.roleTag}>
                Professor {data.professorName}
              </span>
              <p className={styles.professorQ}>{data.professorQuestion}</p>
            </div>
            <div className={styles.students}>
              {[data.student1, data.student2].map((s, i) => (
                <div key={i} className={styles.studentBlock}>
                  <span className={styles.studentTag}>{s.name}</span>
                  <p>{s.response}</p>
                </div>
              ))}
            </div>
          </div>

          {phase === "pre" && (
            <div className={styles.startCard}>
              <p>
                Press Start when ready. The 10-minute timer will begin. Write
                at least 100 words.
              </p>
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
                <span
                  className={[
                    styles.wordCount,
                    meetsMinWords ? styles.ok : styles.notOk,
                  ].join(" ")}
                >
                  {wordCount} / {MIN_WORDS}+ words
                </span>
              </div>
              <textarea
                className={styles.textarea}
                value={userText}
                onChange={(e) => setUserText(e.target.value)}
                placeholder="Type your response here..."
                disabled={phase === "submitted"}
                rows={14}
              />
              {phase === "writing" && (
                <Button onClick={handleSubmit} disabled={!meetsMinWords}>
                  Submit
                  {!meetsMinWords
                    ? ` (${MIN_WORDS - wordCount} more words required)`
                    : ""}
                </Button>
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
              <div className={styles.evalCard}>
                <h3>Evaluation Points</h3>
                <ul className={styles.evalList}>
                  {data.evaluationPoints.map((pt, i) => (
                    <li key={i}>{pt}</li>
                  ))}
                </ul>
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
              <Button onClick={handleBackToList} size="lg">
                Back to Question List
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

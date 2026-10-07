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
import styles from "./WriteDiscussionPage.module.css";
import task from "./WritingTask.module.css";
import { PixelCheckIcon } from "../../../components/ui/PixelCheckIcon";
import {
  studentPhotoUrl,
  type StudentGender,
} from "../../../lib/studentPhotos";

interface Student {
  name: string;
  /** The two students are always one male and one female. */
  gender?: StudentGender;
  response: string;
}

interface ProblemData {
  professorQuestion: string;
  professorName: string;
  /** Professor photo id under public/images/professors/ (e.g. "m1"). */
  professorPhoto?: string;
  /** Class subject, e.g. "art history"; fills "teaching a class on …". */
  course?: string;
  student1: Student;
  student2: Student;
  modelAnswer: string;
  evaluationPoints: string[];
}

const MIN_WORDS = 100;

/**
 * Face photo when `photo` (a URL) is given, else a monogram
 * ("Dr. Chen" → "C").
 */
function Avatar({
  name,
  tone,
  large = false,
  photo,
}: {
  name: string;
  tone: number;
  large?: boolean;
  photo?: string;
}) {
  const className = [task.avatar, large ? task.avatarLarge : ""].join(" ");
  if (photo) {
    return (
      <img
        className={`${className} ${task.avatarPhoto}`}
        src={photo}
        alt=""
        width={192}
        height={192}
        decoding="async"
      />
    );
  }
  const initial = name
    .replace(/^(dr|prof|professor|mr|mrs|ms)\.?\s+/i, "")
    .charAt(0)
    .toUpperCase();
  return (
    <span className={className} data-tone={tone} aria-hidden="true">
      {initial}
    </span>
  );
}
const TASK_ID = "toefl/writing/discussion";

export function WriteDiscussionPage() {
  const navigate = useNavigate();
  const { questionId = "" } = useParams<{ questionId: string }>();
  const { data, file, loading, error, loadById } =
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

  const timer = useTimer(10 * 60, () => {
    void submitAnswer();
  });

  const hasValidQuestionId = questionId !== "";

  useEffect(() => {
    if (!hasValidQuestionId) return;
    loadById(questionId);
  }, [hasValidQuestionId, loadById, questionId]);

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

  // No "press start" step: the timer runs as soon as the problem is shown.
  useEffect(() => {
    if (
      data &&
      !loading &&
      phase === "writing" &&
      !timer.running &&
      timer.seconds === 10 * 60
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
        title="Write for an Academic Discussion"
        subtitle="Read the prompt and student opinions, then write your own view (10 minutes, 100+ words)."
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
            Add question JSON under questions/toefl/writing/discussion/.
          </p>
        </div>
      )}
      {!hasValidQuestionId && (
        <div className={styles.error}>
          <p>Invalid question ID in URL.</p>
        </div>
      )}

      {data && !loading && hasValidQuestionId && (
        <>
          <div className={task.split}>
            <div className={task.prompt}>
              <p>
                Your professor is teaching a class
                {data.course ? ` on ${data.course}` : ""}. Write a post
                responding to the professor&rsquo;s question.
              </p>
              <div>
                <p>
                  <strong>
                    In your response, you should do the following.
                  </strong>
                </p>
                <ul className={task.bullets}>
                  <li>Express and support your opinion.</li>
                  <li>
                    Make a contribution to the discussion in your own words.
                  </li>
                </ul>
              </div>
              <p>
                An effective response will contain at least {MIN_WORDS} words.
              </p>
              <div className={task.professor}>
                <span>{data.professorName}</span>
                <Avatar
                  name={data.professorName}
                  tone={0}
                  large
                  photo={
                    data.professorPhoto &&
                    `/images/professors/${data.professorPhoto}.jpg`
                  }
                />
              </div>
              <p>{data.professorQuestion}</p>
            </div>

            <div className={task.right}>
              <ul className={task.posts}>
                {[data.student1, data.student2].map((s, i) => (
                  <li key={i} className={task.post}>
                    <div className={task.person}>
                      <Avatar
                        name={s.name}
                        tone={i + 1}
                        photo={
                          s.gender && studentPhotoUrl(s.gender, questionId)
                        }
                      />
                      <span>{s.name}</span>
                    </div>
                    <p>{s.response}</p>
                  </li>
                ))}
              </ul>

              <>
                <PoodlePerch>
                  <textarea
                    className={task.textarea}
                    value={userText}
                    onChange={(e) => setUserText(e.target.value)}
                    placeholder="Type your response here..."
                    disabled={phase === "submitted"}
                    rows={14}
                    aria-label="Your response"
                  />
                </PoodlePerch>
                <p className={task.wordCount}>
                  Word count:{" "}
                  <span className={meetsMinWords ? task.ok : task.notOk}>
                    {wordCount}
                  </span>{" "}
                  / {MIN_WORDS}+
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

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { SectionHeader } from "../../../components/layout/SectionHeader";
import { BackButton } from "../../../components/ui/BackButton";
import { Button } from "../../../components/ui/Button";
import { LoadingSpinner } from "../../../components/ui/LoadingSpinner";
import { FloatingElapsedTimer } from "../../../components/ui/FloatingElapsedTimer";
import { useElapsedTimer } from "../../../hooks/useElapsedTimer";
import { useQuestion } from "../../../hooks/useQuestion";
import { useScoreHistory } from "../../../hooks/useScoreHistory";
import { NextQuestionButton } from "../../../components/question/NextQuestionButton";
import styles from "./ReadAcademicPage.module.css";
import { ChoiceQuestionCard, QuestionNav, SplitView } from "../../../components/question/QuestionStepper";

interface Question {
  id: string;
  type: string;
  stem: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface ProblemData {
  passage: string;
  title: string;
  questions: Question[];
}

const TYPE_LABELS: Record<string, string> = {
  vocabulary: "Vocabulary",
  detail: "Detail",
  inference: "Inference",
  mainIdea: "Main Idea",
  paragraphRelation: "Paragraph Relation",
  importantIdea: "Important Idea",
  negativeFactual: "Negative Factual",
  rhetoricalPurpose: "Rhetorical Purpose",
  insertSentence: "Insert Sentence",
};

export function ReadAcademicPage() {
  const navigate = useNavigate();
  const { questionId = "" } = useParams<{ questionId: string }>();
  const { data, file, loading, error, loadById } =
    useQuestion<ProblemData>("toefl/reading/academic");
  const { saveScore } = useScoreHistory();
  const {
    display,
    elapsedSeconds,
    running,
    start,
    stop,
    reset: resetTimer,
  } = useElapsedTimer();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [graded, setGraded] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const hasValidQuestionId = questionId !== "";

  useEffect(() => {
    if (!hasValidQuestionId) return;
    loadById(questionId);
  }, [hasValidQuestionId, loadById, questionId]);

  useEffect(() => {
    if (data && !loading && !graded && !running && elapsedSeconds === 0) {
      start();
    }
  }, [data, loading, graded, running, elapsedSeconds, start]);

  const handleBackToList = () => {
    resetTimer();
    navigate("/toefl/reading/academic");
  };

  const handleSelect = (questionId: string, optionIndex: number) => {
    if (!graded) setAnswers((s) => ({ ...s, [questionId]: optionIndex }));
  };

  const handleSubmit = () => {
    const sessionSeconds = stop();
    if (data) {
      const s = data.questions.filter(
        (q) => answers[q.id] === q.correctIndex,
      ).length;
      saveScore(
        "toefl/reading/academic",
        s,
        data.questions.length,
        sessionSeconds,
        file ?? undefined,
      );
    }
    setGraded(true);
    setCurrentIndex(0);
    window.scrollTo({ top: 0 });
  };

  const totalQ = data?.questions.length ?? 0;
  const current = data?.questions[Math.min(currentIndex, totalQ - 1)];
  const paragraphs = (data?.passage ?? "")
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
  const totalAnswered = Object.keys(answers).length;

  const score = data
    ? data.questions.filter((q) => answers[q.id] === q.correctIndex).length
    : 0;

  return (
    <div>
      {(running || elapsedSeconds > 0) && (
        <FloatingElapsedTimer display={display} running={running} />
      )}

      <SectionHeader
        title="Read an Academic Passage"
        subtitle="Read the academic passage and answer all questions."
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
            Add question JSON under questions/toefl/reading/academic/.
          </p>
        </div>
      )}
      {!hasValidQuestionId && (
        <div className={styles.error}>
          <p>Invalid question ID in URL.</p>
        </div>
      )}

      {data && !loading && hasValidQuestionId && current && (
        <>
          {graded && (
            <div className={styles.resultCard}>
              <h2>Section Complete</h2>
              <div className={styles.scoreBox}>
                <span className={styles.scoreNum}>{score}</span>
                <span className={styles.scoreDen}>/{totalQ}</span>
                <span className={styles.scorePct}>
                  ({Math.round((score / totalQ) * 100)}%)
                </span>
              </div>
              <div className={styles.resultActions}>
                <BackButton onClick={handleBackToList} size="lg" />
                <NextQuestionButton taskId="toefl/reading/academic" size="lg" />
              </div>
            </div>
          )}

          <SplitView
            left={
              <article className={styles.passageCard}>
                <h2 className={styles.passageTitle}>{data.title}</h2>
                {paragraphs.map((p, i) => (
                  <p key={i} className={styles.passage}>
                    {p}
                  </p>
                ))}
              </article>
            }
            right={
              <ChoiceQuestionCard
                key={current.id}
                question={current}
                index={currentIndex}
                total={totalQ}
                typeLabel={TYPE_LABELS[current.type] ?? current.type}
                selected={answers[current.id]}
                graded={graded}
                onSelect={handleSelect}
              />
            }
          />

          <QuestionNav
            groups={[data.questions]}
            answers={answers}
            currentIndex={currentIndex}
            graded={graded}
            onGo={(i) => setCurrentIndex(Math.max(0, Math.min(i, totalQ - 1)))}
            onSubmit={handleSubmit}
          />

          {!graded && (
            <div className={styles.submitRow}>
              {totalAnswered < totalQ && (
                <span className={styles.unanswered}>
                  {totalQ - totalAnswered} unanswered
                </span>
              )}
              <NextQuestionButton
                taskId="toefl/reading/academic"
                variant="ghost"
                size="sm"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

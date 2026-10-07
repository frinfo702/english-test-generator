import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { SectionHeader } from "../../../components/layout/SectionHeader";
import { Button } from "../../../components/ui/Button";
import { LoadingSpinner } from "../../../components/ui/LoadingSpinner";
import { FloatingElapsedTimer } from "../../../components/ui/FloatingElapsedTimer";
import { useElapsedTimer } from "../../../hooks/useElapsedTimer";
import { useQuestion } from "../../../hooks/useQuestion";
import { useScoreHistory } from "../../../hooks/useScoreHistory";
import { NextQuestionButton } from "../../../components/question/NextQuestionButton";
import styles from "./ReadDailyLifePage.module.css";
import { DailyLifeTextView } from "./DailyLifeTextView";
import {
  ChoiceQuestionCard,
  QuestionNav,
  SplitView,
} from "../../../components/question/QuestionStepper";
import type {
  DailyLifeData,
  DailyLifeQuestion,
  DailyLifeText,
} from "./dailyLife";

const TYPE_LABELS: Record<string, string> = {
  factual: "Factual",
  inference: "Inference",
  purpose: "Purpose",
  vocabulary: "Vocabulary",
};

interface FlatQuestion {
  text: DailyLifeText;
  textIndex: number;
  question: DailyLifeQuestion;
}

export function ReadDailyLifePage() {
  const navigate = useNavigate();
  const { questionId = "" } = useParams<{ questionId: string }>();
  const { data, file, loading, error, loadById } = useQuestion<DailyLifeData>(
    "toefl/reading/daily-life",
  );
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
  const sessionFileRef = useRef<string | null>(null);

  const hasValidQuestionId = questionId !== "";

  useEffect(() => {
    if (!hasValidQuestionId) return;
    sessionFileRef.current = null;
    loadById(questionId);
  }, [hasValidQuestionId, loadById, questionId]);

  useEffect(() => {
    if (file && !sessionFileRef.current) {
      sessionFileRef.current = file;
    }
  }, [file]);

  useEffect(() => {
    if (data && !loading && !graded && !running && elapsedSeconds === 0) {
      start();
    }
  }, [data, loading, graded, running, elapsedSeconds, start]);

  // Flatten questions across all texts so we can number them globally.
  const allQ: FlatQuestion[] = [];
  if (data) {
    data.texts.forEach((text, textIndex) =>
      text.questions.forEach((question) =>
        allQ.push({ text, textIndex, question }),
      ),
    );
  }

  const totalQ = allQ.length;
  const totalTexts = data?.texts.length ?? 0;
  const answeredCount = Object.keys(answers).length;
  const current = allQ[Math.min(currentIndex, Math.max(totalQ - 1, 0))];

  const correctCount = allQ.filter(
    ({ question }) => answers[question.id] === question.correctIndex,
  ).length;

  const handleSelect = (questionId: string, optionIndex: number) => {
    if (!graded) {
      setAnswers((s) => ({ ...s, [questionId]: optionIndex }));
    }
  };

  const goTo = (index: number) => {
    setCurrentIndex(Math.max(0, Math.min(index, totalQ - 1)));
  };

  const handleSubmit = () => {
    const sessionSeconds = stop();
    saveScore({
      taskId: "toefl/reading/daily-life",
      file: sessionFileRef.current ?? file ?? undefined,
      correct: correctCount,
      total: totalQ,
      elapsedSeconds: sessionSeconds,
      responses: Object.entries(answers).map(([itemId, choice]) => ({
        itemId,
        choice,
      })),
    });
    setGraded(true);
    setCurrentIndex(0);
    window.scrollTo({ top: 0 });
  };

  const handleRestart = () => {
    resetTimer();
    navigate("/toefl/reading/daily-life");
  };

  return (
    <div>
      {(running || elapsedSeconds > 0) && (
        <FloatingElapsedTimer display={display} running={running} />
      )}

      <SectionHeader
        title="Read in Daily Life"
        subtitle="Read everyday texts and answer all questions."
        backTo="/toefl"
      />

      <div className={styles.topBar}>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate("/toefl/reading/daily-life")}
          disabled={loading}
        >
          Question List
        </Button>
      </div>

      {!hasValidQuestionId && (
        <div className={styles.error}>
          <p>Invalid question ID in URL.</p>
        </div>
      )}

      {loading && <LoadingSpinner message="Loading question..." />}
      {error && (
        <div className={styles.error}>
          <p>{error}</p>
          <p className={styles.errorHint}>
            Add question JSON under questions/toefl/reading/daily-life/.
          </p>
        </div>
      )}

      {data && !loading && hasValidQuestionId && current && (
        <>
          {graded && (
            <div className={styles.resultCard}>
              <h2 className={styles.resultTitle}>Result</h2>
              <div className={styles.resultModules}>
                <div className={styles.moduleResult}>
                  <span className={styles.moduleLabel}>Score</span>
                  <span className={styles.moduleScore}>
                    {correctCount}/{totalQ} (
                    {totalQ > 0 ? Math.round((correctCount / totalQ) * 100) : 0}
                    %)
                  </span>
                </div>
              </div>
              <p className={styles.reviewHint}>
                Step through the questions below to review each answer.
              </p>
              <div className={styles.resultActions}>
                <Button size="lg" onClick={handleRestart}>
                  Try Again
                </Button>
                <NextQuestionButton
                  taskId="toefl/reading/daily-life"
                  size="lg"
                />
              </div>
            </div>
          )}

          <SplitView
            leftKey={current.text.id}
            left={
              <DailyLifeTextView key={current.text.id} text={current.text} />
            }
            right={
              <ChoiceQuestionCard
                key={current.question.id}
                question={current.question}
                index={currentIndex}
                total={totalQ}
                context={
                  totalTexts > 1
                    ? `Text ${current.textIndex + 1} of ${totalTexts}`
                    : undefined
                }
                typeLabel={
                  TYPE_LABELS[current.question.type] ?? current.question.type
                }
                selected={answers[current.question.id]}
                graded={graded}
                onSelect={handleSelect}
              />
            }
          />

          <QuestionNav
            groups={data.texts.map((t) => t.questions)}
            answers={answers}
            currentIndex={currentIndex}
            graded={graded}
            onGo={goTo}
            onSubmit={handleSubmit}
          />

          {!graded && (
            <div className={styles.submitRow}>
              {answeredCount < totalQ && (
                <span className={styles.unanswered}>
                  {totalQ - answeredCount} unanswered
                </span>
              )}
              <NextQuestionButton
                taskId="toefl/reading/daily-life"
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

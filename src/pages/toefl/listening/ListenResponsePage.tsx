import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { SectionHeader } from "../../../components/layout/SectionHeader";
import { Button } from "../../../components/ui/Button";
import { LoadingSpinner } from "../../../components/ui/LoadingSpinner";
import { ProgressBar } from "../../../components/ui/ProgressBar";
import { FloatingElapsedTimer } from "../../../components/ui/FloatingElapsedTimer";
import { useElapsedTimer } from "../../../hooks/useElapsedTimer";
import { useQuestion } from "../../../hooks/useQuestion";
import { useScoreHistory } from "../../../hooks/useScoreHistory";
import { useTts } from "../../../hooks/useTts";
import styles from "./ListenResponsePage.module.css";

interface ResponseQuestion {
  id: string;
  context: string;
  stem: string;
  options: { A: string; B: string; C: string };
  correct: string;
  explanation: string;
}

interface ProblemData {
  title: string;
  questions: ResponseQuestion[];
  audioSegments: { role: string; text: string }[];
}

const TASK_ID = "toefl/listening/response";

export function ListenResponsePage() {
  const navigate = useNavigate();
  const { questionNumber } = useParams<{ questionNumber: string }>();
  const { data, file, loading, error, loadByQuestionNumber } =
    useQuestion<ProblemData>(TASK_ID);
  const { saveScore } = useScoreHistory();
  const { display, elapsedSeconds, running, start, stop, reset: resetTimer } =
    useElapsedTimer();
  const { loading: ttsLoading, playSegmentsWithGaps } = useTts();
  const fileBasename = file ? file.replace(/\.json$/i, "") : "";

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [graded, setGraded] = useState(false);
  const audioStartedRef = useRef<Set<number>>(new Set());

  const parsedQuestionNumber = Number.parseInt(questionNumber ?? "", 10);
  const hasValidQuestionNumber =
    Number.isInteger(parsedQuestionNumber) && parsedQuestionNumber > 0;

  useEffect(() => {
    if (!hasValidQuestionNumber) return;
    loadByQuestionNumber(parsedQuestionNumber);
  }, [hasValidQuestionNumber, loadByQuestionNumber, parsedQuestionNumber]);

  useEffect(() => {
    if (data && !loading && !graded && !running && elapsedSeconds === 0) {
      start();
    }
  }, [data, loading, graded, running, elapsedSeconds, start]);

  const questions = data?.questions ?? [];

  useEffect(() => {
    if (data && !graded && !audioStartedRef.current.has(currentIndex)) {
      const url = `/audio/${TASK_ID}/${fileBasename}/${currentIndex + 1}.mp3`;
      audioStartedRef.current = new Set(audioStartedRef.current).add(currentIndex);
      playSegmentsWithGaps([url], []);
    }
  }, [data, currentIndex, graded, playSegmentsWithGaps, fileBasename]);

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const allAnswered = questions.every((q) => selected[q.id]);
  const totalCorrect = questions.filter(
    (q) => selected[q.id] === q.correct
  ).length;

  const handleSelect = (opt: string) => {
    if (!currentQuestion || graded) return;
    setSelected((s) => ({ ...s, [currentQuestion.id]: opt }));
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((i) => i + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  };

  const retake = () => {
    if (!graded) return;
    setSelected({});
    setCurrentIndex(0);
    setGraded(false);
    audioStartedRef.current = new Set();
    resetTimer();
  };

  const handleSubmit = () => {
    const sessionSeconds = stop();
    if (data) {
      const correct = data.questions.filter(
        (q) => selected[q.id] === q.correct
      ).length;
      saveScore(
        TASK_ID,
        correct,
        data.questions.length,
        sessionSeconds,
        file ?? undefined
      );
    }
    setGraded(true);
  };

  const handleReplayAudio = () => {
    if (!data || graded) return;
    const url = `/audio/${TASK_ID}/${fileBasename}/${currentIndex + 1}.mp3`;
    playSegmentsWithGaps([url], []);
  };

  const handleBackToList = () => {
    resetTimer();
    setCurrentIndex(0);
    setSelected({});
    setGraded(false);
    audioStartedRef.current = new Set();
    navigate("/toefl/listening/response");
  };

  return (
    <div>
      {(running || elapsedSeconds > 0) && (
        <FloatingElapsedTimer display={display} running={running} />
      )}
      <SectionHeader
        title="Listen and Choose a Response"
        subtitle="Listen to each utterance and choose the best response."
        backTo="/toefl"
        current={Object.keys(selected).length}
        total={totalQuestions}
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

      {loading && <LoadingSpinner message="Loading question set..." />}
      {error && (
        <div className={styles.error}>
          <p>{error}</p>
          <p className={styles.errorHint}>
            Add question JSON under questions/{TASK_ID}/.
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
          {graded && (
            <>
              <div className={styles.resultCard}>
                <h2>Section Complete</h2>
                <div className={styles.scoreBox}>
                  <span className={styles.scoreNum}>{totalCorrect}</span>
                  <span className={styles.scoreDen}>/{totalQuestions}</span>
                  <span className={styles.scorePct}>
                    ({Math.round((totalCorrect / totalQuestions) * 100)}%)
                  </span>
                </div>
                <ProgressBar
                  current={totalCorrect}
                  total={totalQuestions}
                  label="Accuracy"
                />
                <div className={styles.resultActions}>
                  <Button onClick={retake} size="md" variant="secondary">
                    Retake
                  </Button>
                  <Button onClick={handleBackToList} size="md">
                    Back to Question List
                  </Button>
                </div>
              </div>

              {questions.map((q, qIndex) => {
                const sel = selected[q.id];
                const isCorrect = sel === q.correct;
                return (
                  <div key={q.id} className={styles.reviewCard}>
                    <div className={styles.reviewHeader}>
                      <strong>Question {qIndex + 1}</strong>
                      <span className={isCorrect ? styles.reviewCorrect : styles.reviewIncorrect}>
                        {isCorrect ? "Correct" : "Incorrect"}
                      </span>
                    </div>
                    <span className={styles.reviewContext}>{q.context}</span>
                    <p className={styles.reviewStem}>{q.stem}</p>
                    <div className={styles.reviewOptions}>
                      {(["A", "B", "C"] as const).map((opt) => {
                        let cls = styles.reviewOpt;
                        if (opt === q.correct) cls += " " + styles.reviewOptCorrect;
                        if (sel === opt && opt !== q.correct) cls += " " + styles.reviewOptWrong;
                        return (
                          <div key={opt} className={cls}>
                            <span className={styles.optLabel}>{opt}</span>
                            <span>{q.options[opt]}</span>
                          </div>
                        );
                      })}
                    </div>
                    <p className={styles.explanation}>{q.explanation}</p>
                  </div>
                );
              })}
            </>
          )}

          {!graded && currentQuestion && (
            <div className={styles.questionCard}>
              <div className={styles.qProgress}>
                Question {currentIndex + 1} of {totalQuestions}
              </div>

              <span className={styles.contextBadge}>{currentQuestion.context}</span>

              <div className={styles.audioArea}>
                {ttsLoading && (
                  <p className={styles.loadingAudio}>Loading audio...</p>
                )}
                {!ttsLoading && (
                  <Button
                    onClick={handleReplayAudio}
                    size="sm"
                    variant="secondary"
                  >
                    Play Audio
                  </Button>
                )}
              </div>

              <div className={styles.options}>
                {(["A", "B", "C"] as const).map((opt) => {
                  const sel = selected[currentQuestion.id];
                  return (
                    <button
                      key={opt}
                      className={`${styles.option} ${
                        sel === opt ? styles.selected : ""
                      }`}
                      onClick={() => handleSelect(opt)}
                    >
                      <span className={styles.optLabel}>{opt}</span>
                      <span>{currentQuestion.options[opt]}</span>
                    </button>
                  );
                })}
              </div>

              <div className={styles.navButtons}>
                <Button
                  variant="secondary"
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  size="sm"
                >
                  Previous
                </Button>
                <span className={styles.qStatus}>
                  {selected[currentQuestion.id]
                    ? "Answered"
                    : "Select a response"}
                </span>
                {currentIndex < totalQuestions - 1 ? (
                  <Button
                    onClick={handleNext}
                    disabled={!selected[currentQuestion.id]}
                    size="sm"
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={!allAnswered}
                    size="sm"
                  >
                    Submit
                  </Button>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

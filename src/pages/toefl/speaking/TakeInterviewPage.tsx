import { useState, useEffect } from "react";
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
  personal: "個人的経験",
  opinion: "意見",
  hypothetical: "仮定的状況",
  comparison: "比較・選択",
};
const TASK_ID = "toefl/speaking/interview";

export function TakeInterviewPage() {
  const { data, file, loading, error, load } = useQuestion<ProblemData>(TASK_ID);
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
        e instanceof Error ? e.message : "回答保存に失敗しました。",
      );
    } finally {
      setSavingAnswer(false);
    }
  };

  const timer = useTimer(45, () => {
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
        setSaveError("この環境ではクリップボードにコピーできません。");
        return;
      }
      setCopied(true);
    } catch {
      setSaveError("コピーに失敗しました。");
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

  const handleNew = () => {
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
    load();
  };

  return (
    <div>
      <SectionHeader
        title="Take an Interview"
        subtitle="インタビュー質問に答えてください（準備時間なし・各45秒）"
        backTo="/toefl"
        current={done ? data?.questions.length : current}
        total={data?.questions.length}
      />

      <div className={styles.topBar}>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleNew}
          disabled={loading || phase === "answering"}
        >
          別の問題セットを読み込む
        </Button>
      </div>

      {loading && <LoadingSpinner message="問題を読み込み中..." />}
      {error && (
        <div className={styles.error}>
          <p>{error}</p>
          <p className={styles.errorHint}>
            questions/toefl/speaking/interview/ に問題JSONを追加してください。
          </p>
        </div>
      )}

      {data && !loading && !done && q && (
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.typeTag}>
              {TYPE_LABELS[q.type] ?? q.type}
            </span>
            <span className={styles.qNum}>
              問題 {current + 1} / {data.questions.length}
            </span>
          </div>
          <p className={styles.question}>{q.question}</p>

          {phase === "pre" && (
            <div className={styles.preBox}>
              <p className={styles.preNote}>
                準備時間はありません。「開始」を押すと45秒タイマーが始まります。
              </p>
              <Button size="lg" onClick={handleStart}>
                開始
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
                placeholder="ここに回答を入力してください（実際のテストではスピーキング）..."
                disabled={phase === "submitted"}
                rows={8}
              />
              {phase === "answering" && (
                <Button onClick={handleSubmit}>提出</Button>
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
                <h3>評価ポイント</h3>
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
                  {showModel ? "模範解答を隠す" : "模範解答を見る"}
                </Button>
                {showModel && (
                  <div className={styles.modelAnswer}>
                    <h3>模範解答</h3>
                    <p>{q.modelAnswer}</p>
                  </div>
                )}
              </div>
              <Button onClick={handleNext}>
                {current + 1 < data.questions.length ? "次の質問" : "終了"}
              </Button>
            </div>
          )}
        </div>
      )}

      {done && data && (
        <div className={styles.resultCard}>
          <h2>インタビュー完了</h2>
          <p>{data.questions.length}問すべてに回答しました。</p>
          <ProgressBar
            current={data.questions.length}
            total={data.questions.length}
            label="完了"
          />
          <Button onClick={handleNew} size="lg">
            別の問題セット
          </Button>
        </div>
      )}
    </div>
  );
}

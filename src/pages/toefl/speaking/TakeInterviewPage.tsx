import { useState, useEffect } from "react";
import { SectionHeader } from "../../../components/layout/SectionHeader";
import { Button } from "../../../components/ui/Button";
import { LoadingSpinner } from "../../../components/ui/LoadingSpinner";
import { Timer } from "../../../components/ui/Timer";
import { ProgressBar } from "../../../components/ui/ProgressBar";
import { useTimer } from "../../../hooks/useTimer";
import { useQuestion } from "../../../hooks/useQuestion";
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

export function TakeInterviewPage() {
  const { data, loading, error, load } = useQuestion<ProblemData>(
    "toefl/speaking/interview",
  );
  const [current, setCurrent] = useState(0);
  const [userText, setUserText] = useState("");
  const [phase, setPhase] = useState<"pre" | "answering" | "submitted">("pre");
  const [showModel, setShowModel] = useState(false);
  const [done, setDone] = useState(false);

  const timer = useTimer(45, () => setPhase("submitted"));

  useEffect(() => {
    load();
  }, []);

  const q = data?.questions[current];

  const handleStart = () => {
    setPhase("answering");
    timer.start();
  };
  const handleSubmit = () => {
    timer.stop();
    setPhase("submitted");
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
    timer.reset();
  };

  const handleNew = () => {
    setCurrent(0);
    setUserText("");
    setPhase("pre");
    setShowModel(false);
    setDone(false);
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

import { useState, useEffect } from "react";
import { SectionHeader } from "../../../components/layout/SectionHeader";
import { Button } from "../../../components/ui/Button";
import { LoadingSpinner } from "../../../components/ui/LoadingSpinner";
import { Timer } from "../../../components/ui/Timer";
import { useTimer } from "../../../hooks/useTimer";
import { useQuestion } from "../../../hooks/useQuestion";
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

export function WriteDiscussionPage() {
  const { data, loading, error, load } = useQuestion<ProblemData>(
    "toefl/writing/discussion",
  );
  const [userText, setUserText] = useState("");
  const [phase, setPhase] = useState<"pre" | "writing" | "submitted">("pre");
  const [showModel, setShowModel] = useState(false);

  const timer = useTimer(10 * 60, () => setPhase("submitted"));

  useEffect(() => {
    load();
  }, []);

  const wordCount = userText.trim().split(/\s+/).filter(Boolean).length;
  const meetsMinWords = wordCount >= MIN_WORDS;

  const handleStart = () => {
    setPhase("writing");
    timer.start();
  };
  const handleSubmit = () => {
    timer.stop();
    setPhase("submitted");
  };
  const handleNew = () => {
    setUserText("");
    setPhase("pre");
    setShowModel(false);
    timer.reset();
    load();
  };

  return (
    <div>
      <SectionHeader
        title="Write for an Academic Discussion"
        subtitle="教授の質問と学生の意見を読んで自分の意見を記述してください（10分・100語以上）"
        backTo="/toefl"
      />

      <div className={styles.topBar}>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleNew}
          disabled={loading || phase === "writing"}
        >
          別の問題を読み込む
        </Button>
      </div>

      {loading && <LoadingSpinner message="問題を読み込み中..." />}
      {error && (
        <div className={styles.error}>
          <p>{error}</p>
          <p className={styles.errorHint}>
            questions/toefl/writing/discussion/ に問題JSONを追加してください。
          </p>
        </div>
      )}

      {data && !loading && (
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
                準備ができたら「開始」を押してください。10分のタイマーが始まります。100語以上記述してください。
              </p>
              <Button size="lg" onClick={handleStart}>
                開始
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
                  {wordCount} / {MIN_WORDS}+ 語
                </span>
              </div>
              <textarea
                className={styles.textarea}
                value={userText}
                onChange={(e) => setUserText(e.target.value)}
                placeholder="ここに回答を入力してください..."
                disabled={phase === "submitted"}
                rows={14}
              />
              {phase === "writing" && (
                <Button onClick={handleSubmit} disabled={!meetsMinWords}>
                  提出
                  {!meetsMinWords ? `（あと${MIN_WORDS - wordCount}語）` : ""}
                </Button>
              )}
            </div>
          )}

          {phase === "submitted" && (
            <div className={styles.feedbackSection}>
              <div className={styles.evalCard}>
                <h3>評価ポイント</h3>
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
                  {showModel ? "模範解答を隠す" : "模範解答を見る"}
                </Button>
                {showModel && (
                  <div className={styles.modelAnswer}>
                    <h3>模範解答</h3>
                    <p>{data.modelAnswer}</p>
                  </div>
                )}
              </div>
              <Button onClick={handleNew} size="lg">
                次の問題
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

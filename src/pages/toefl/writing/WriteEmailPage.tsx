import { useState, useEffect } from "react";
import { SectionHeader } from "../../../components/layout/SectionHeader";
import { Button } from "../../../components/ui/Button";
import { LoadingSpinner } from "../../../components/ui/LoadingSpinner";
import { Timer } from "../../../components/ui/Timer";
import { useTimer } from "../../../hooks/useTimer";
import { useGenerateProblem } from "../../../hooks/useGenerateProblem";
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

const DIFFICULTIES = [
  { value: "Module 1 (Standard)", label: "Module 1 標準" },
  { value: "Module 2 Easy", label: "Module 2 Easy" },
  { value: "Module 2 Hard", label: "Module 2 Hard" },
];

export function WriteEmailPage() {
  const [difficulty, setDifficulty] = useState(DIFFICULTIES[0].value);
  const [userText, setUserText] = useState("");
  const [phase, setPhase] = useState<"pre" | "writing" | "submitted">("pre");
  const [showModel, setShowModel] = useState(false);

  const timer = useTimer(7 * 60, () => setPhase("submitted"));

  const { data, loading, error, generate } = useGenerateProblem<ProblemData>({
    promptPath: "/prompts/toefl/writing/write-an-email.json",
    variables: { difficulty },
  });

  useEffect(() => { generate({ difficulty }); }, []);

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
    generate({ difficulty });
  };

  return (
    <div>
      <SectionHeader
        title="Write an Email"
        subtitle="シナリオを読んでメールを作成してください（7分）"
        backTo="/toefl"
      />

      <div className={styles.controls}>
        <div className={styles.difficultySelector}>
          {DIFFICULTIES.map((d) => (
            <button
              key={d.value}
              className={[styles.diffBtn, difficulty === d.value ? styles.active : ""].join(" ")}
              onClick={() => setDifficulty(d.value)}
              disabled={phase === "writing"}
            >
              {d.label}
            </button>
          ))}
        </div>
        <Button variant="secondary" size="sm" onClick={handleNew} disabled={loading || phase === "writing"}>
          新しい問題
        </Button>
      </div>

      {loading && <LoadingSpinner />}
      {error && <p className={styles.error}>エラー: {error}</p>}

      {data && !loading && (
        <>
          <div className={styles.scenarioCard}>
            <h2 className={styles.scenarioTitle}>{data.scenario.title}</h2>
            <p className={styles.scenarioDesc}>{data.scenario.description}</p>
            <div className={styles.scenarioMeta}>
              <span><strong>宛先:</strong> {data.scenario.recipient}</span>
              <span><strong>目的:</strong> {data.scenario.purpose}</span>
            </div>
            <div className={styles.keyPoints}>
              <p className={styles.keyPointsLabel}>含めるべき内容:</p>
              <ul>
                {data.scenario.keyPoints.map((pt, i) => <li key={i}>{pt}</li>)}
              </ul>
            </div>
          </div>

          {phase === "pre" && (
            <div className={styles.startCard}>
              <p>準備ができたら「開始」を押してください。7分のタイマーが始まります。</p>
              <Button size="lg" onClick={handleStart}>開始</Button>
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
                <span className={styles.wordCount}>{userText.trim().split(/\s+/).filter(Boolean).length} 語</span>
              </div>
              <textarea
                className={styles.textarea}
                value={userText}
                onChange={(e) => setUserText(e.target.value)}
                placeholder="ここにメールを入力してください..."
                disabled={phase === "submitted"}
                rows={14}
              />
              {phase === "writing" && (
                <Button onClick={handleSubmit}>提出</Button>
              )}
            </div>
          )}

          {phase === "submitted" && (
            <div className={styles.feedbackSection}>
              <div className={styles.rubricCard}>
                <h3>採点基準</h3>
                {data.rubric.map((r, i) => (
                  <div key={i} className={styles.rubricItem}>
                    <span className={styles.criterion}>{r.criterion}</span>
                    <span className={styles.criterionDesc}>{r.description}</span>
                  </div>
                ))}
              </div>

              <div className={styles.modelSection}>
                <Button variant="secondary" onClick={() => setShowModel((v) => !v)}>
                  {showModel ? "模範解答を隠す" : "模範解答を見る"}
                </Button>
                {showModel && (
                  <div className={styles.modelAnswer}>
                    <h3>模範解答</h3>
                    <p>{data.modelAnswer}</p>
                  </div>
                )}
              </div>

              <Button onClick={handleNew} size="lg">次の問題</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

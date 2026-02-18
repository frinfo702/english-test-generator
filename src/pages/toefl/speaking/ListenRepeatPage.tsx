import { useState, useEffect, useRef } from "react";
import { SectionHeader } from "../../../components/layout/SectionHeader";
import { Button } from "../../../components/ui/Button";
import { LoadingSpinner } from "../../../components/ui/LoadingSpinner";
import { ProgressBar } from "../../../components/ui/ProgressBar";
import { useGenerateProblem } from "../../../hooks/useGenerateProblem";
import styles from "./ListenRepeatPage.module.css";

interface Sentence {
  id: string;
  text: string;
  wordCount: number;
}

interface ProblemData {
  sentences: Sentence[];
}

const DIFFICULTIES = [
  { value: "Module 1 (Standard)", label: "Module 1 標準" },
  { value: "Module 2 Easy", label: "Module 2 Easy" },
  { value: "Module 2 Hard", label: "Module 2 Hard" },
];

const SHOW_SECS = 4;

type Phase = "showing" | "hidden" | "feedback";

function diffWords(original: string, input: string) {
  const origWords = original.trim().split(/\s+/);
  const inputWords = input.trim().split(/\s+/);
  return origWords.map((word, i) => ({
    word,
    correct: word.toLowerCase().replace(/[^a-z]/g, "") === (inputWords[i] ?? "").toLowerCase().replace(/[^a-z]/g, ""),
    inputWord: inputWords[i] ?? "",
  }));
}

export function ListenRepeatPage() {
  const [difficulty, setDifficulty] = useState(DIFFICULTIES[0].value);
  const [current, setCurrent] = useState(0);
  const [phase, setPhase] = useState<Phase>("showing");
  const [countdown, setCountdown] = useState(SHOW_SECS);
  const [userInput, setUserInput] = useState("");
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data, loading, error, generate } = useGenerateProblem<ProblemData>({
    promptPath: "/prompts/toefl/speaking/listen-and-repeat.json",
    variables: { difficulty },
  });

  useEffect(() => { generate({ difficulty }); }, []);

  useEffect(() => {
    if (phase !== "showing") return;
    setCountdown(SHOW_SECS);
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          setPhase("hidden");
          setTimeout(() => inputRef.current?.focus(), 50);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase, current]);

  const handleSubmit = () => {
    if (!data) return;
    const sentence = data.sentences[current];
    const diff = diffWords(sentence.text, userInput);
    const allCorrect = diff.every((d) => d.correct);
    if (allCorrect) setScore((s) => s + 1);
    setPhase("feedback");
  };

  const handleNext = () => {
    if (!data) return;
    if (current + 1 >= data.sentences.length) {
      setDone(true);
    } else {
      setCurrent((c) => c + 1);
      setUserInput("");
      setPhase("showing");
    }
  };

  const handleNew = () => {
    setCurrent(0);
    setUserInput("");
    setPhase("showing");
    setScore(0);
    setDone(false);
    generate({ difficulty });
  };

  const sentence = data?.sentences[current];

  return (
    <div>
      <SectionHeader
        title="Listen and Repeat"
        subtitle="文を読んで覚え、隠れたらタイピングで再現してください"
        backTo="/toefl"
        current={done ? data?.sentences.length : current}
        total={data?.sentences.length}
      />

      <div className={styles.controls}>
        <div className={styles.difficultySelector}>
          {DIFFICULTIES.map((d) => (
            <button
              key={d.value}
              className={[styles.diffBtn, difficulty === d.value ? styles.active : ""].join(" ")}
              onClick={() => setDifficulty(d.value)}
            >
              {d.label}
            </button>
          ))}
        </div>
        <Button variant="secondary" size="sm" onClick={handleNew} disabled={loading}>
          新しい問題セット
        </Button>
      </div>

      {loading && <LoadingSpinner />}
      {error && <p className={styles.error}>エラー: {error}</p>}

      {data && !loading && !done && sentence && (
        <div className={styles.card}>
          <p className={styles.qNum}>問題 {current + 1} / {data.sentences.length}</p>

          {phase === "showing" && (
            <div className={styles.showPhase}>
              <div className={styles.countdown}>{countdown}</div>
              <p className={styles.sentenceDisplay}>{sentence.text}</p>
              <p className={styles.hint}>文をよく覚えてください</p>
            </div>
          )}

          {phase === "hidden" && (
            <div className={styles.hiddenPhase}>
              <p className={styles.hiddenMsg}>文が隠れました。タイピングで再現してください。</p>
              <input
                ref={inputRef}
                className={styles.inputField}
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && userInput.trim() && handleSubmit()}
                placeholder="文をここに入力..."
              />
              <Button onClick={handleSubmit} disabled={!userInput.trim()}>
                確認
              </Button>
            </div>
          )}

          {phase === "feedback" && (
            <div className={styles.feedbackPhase}>
              <p className={styles.fbLabel}>正解:</p>
              <p className={styles.originalSentence}>{sentence.text}</p>
              <p className={styles.fbLabel}>あなたの回答:</p>
              <div className={styles.diffView}>
                {diffWords(sentence.text, userInput).map((d, i) => (
                  <span
                    key={i}
                    className={[styles.diffWord, d.correct ? styles.diffCorrect : styles.diffWrong].join(" ")}
                    title={d.correct ? "" : `入力: ${d.inputWord || "(なし)"}`}
                  >
                    {d.correct ? d.word : (d.inputWord || "▪")}
                  </span>
                ))}
              </div>
              <Button onClick={handleNext}>
                {current + 1 < data.sentences.length ? "次の問題" : "結果を見る"}
              </Button>
            </div>
          )}
        </div>
      )}

      {done && data && (
        <div className={styles.resultCard}>
          <h2>セクション完了</h2>
          <div className={styles.scoreBox}>
            <span className={styles.scoreNum}>{score}</span>
            <span className={styles.scoreDen}>/{data.sentences.length}</span>
            <span className={styles.scorePct}>({Math.round((score / data.sentences.length) * 100)}%)</span>
          </div>
          <ProgressBar current={score} total={data.sentences.length} label="完全一致" />
          <Button onClick={handleNew} size="lg">新しい問題セット</Button>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect, useRef } from "react";
import { SectionHeader } from "../../../components/layout/SectionHeader";
import { Button } from "../../../components/ui/Button";
import { LoadingSpinner } from "../../../components/ui/LoadingSpinner";
import { ProgressBar } from "../../../components/ui/ProgressBar";
import { useQuestion } from "../../../hooks/useQuestion";
import styles from "./ListenRepeatPage.module.css";

interface Sentence {
  id: string;
  text: string;
  wordCount: number;
}
interface ProblemData {
  sentences: Sentence[];
}

const SHOW_SECS = 4;
type Phase = "showing" | "hidden" | "review";

function diffWords(original: string, input: string) {
  const origWords = original.trim().split(/\s+/);
  const inputWords = input.trim().split(/\s+/);
  return origWords.map((word, i) => ({
    word,
    correct:
      word.toLowerCase().replace(/[^a-z]/g, "") ===
      (inputWords[i] ?? "").toLowerCase().replace(/[^a-z]/g, ""),
    inputWord: inputWords[i] ?? "",
  }));
}

export function ListenRepeatPage() {
  const { data, loading, error, load } = useQuestion<ProblemData>(
    "toefl/speaking/listen-repeat",
  );
  const [current, setCurrent] = useState(0);
  const [phase, setPhase] = useState<Phase>("showing");
  const [countdown, setCountdown] = useState(SHOW_SECS);
  const [currentInput, setCurrentInput] = useState("");
  const [allInputs, setAllInputs] = useState<Record<number, string>>({});
  const [graded, setGraded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    load();
  }, []);

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

  const totalSentences = data?.sentences.length ?? 0;
  const isLastSentence = current + 1 >= totalSentences;

  const handleConfirmInput = () => {
    if (!currentInput.trim()) return;
    setAllInputs((s) => ({ ...s, [current]: currentInput }));
    if (!isLastSentence) {
      setCurrent((c) => c + 1);
      setCurrentInput("");
      setPhase("showing");
    }
  };

  const handleSubmit = () => {
    // Save current input if not yet saved
    if (currentInput.trim() && allInputs[current] == null) {
      setAllInputs((s) => ({ ...s, [current]: currentInput }));
    }
    setGraded(true);
    setPhase("review");
    setCurrent(0);
  };

  const handleNew = () => {
    setCurrent(0);
    setCurrentInput("");
    setAllInputs({});
    setPhase("showing");
    setGraded(false);
    load();
  };

  const score = data
    ? data.sentences.filter((s, i) => {
        const input = allInputs[i] ?? "";
        return diffWords(s.text, input).every((d) => d.correct);
      }).length
    : 0;

  const sentence = data?.sentences[current];

  return (
    <div>
      <SectionHeader
        title="Listen and Repeat"
        subtitle="文を読んで覚え、隠れたらタイピングで再現してください"
        backTo="/toefl"
        current={Object.keys(allInputs).length}
        total={totalSentences}
      />

      <div className={styles.topBar}>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleNew}
          disabled={loading}
        >
          別の問題セットを読み込む
        </Button>
      </div>

      {loading && <LoadingSpinner message="問題を読み込み中..." />}
      {error && (
        <div className={styles.error}>
          <p>{error}</p>
          <p className={styles.errorHint}>
            questions/toefl/speaking/listen-repeat/
            に問題JSONを追加してください。
          </p>
        </div>
      )}

      {data && !loading && !graded && sentence && (
        <div className={styles.card}>
          <p className={styles.qNum}>
            問題 {current + 1} / {totalSentences}
          </p>

          {phase === "showing" && (
            <div className={styles.showPhase}>
              <div className={styles.countdown}>{countdown}</div>
              <p className={styles.sentenceDisplay}>{sentence.text}</p>
              <p className={styles.hint}>文をよく覚えてください</p>
            </div>
          )}

          {phase === "hidden" && (
            <div className={styles.hiddenPhase}>
              <p className={styles.hiddenMsg}>
                文が隠れました。タイピングで再現してください。
              </p>
              <input
                ref={inputRef}
                className={styles.inputField}
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && currentInput.trim()) {
                    if (isLastSentence) {
                      setAllInputs((s) => ({ ...s, [current]: currentInput }));
                    } else {
                      handleConfirmInput();
                    }
                  }
                }}
                placeholder="文をここに入力..."
              />
              {!isLastSentence && (
                <Button
                  onClick={handleConfirmInput}
                  disabled={!currentInput.trim()}
                >
                  次へ
                </Button>
              )}
              {isLastSentence && (
                <Button
                  onClick={() => {
                    setAllInputs((s) => ({ ...s, [current]: currentInput }));
                  }}
                  disabled={!currentInput.trim() || allInputs[current] != null}
                >
                  入力を確定
                </Button>
              )}
            </div>
          )}

          {isLastSentence &&
            allInputs[current] != null &&
            phase === "hidden" && (
              <div style={{ marginTop: "1rem", textAlign: "center" }}>
                <Button onClick={handleSubmit} size="lg">
                  提出する
                </Button>
              </div>
            )}
        </div>
      )}

      {graded && data && (
        <>
          <div className={styles.resultCard}>
            <h2>セクション完了</h2>
            <div className={styles.scoreBox}>
              <span className={styles.scoreNum}>{score}</span>
              <span className={styles.scoreDen}>/{totalSentences}</span>
              <span className={styles.scorePct}>
                ({Math.round((score / totalSentences) * 100)}%)
              </span>
            </div>
            <ProgressBar
              current={score}
              total={totalSentences}
              label="完全一致"
            />
            <Button onClick={handleNew} size="lg">
              別の問題セット
            </Button>
          </div>

          {data.sentences.map((s, i) => {
            const input = allInputs[i] ?? "";
            const diff = diffWords(s.text, input);
            const correct = diff.every((d) => d.correct);
            return (
              <div key={s.id} className={styles.card}>
                <p className={styles.qNum}>問題 {i + 1}</p>
                <div className={styles.feedbackPhase}>
                  <p className={styles.fbLabel}>
                    {correct ? "✓ 正解" : "✗ 不正解"} — 正解:
                  </p>
                  <p className={styles.originalSentence}>{s.text}</p>
                  <p className={styles.fbLabel}>あなたの回答 (差分):</p>
                  <div className={styles.diffView}>
                    {diff.map((d, j) => (
                      <span
                        key={j}
                        className={[
                          styles.diffWord,
                          d.correct ? styles.diffCorrect : styles.diffWrong,
                        ].join(" ")}
                        title={
                          d.correct ? "" : `入力: ${d.inputWord || "(なし)"}`
                        }
                      >
                        {d.correct ? d.word : d.inputWord || "▪"}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

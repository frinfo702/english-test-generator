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
        subtitle="Read and memorize the sentence, then reproduce it by typing."
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
          Load Another Set
        </Button>
      </div>

      {loading && <LoadingSpinner message="Loading question set..." />}
      {error && (
        <div className={styles.error}>
          <p>{error}</p>
          <p className={styles.errorHint}>
            questions/toefl/speaking/listen-repeat/
            Add question JSON under this folder.
          </p>
        </div>
      )}

      {data && !loading && !graded && sentence && (
        <div className={styles.card}>
          <p className={styles.qNum}>
            Question {current + 1} / {totalSentences}
          </p>

          {phase === "showing" && (
            <div className={styles.showPhase}>
              <div className={styles.countdown}>{countdown}</div>
              <p className={styles.sentenceDisplay}>{sentence.text}</p>
              <p className={styles.hint}>Memorize this sentence.</p>
            </div>
          )}

          {phase === "hidden" && (
            <div className={styles.hiddenPhase}>
              <p className={styles.hiddenMsg}>
                The sentence is now hidden. Reproduce it by typing.
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
                placeholder="Type the sentence here..."
              />
              {!isLastSentence && (
                <Button
                  onClick={handleConfirmInput}
                  disabled={!currentInput.trim()}
                >
                  Next
                </Button>
              )}
              {isLastSentence && (
                <Button
                  onClick={() => {
                    setAllInputs((s) => ({ ...s, [current]: currentInput }));
                  }}
                  disabled={!currentInput.trim() || allInputs[current] != null}
                >
                  Confirm Input
                </Button>
              )}
            </div>
          )}

          {isLastSentence &&
            allInputs[current] != null &&
            phase === "hidden" && (
              <div style={{ marginTop: "1rem", textAlign: "center" }}>
                <Button onClick={handleSubmit} size="lg">
                  Submit
                </Button>
              </div>
            )}
        </div>
      )}

      {graded && data && (
        <>
          <div className={styles.resultCard}>
            <h2>Section Complete</h2>
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
              label="Exact Match"
            />
            <Button onClick={handleNew} size="lg">
              Another Set
            </Button>
          </div>

          {data.sentences.map((s, i) => {
            const input = allInputs[i] ?? "";
            const diff = diffWords(s.text, input);
            const correct = diff.every((d) => d.correct);
            return (
              <div key={s.id} className={styles.card}>
                <p className={styles.qNum}>Question {i + 1}</p>
                <div className={styles.feedbackPhase}>
                  <p className={styles.fbLabel}>
                    {correct ? "✓ Correct" : "✗ Incorrect"} - Correct:
                  </p>
                  <p className={styles.originalSentence}>{s.text}</p>
                  <p className={styles.fbLabel}>Your input (diff):</p>
                  <div className={styles.diffView}>
                    {diff.map((d, j) => (
                      <span
                        key={j}
                        className={[
                          styles.diffWord,
                          d.correct ? styles.diffCorrect : styles.diffWrong,
                        ].join(" ")}
                        title={
                          d.correct ? "" : `Input: ${d.inputWord || "(none)"}`
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

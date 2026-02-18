import { useState, useEffect } from "react";
import { SectionHeader } from "../../../components/layout/SectionHeader";
import { Button } from "../../../components/ui/Button";
import { LoadingSpinner } from "../../../components/ui/LoadingSpinner";
import { useGenerateProblem } from "../../../hooks/useGenerateProblem";
import styles from "./CompleteWordsPage.module.css";

interface Item {
  index: number;
  hint: string;
  answer: string;
  placeholder: string;
}

interface ProblemData {
  paragraph: string;
  items: Item[];
}

const DIFFICULTIES = [
  { value: "Module 1 (Standard)", label: "Module 1 標準" },
  { value: "Module 2 Easy", label: "Module 2 Easy" },
  { value: "Module 2 Hard", label: "Module 2 Hard" },
];

const TOPICS = [
  "biology", "geology", "astronomy", "psychology",
  "sociology", "history", "linguistics", "environmental science",
];

export function CompleteWordsPage() {
  const [difficulty, setDifficulty] = useState(DIFFICULTIES[0].value);
  const [answers, setAnswers] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<{ correct: number; total: number } | null>(null);

  const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];

  const { data, loading, error, generate } = useGenerateProblem<ProblemData>({
    promptPath: "/prompts/toefl/reading/complete-the-words.json",
    variables: { difficulty, topic },
  });

  useEffect(() => {
    generate({ difficulty, topic });
  }, []);

  useEffect(() => {
    if (data) {
      setAnswers(new Array(data.items.length).fill(""));
      setSubmitted(false);
      setScore(null);
    }
  }, [data]);

  const handleSubmit = () => {
    if (!data) return;
    let correct = 0;
    data.items.forEach((item, i) => {
      if (answers[i].trim().toLowerCase() === item.answer.toLowerCase()) correct++;
    });
    setScore({ correct, total: data.items.length });
    setSubmitted(true);
  };

  const handleNew = () => {
    generate({ difficulty, topic: TOPICS[Math.floor(Math.random() * TOPICS.length)] });
  };

  const renderParagraph = () => {
    if (!data) return null;
    let text = data.paragraph;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    const sorted = [...data.items].sort((a, b) =>
      text.indexOf(a.placeholder) - text.indexOf(b.placeholder)
    );
    sorted.forEach((item, i) => {
      const pos = text.indexOf(item.placeholder, lastIndex);
      if (pos === -1) return;
      parts.push(<span key={`t${i}`}>{text.slice(lastIndex, pos)}</span>);
      const itemIdx = data.items.indexOf(item);
      const isCorrect = submitted && answers[itemIdx].trim().toLowerCase() === item.answer.toLowerCase();
      const isWrong = submitted && !isCorrect;
      parts.push(
        <span key={`inp${i}`} className={styles.blankWrapper}>
          <span className={styles.hint}>{item.hint}</span>
          <input
            className={[
              styles.blankInput,
              submitted ? (isCorrect ? styles.correct : styles.wrong) : "",
            ].join(" ")}
            value={answers[itemIdx] ?? ""}
            onChange={(e) => {
              const next = [...answers];
              next[itemIdx] = e.target.value;
              setAnswers(next);
            }}
            disabled={submitted}
            placeholder="___"
            size={8}
          />
          {isWrong && <span className={styles.correctHint}>{item.answer}</span>}
        </span>
      );
      lastIndex = pos + item.placeholder.length;
    });
    parts.push(<span key="tail">{text.slice(lastIndex)}</span>);
    return parts;
  };

  return (
    <div>
      <SectionHeader
        title="Complete the Words"
        subtitle="学術パラグラフ中の単語を補完してください"
        backTo="/toefl"
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
          新しい問題
        </Button>
      </div>

      {loading && <LoadingSpinner />}
      {error && <p className={styles.error}>エラー: {error}</p>}

      {data && !loading && (
        <>
          <div className={styles.paragraph}>{renderParagraph()}</div>

          {!submitted ? (
            <Button onClick={handleSubmit} disabled={answers.some((a) => !a.trim())}>
              答え合わせ
            </Button>
          ) : (
            <div className={styles.result}>
              <div className={styles.scoreBox}>
                <span className={styles.scoreNum}>{score?.correct}</span>
                <span className={styles.scoreDen}>/{score?.total}</span>
                <span className={styles.scorePct}>
                  ({Math.round(((score?.correct ?? 0) / (score?.total ?? 1)) * 100)}%)
                </span>
              </div>
              <Button onClick={handleNew}>次の問題</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

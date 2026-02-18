import { useState, useEffect } from "react";
import { SectionHeader } from "../../components/layout/SectionHeader";
import { Button } from "../../components/ui/Button";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { FeedbackPanel } from "../../components/ui/FeedbackPanel";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { useGenerateProblem } from "../../hooks/useGenerateProblem";
import styles from "./Part6Page.module.css";

interface Question {
  id: string;
  blankNumber: number;
  type: string;
  options: { A: string; B: string; C: string; D: string };
  correct: "A" | "B" | "C" | "D";
  explanation: string;
}

interface Passage {
  id: string;
  textType: string;
  text: string;
  questions: Question[];
}

interface ProblemData {
  passages: Passage[];
}

export function Part6Page() {
  const [passageIdx, setPassageIdx] = useState(0);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({});
  const [done, setDone] = useState(false);

  const { data, loading, error, generate } = useGenerateProblem<ProblemData>({
    promptPath: "/prompts/toeic/part6-text-completion.json",
  });

  useEffect(() => { generate(); }, []);

  const passage = data?.passages[passageIdx];
  const allPassageQuestions = passage?.questions ?? [];
  const allAnswered = allPassageQuestions.every((q) => submitted[q.id]);

  const totalQ = data?.passages.reduce((s, p) => s + p.questions.length, 0) ?? 0;
  const totalAnswered = Object.keys(submitted).length;
  const totalCorrect = (data?.passages ?? []).flatMap((p) => p.questions).filter(
    (q) => submitted[q.id] && selected[q.id] === q.correct
  ).length;

  const handleSelect = (id: string, opt: string) => {
    if (submitted[id]) return;
    setSelected((s) => ({ ...s, [id]: opt }));
  };
  const handleCheck = (q: Question) => setSubmitted((s) => ({ ...s, [q.id]: true }));

  const handleNextPassage = () => {
    if (!data) return;
    if (passageIdx + 1 >= data.passages.length) setDone(true);
    else setPassageIdx((i) => i + 1);
  };

  const handleNew = () => {
    setPassageIdx(0); setSelected({}); setSubmitted({}); setDone(false);
    generate();
  };

  // Render passage text with blank markers replaced by option labels
  const renderPassageText = (p: Passage) => {
    let text = p.text;
    const parts: React.ReactNode[] = [];
    let last = 0;
    const markers = [1, 2, 3, 4];
    markers.forEach((n) => {
      const marker = `[${n}]`;
      const pos = text.indexOf(marker, last);
      if (pos === -1) return;
      parts.push(<span key={`t${n}`}>{text.slice(last, pos)}</span>);
      const q = p.questions.find((q) => q.blankNumber === n);
      const sel = q ? selected[q.id] : undefined;
      const sub = q ? submitted[q.id] : false;
      parts.push(
        <span key={`blank${n}`} className={[styles.inlineBlank, sub && sel === q?.correct ? styles.blankCorrect : sub ? styles.blankWrong : ""].join(" ")}>
          {sub && sel ? `(${sel}) ${q?.options[sel as keyof typeof q.options]}` : `[${n}]`}
        </span>
      );
      last = pos + marker.length;
    });
    parts.push(<span key="tail">{text.slice(last)}</span>);
    return parts;
  };

  return (
    <div>
      <SectionHeader
        title="Part 6: Text Completion"
        subtitle="文書の空欄に入る最も適切な語句・文を選んでください（4文書×4問）"
        backTo="/toeic"
        current={totalAnswered}
        total={totalQ}
      />

      {loading && <LoadingSpinner />}
      {error && <p className={styles.error}>エラー: {error}</p>}

      {data && !loading && !done && passage && (
        <>
          <div className={styles.passageNav}>
            <span className={styles.passageLabel}>文書 {passageIdx + 1} / {data.passages.length}</span>
            <span className={styles.passageType}>{passage.textType}</span>
          </div>

          <div className={styles.passageCard}>
            <p className={styles.passageText}>{renderPassageText(passage)}</p>
          </div>

          <div className={styles.questions}>
            {passage.questions.map((q) => {
              const sel = selected[q.id];
              const sub = submitted[q.id];
              return (
                <div key={q.id} className={styles.qBlock}>
                  <div className={styles.qHeader}>
                    <span className={styles.blankTag}>[{q.blankNumber}]</span>
                    <span className={styles.typeTag}>{q.type}</span>
                  </div>
                  <div className={styles.options}>
                    {(["A", "B", "C", "D"] as const).map((opt) => (
                      <button
                        key={opt}
                        className={[
                          styles.option,
                          sel === opt ? styles.selected : "",
                          sub && opt === q.correct ? styles.correctOpt : "",
                          sub && sel === opt && opt !== q.correct ? styles.wrongOpt : "",
                        ].join(" ")}
                        onClick={() => handleSelect(q.id, opt)}
                      >
                        <span className={styles.optLabel}>{opt}</span>
                        <span className={styles.optText}>{q.options[opt]}</span>
                      </button>
                    ))}
                  </div>
                  {sub && (
                    <FeedbackPanel
                      correct={sel === q.correct}
                      explanation={q.explanation}
                      correctAnswer={`(${q.correct}) ${q.options[q.correct]}`}
                    />
                  )}
                  {!sub && (
                    <Button size="sm" onClick={() => handleCheck(q)} disabled={!sel}>確認</Button>
                  )}
                </div>
              );
            })}
          </div>

          {allAnswered && (
            <div className={styles.nav}>
              <Button onClick={handleNextPassage} size="lg">
                {passageIdx + 1 < data.passages.length ? "次の文書" : "結果を見る"}
              </Button>
            </div>
          )}
        </>
      )}

      {done && data && (
        <div className={styles.resultCard}>
          <h2>Part 6 完了</h2>
          <div className={styles.scoreBox}>
            <span className={styles.scoreNum}>{totalCorrect}</span>
            <span className={styles.scoreDen}>/{totalQ}</span>
            <span className={styles.scorePct}>({Math.round((totalCorrect / totalQ) * 100)}%)</span>
          </div>
          <ProgressBar current={totalCorrect} total={totalQ} label="正答率" />
          <Button onClick={handleNew} size="lg">新しい問題セット</Button>
        </div>
      )}
    </div>
  );
}

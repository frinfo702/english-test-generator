import styles from "./FeedbackPanel.module.css";

interface FeedbackPanelProps {
  correct: boolean;
  explanation: string;
  correctAnswer?: string;
}

export function FeedbackPanel({ correct, explanation, correctAnswer }: FeedbackPanelProps) {
  return (
    <div className={[styles.panel, correct ? styles.correct : styles.incorrect].join(" ")}>
      <div className={styles.header}>
        <span className={styles.icon}>{correct ? "✓" : "✗"}</span>
        <span className={styles.status}>{correct ? "正解" : "不正解"}</span>
      </div>
      {!correct && correctAnswer && (
        <p className={styles.correctAnswer}>
          正解: <strong>{correctAnswer}</strong>
        </p>
      )}
      <p className={styles.explanation}>{explanation}</p>
    </div>
  );
}

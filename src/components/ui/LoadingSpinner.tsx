import styles from "./LoadingSpinner.module.css";

interface LoadingSpinnerProps {
  message?: string;
}

export function LoadingSpinner({ message = "問題を生成中..." }: LoadingSpinnerProps) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.spinner} />
      <p className={styles.message}>{message}</p>
    </div>
  );
}

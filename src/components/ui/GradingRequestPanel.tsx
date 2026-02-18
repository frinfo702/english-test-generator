import { Button } from "./Button";
import styles from "./GradingRequestPanel.module.css";

interface GradingRequestPanelProps {
  saving: boolean;
  error: string | null;
  message: string | null;
  copied: boolean;
  onCopy: () => void;
}

export function GradingRequestPanel({
  saving,
  error,
  message,
  copied,
  onCopy,
}: GradingRequestPanelProps) {
  if (!saving && !error && !message) return null;

  return (
    <div className={styles.panel}>
      {saving && <p className={styles.status}>Saving your response locally...</p>}
      {error && <p className={styles.error}>{error}</p>}
      {message && (
        <>
          <p className={styles.message}>{message}</p>
          <Button onClick={onCopy} variant="secondary">
            {copied ? "Copied" : "Copy Text"}
          </Button>
        </>
      )}
    </div>
  );
}

import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../../../components/ui/Button";
import { VercelMark } from "../../../components/ui/VercelMark";
import { copyText } from "../../../lib/answerSubmission";
import {
  parseAiScores,
  type AiInterviewScores,
} from "../../../lib/interviewScoring";
import styles from "./AiScorePanel.module.css";

const INTERVIEW_NOTE =
  "1. Copy the prompt into your AI chat. 2. Paste its whole reply here. The AI rates language use and organization; pronunciation and fluency come from your audio.";

export function AiScorePanel<T = AiInterviewScores>({
  message,
  onApply,
  parse = parseAiScores as unknown as (reply: string) => T,
  note = INTERVIEW_NOTE,
}: {
  message: string;
  onApply: (ai: { reply: string; scores: T }) => void;
  parse?: (reply: string) => T;
  note?: string;
}) {
  const [reply, setReply] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCopy = async () => {
    try {
      if (!(await copyText(message))) {
        setError("Clipboard is not available in this environment.");
        return;
      }
      setCopied(true);
    } catch {
      setError("Failed to copy.");
    }
  };

  const handleApply = () => {
    try {
      onApply({ reply, scores: parse(reply) });
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <div className={styles.panel}>
      <p className={styles.note}>{note}</p>
      <Button variant="secondary" size="sm" onClick={() => void handleCopy()}>
        {copied ? "Copied" : "Copy for AI scoring"}
      </Button>
      <textarea
        className={styles.paste}
        rows={4}
        placeholder="Paste the AI's reply here"
        aria-label="AI reply"
        value={reply}
        onChange={(e) => setReply(e.target.value)}
      />
      <Button size="sm" onClick={handleApply} disabled={!reply.trim()}>
        Apply AI score
      </Button>
      {error && <p className={styles.error}>{error}</p>}
      <Link to="/settings/ai-scoring" className={styles.byok}>
        <VercelMark size={10} />
        Skip the copy &amp; paste: score here with your own AI Gateway key
      </Link>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SectionHeader } from "../layout/SectionHeader";
import { Button } from "../ui/Button";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import { type QuestionFileEntry, listQuestionFiles } from "../../lib/questions";
import {
  useScoreHistory,
  type ScoreEntry,
  type TaskId,
} from "../../hooks/useScoreHistory";
import { formatSecondsAsMmSs } from "../../lib/time";
import styles from "./QuestionSelectorPage.module.css";

interface QuestionSelectorPageProps {
  taskId: TaskId;
  title: string;
  subtitle: string;
  backTo: string;
  basePath: string;
}

function buildLatestByQuestionFile(entries: ScoreEntry[]): Map<string, ScoreEntry> {
  const latestByFile = new Map<string, ScoreEntry>();
  entries.forEach((entry) => {
    if (!entry.questionFile) return;
    const existing = latestByFile.get(entry.questionFile);
    if (!existing || new Date(existing.date).getTime() < new Date(entry.date).getTime()) {
      latestByFile.set(entry.questionFile, entry);
    }
  });
  return latestByFile;
}

export function QuestionSelectorPage({
  taskId,
  title,
  subtitle,
  backTo,
  basePath,
}: QuestionSelectorPageProps) {
  const navigate = useNavigate();
  const { getAll } = useScoreHistory();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<QuestionFileEntry[]>([]);
  const [scores, setScores] = useState<ScoreEntry[]>([]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    Promise.all([listQuestionFiles(taskId), getAll()])
      .then(([questionFiles, allScores]) => {
        if (!active) return;
        setFiles(questionFiles);
        setScores(allScores.filter((entry) => entry.taskId === taskId));
      })
      .catch((e) => {
        if (!active) return;
        setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [getAll, taskId]);

  const latestByFile = useMemo(() => buildLatestByQuestionFile(scores), [scores]);

  const handlePick = (questionNumber: number) => {
    navigate(`${basePath}/${questionNumber}`);
  };

  const handleRandom = () => {
    if (files.length === 0) return;
    const item = files[Math.floor(Math.random() * files.length)];
    handlePick(item.number);
  };

  return (
    <div>
      <SectionHeader title={title} subtitle={subtitle} backTo={backTo} />

      <div className={styles.topBar}>
        <Button onClick={handleRandom} disabled={loading || files.length === 0}>
          Random Question
        </Button>
      </div>

      {loading && <LoadingSpinner message="Loading question list..." />}
      {error && (
        <div className={styles.error}>
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className={styles.list}>
          {files.map((item) => {
            const latest = latestByFile.get(item.file);
            const elapsed =
              typeof latest?.elapsedSeconds === "number"
                ? formatSecondsAsMmSs(latest.elapsedSeconds)
                : "—";
            const accuracy = typeof latest?.pct === "number" ? `${latest.pct}%` : "—";

            return (
              <button
                type="button"
                key={item.file}
                className={styles.row}
                onClick={() => handlePick(item.number)}
              >
                <span className={styles.number}>Q{item.number}</span>
                <span className={styles.metric}>Time: {elapsed}</span>
                <span className={styles.metric}>Accuracy: {accuracy}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

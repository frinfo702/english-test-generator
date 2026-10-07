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
import table from "../ui/ProblemTable.module.css";
import styles from "./QuestionSelectorPage.module.css";

interface QuestionSelectorPageProps {
  taskId: TaskId;
  title: string;
  subtitle: string;
  backTo: string;
  basePath: string;
}

function buildLatestByProblem(entries: ScoreEntry[]): Map<string, ScoreEntry> {
  const latestByProblem = new Map<string, ScoreEntry>();
  entries.forEach((entry) => {
    if (!entry.problemId) return;
    const existing = latestByProblem.get(entry.problemId);
    if (
      !existing ||
      new Date(existing.date).getTime() < new Date(entry.date).getTime()
    ) {
      latestByProblem.set(entry.problemId, entry);
    }
  });
  return latestByProblem;
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

    Promise.all([listQuestionFiles(taskId), getAll()])
      .then(([questionFiles, allScores]) => {
        if (!active) return;
        setFiles(questionFiles);
        setScores(allScores.filter((entry) => entry.taskId === taskId));
        setError(null);
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

  const latestByProblem = useMemo(() => buildLatestByProblem(scores), [scores]);

  const handlePick = (questionId: string) => {
    navigate(`${basePath}/${questionId}`);
  };

  const handleRandom = () => {
    if (files.length === 0) return;
    const item = files[Math.floor(Math.random() * files.length)];
    handlePick(item.id);
  };

  return (
    <div>
      <SectionHeader title={title} subtitle={subtitle} backTo={backTo} />

      <div className={styles.topBar}>
        <Button
          variant="primary"
          onClick={handleRandom}
          disabled={loading || files.length === 0}
          size="md"
        >
          Pick Random
        </Button>
      </div>

      {loading && <LoadingSpinner message="Loading question list..." />}
      {error && (
        <div className={styles.error}>
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className={table.container}>
          <div className={[table.header, styles.headerRow].join(" ")}>
            <span aria-hidden="true" />
            <span>Question</span>
            <span className={styles.headerMetric}>Time</span>
            <span className={styles.headerMetric}>Accuracy</span>
            <span aria-hidden="true" />
          </div>
          {files.map((item, i) => {
            const latest = latestByProblem.get(item.id);
            const elapsed =
              typeof latest?.elapsedSeconds === "number"
                ? formatSecondsAsMmSs(latest.elapsedSeconds)
                : "—";
            const accuracy =
              typeof latest?.pct === "number" ? `${latest.pct}%` : "—";
            const completed = !!latest;

            return (
              <button
                type="button"
                key={item.file}
                className={[
                  table.row,
                  styles.row5Col,
                  completed ? table.rowCompleted : "",
                ].join(" ")}
                onClick={() => handlePick(item.id)}
              >
                <span className={table.statusCol}>
                  {completed ? (
                    <span className={table.statusSolved}>✓</span>
                  ) : (
                    <span className={table.statusNone}>{i + 1}</span>
                  )}
                </span>
                <span className={styles.number}>Q{i + 1}</span>
                <span className={styles.metricValue}>{elapsed}</span>
                <span
                  className={[
                    styles.metricValue,
                    completed ? styles.metricValueAccent : "",
                  ].join(" ")}
                >
                  {accuracy}
                </span>
                <span className={styles.chevron}>→</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

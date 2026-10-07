import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { getAttempt, putAttempts, type Attempt } from "../../lib/attempts";
import {
  InterviewResult,
  ListenRepeatResult,
} from "../toefl/speaking/SpeakingResult";

export function ResultPage() {
  const { attemptId = "" } = useParams<{ attemptId: string }>();
  // Keyed by id so the previous result never shows while the next one loads.
  const [loaded, setLoaded] = useState<{
    id: string;
    attempt: Attempt | null;
  } | null>(null);
  const attempt = loaded?.id === attemptId ? loaded.attempt : undefined;
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getAttempt(attemptId).then(
      (a) => !cancelled && setLoaded({ id: attemptId, attempt: a ?? null }),
      () => !cancelled && setLoaded({ id: attemptId, attempt: null }),
    );
    return () => {
      cancelled = true;
    };
  }, [attemptId]);

  const update = (next: Attempt) => {
    setLoaded({ id: next.id, attempt: next });
    putAttempts([next]).then(
      () => setSaveError(null),
      (e: unknown) =>
        setSaveError(e instanceof Error ? e.message : "Failed to save."),
    );
  };

  if (attempt === undefined)
    return <LoadingSpinner message="Loading result..." />;
  if (attempt === null) return <p>Result not found.</p>;

  return (
    <>
      {saveError && <p role="alert">{saveError}</p>}
      {attempt.taskId === "toefl/speaking/listen-repeat" ? (
        <ListenRepeatResult attempt={attempt} />
      ) : attempt.taskId === "toefl/speaking/interview" ? (
        <InterviewResult attempt={attempt} onChange={update} />
      ) : (
        <p>This task has no result page yet.</p>
      )}
    </>
  );
}

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { useAttemptUpdates } from "../../hooks/useAutoScore";
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
  // A score finishing in the background lands here while the page is open.
  useAttemptUpdates((a) => {
    if (a.id === attemptId) setLoaded({ id: a.id, attempt: a });
  });

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
    // The score is already on screen; only keeping it failed, so say so in passing.
    putAttempts([next]).catch((e: unknown) =>
      toast.error("Couldn't save the score", {
        description: e instanceof Error ? e.message : String(e),
      }),
    );
  };

  if (attempt === undefined)
    return <LoadingSpinner message="Loading result..." />;
  if (attempt === null) return <p>Result not found.</p>;

  return (
    <>
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

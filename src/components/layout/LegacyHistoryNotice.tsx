import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/Button";
import {
  discardLegacyHistory,
  legacyHistoryCount,
  migrateLegacyHistory,
} from "../../lib/migrations";
import styles from "./LegacyHistoryNotice.module.css";

type Step = "ask" | "confirm-discard" | "migrating" | "migrated";

/**
 * Shown on launch while history from before the IndexedDB move is still in
 * localStorage. Closing it deletes nothing; it asks again next launch.
 */
export function LegacyHistoryNotice({
  onMigrated,
}: {
  /** Lets the shell reload pages that already read the (empty) history. */
  onMigrated: () => void;
}) {
  const navigate = useNavigate();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [count] = useState(legacyHistoryCount);
  const [step, setStep] = useState<Step>("ask");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (count > 0) dialogRef.current?.showModal();
  }, [count]);

  if (count === 0) return null;

  const close = () => dialogRef.current?.close();

  const migrate = async () => {
    setStep("migrating");
    setError(null);
    try {
      await migrateLegacyHistory();
      setStep("migrated");
      onMigrated();
    } catch (e) {
      setStep("ask");
      setError(
        `Moving failed, and your old history is untouched: ${e instanceof Error ? e.message : e}`,
      );
    }
  };

  const records = `${count} record${count === 1 ? "" : "s"}`;

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby="legacy-history-title"
    >
      {step === "migrated" ? (
        <>
          <h2 id="legacy-history-title" className={styles.title}>
            History moved
          </h2>
          <p className={styles.body}>
            Moved {records}. Your history lives only in this browser, so export
            a backup from the Dashboard to keep a copy.
          </p>
          <div className={styles.actions}>
            <Button
              size="sm"
              onClick={() => {
                close();
                navigate("/dashboard");
              }}
            >
              Open Dashboard
            </Button>
            <Button size="sm" variant="ghost" onClick={close}>
              Close
            </Button>
          </div>
        </>
      ) : step === "confirm-discard" ? (
        <>
          <h2 id="legacy-history-title" className={styles.title}>
            Delete old history?
          </h2>
          <p className={styles.body}>
            This permanently deletes {records} from before the update. It cannot
            be undone.
          </p>
          <div className={styles.actions}>
            <Button
              size="sm"
              variant="danger"
              onClick={() => {
                discardLegacyHistory();
                close();
              }}
            >
              Delete permanently
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setStep("ask")}>
              Back
            </Button>
          </div>
        </>
      ) : (
        <>
          <h2 id="legacy-history-title" className={styles.title}>
            Update: your history has a new home
          </h2>
          <p className={styles.body}>
            Practice history now uses a larger storage that can also keep your
            speaking recordings. {records} from before the update are still in
            the old storage and won&apos;t show on the Dashboard until you move
            them.
          </p>
          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}
          <div className={styles.actions}>
            <Button size="sm" onClick={migrate} disabled={step === "migrating"}>
              {step === "migrating" ? "Moving…" : "Migrate history"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={close}
              disabled={step === "migrating"}
            >
              Later
            </Button>
          </div>
          <button
            type="button"
            className={styles.discard}
            onClick={() => setStep("confirm-discard")}
            disabled={step === "migrating"}
          >
            Discard old history instead
          </button>
        </>
      )}
    </dialog>
  );
}

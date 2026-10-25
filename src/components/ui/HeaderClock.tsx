import { useContext } from "react";
import { createPortal } from "react-dom";
import { HeaderClockSlot } from "../layout/headerSlot";
import { TrialItemContext } from "../../hooks/useTrialItem";
import styles from "./HeaderClock.module.css";

interface HeaderClockProps {
  display: string;
  running: boolean;
  /** Countdown states, e.g. the last minute of a writing task. */
  isWarning?: boolean;
  isExpired?: boolean;
}

/**
 * The task clock, docked in the sticky app header like the real test's
 * toolbar clock. A floating pill had nowhere to sit that wasn't over the
 * passage or the page actions at some width.
 */
export function HeaderClock({
  display,
  running,
  isWarning,
  isExpired = false,
}: HeaderClockProps) {
  const inTrial = useContext(TrialItemContext) !== null;
  const slot = useContext(HeaderClockSlot);
  // A test shows the section clock; only countdowns (writing tasks) pass isWarning.
  if (inTrial && isWarning === undefined) return null;
  const clock = (
    <div
      className={[
        styles.clock,
        isWarning ? styles.warning : "",
        isExpired ? styles.expired : "",
      ].join(" ")}
      role="timer"
    >
      <span
        className={[styles.dot, running ? styles.active : ""].join(" ")}
        aria-hidden="true"
      />
      <span className={styles.label}>TIME</span>
      <span className={styles.value}>{display}</span>
    </div>
  );
  return slot ? createPortal(clock, slot) : clock;
}

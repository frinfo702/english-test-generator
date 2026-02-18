import styles from "./Timer.module.css";

interface TimerProps {
  display: string;
  isWarning: boolean;
  isExpired: boolean;
}

export function Timer({ display, isWarning, isExpired }: TimerProps) {
  return (
    <div
      className={[
        styles.timer,
        isWarning ? styles.warning : "",
        isExpired ? styles.expired : "",
      ].join(" ")}
    >
      {display}
    </div>
  );
}

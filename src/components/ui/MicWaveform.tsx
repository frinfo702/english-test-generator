import styles from "./MicWaveform.module.css";

interface MicWaveformProps {
  levels: number[];
  active?: boolean;
  label?: string;
  className?: string;
}

export function MicWaveform({
  levels,
  active = false,
  label = "Microphone level",
  className,
}: MicWaveformProps) {
  const hasSignal = levels.some((l) => l > 0.05);

  return (
    <div
      className={[styles.wrap, active ? styles.active : "", className ?? ""]
        .filter(Boolean)
        .join(" ")}
      role="img"
      aria-label={
        active
          ? hasSignal
            ? `${label}: signal detected`
            : `${label}: listening (speak to see the wave move)`
          : label
      }
    >
      <div className={styles.bars} aria-hidden="true">
        {levels.map((level, i) => {
          const height = active ? Math.max(8, Math.round(level * 100)) : 8;
          return (
            <span
              key={i}
              className={styles.bar}
              style={{ height: `${height}%` }}
            />
          );
        })}
      </div>
      <p className={styles.hint}>
        {active
          ? hasSignal
            ? "Mic is working — keep speaking"
            : "Listening… speak to verify your mic"
          : "Microphone idle"}
      </p>
    </div>
  );
}

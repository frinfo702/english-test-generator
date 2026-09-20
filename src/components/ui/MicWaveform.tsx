import styles from "./MicWaveform.module.css";

interface MicWaveformProps {
  /** Normalised bar levels (0–1), e.g. from useSpeechRecognition. */
  levels: number[];
  active?: boolean;
  label?: string;
  className?: string;
}

/** Compact level bars for an already-open microphone stream. */
export function MicWaveform({
  levels,
  active = false,
  label = "Microphone level",
  className,
}: MicWaveformProps) {
  const hasSignal = levels.some((level) => level > 0.05);

  return (
    <div
      className={[styles.wrap, active ? styles.active : "", className ?? ""]
        .filter(Boolean)
        .join(" ")}
      role="img"
      aria-label={
        active && hasSignal ? `${label}: signal` : label
      }
    >
      {levels.map((level, index) => (
        <span
          key={index}
          className={styles.bar}
          style={{ height: `${active ? Math.max(6, level * 100) : 6}%` }}
        />
      ))}
    </div>
  );
}

import styles from "./SpeedControl.module.css";

const PRESETS = [
  { label: "Slow", rate: 0.8 },
  { label: "Normal", rate: 1.0 },
  { label: "Fast", rate: 1.2 },
];

interface SpeedControlProps {
  playbackRate: number;
  onChange: (rate: number) => void;
  showSlider?: boolean;
  min?: number;
  max?: number;
  step?: number;
}

export function SpeedControl({
  playbackRate,
  onChange,
  showSlider = false,
  min = 0.5,
  max = 1.5,
  step = 0.1,
}: SpeedControlProps) {
  return (
    <>
      {showSlider && (
        <div className={styles.speedControl}>
          <label className={styles.speedLabel}>Speed</label>
          <input
            type="range"
            className={styles.speedSlider}
            min={min}
            max={max}
            step={step}
            value={playbackRate}
            onChange={(e) => onChange(Number(e.target.value))}
          />
          <span className={styles.speedValue}>{playbackRate.toFixed(1)}x</span>
        </div>
      )}
      <div className={styles.speedBtns}>
        {PRESETS.map(({ label, rate }) => (
          <button
            key={rate}
            type="button"
            className={`${styles.speedBtn} ${playbackRate === rate ? styles.speedBtnActive : ""}`}
            onClick={() => onChange(rate)}
          >
            {label}
          </button>
        ))}
      </div>
    </>
  );
}

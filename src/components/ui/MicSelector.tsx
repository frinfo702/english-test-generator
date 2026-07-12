import { useEffect, useId } from "react";
import { useMicrophoneDevices } from "../../hooks/useMicrophoneDevices";
import styles from "./MicSelector.module.css";

function MicIcon() {
  return (
    <svg
      className={styles.icon}
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

interface MicSelectorProps {
  disabled?: boolean;
  className?: string;
  /**
   * Request permission so labels populate. Keep false while recording —
   * opening a second getUserMedia stream steals exclusive access on many USB mics.
   */
  requestPermissionOnMount?: boolean;
  /** Optional: deviceId of the track currently opened for recording. */
  activeDeviceId?: string | null;
}

export function MicSelector({
  disabled = false,
  className,
  requestPermissionOnMount = true,
  activeDeviceId = null,
}: MicSelectorProps) {
  const selectId = useId();
  const {
    devices,
    selectedDeviceId,
    setSelectedDeviceId,
    loading,
    error,
    ensurePermission,
  } = useMicrophoneDevices();

  useEffect(() => {
    if (!requestPermissionOnMount || disabled) return;
    void ensurePermission();
  }, [requestPermissionOnMount, disabled, ensurePermission]);

  const activeLabel =
    activeDeviceId &&
    (devices.find((d) => d.deviceId === activeDeviceId)?.label ??
      "Selected microphone");

  return (
    <div className={[styles.wrap, className].filter(Boolean).join(" ")}>
      <label className={styles.label} htmlFor={selectId}>
        <MicIcon />
        <span className={styles.labelText}>Microphone</span>
      </label>
      <select
        id={selectId}
        className={styles.select}
        value={selectedDeviceId ?? ""}
        disabled={disabled || loading}
        onChange={(e) => {
          const value = e.target.value;
          setSelectedDeviceId(value === "" ? null : value);
        }}
        aria-label="Select microphone"
      >
        <option value="">System default</option>
        {devices.map((d) => (
          <option key={d.deviceId} value={d.deviceId}>
            {d.label}
          </option>
        ))}
      </select>
      {activeDeviceId && (
        <p className={styles.activeHint} title={activeDeviceId}>
          Using: {activeLabel}
        </p>
      )}
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}

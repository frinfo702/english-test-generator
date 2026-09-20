import { useEffect, useId, useRef, useState } from "react";
import { useMicrophoneDevices } from "../../hooks/useMicrophoneDevices";
import { LiveWaveform } from "./LiveWaveform";
import styles from "./MicSelector.module.css";

function MicIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <path d="M12 18v3" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M8 9l4-4 4 4M8 15l4 4 4-4" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12.5l4.5 4.5L19 7" />
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
  /**
   * Show a live input preview while the menu is open. Only safe when no
   * recorder is running — a second stream steals exclusive access on many mics.
   */
  previewEnabled?: boolean;
}

/**
 * Microphone picker modelled on ElevenLabs UI's Mic Selector (MIT): a quiet
 * trigger that opens a listbox of inputs with the live choice marked.
 */
export function MicSelector({
  disabled = false,
  className,
  requestPermissionOnMount = true,
  activeDeviceId = null,
  previewEnabled = false,
}: MicSelectorProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const [highlight, setHighlight] = useState(0);

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

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onPointerDown);
    return () => window.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const activeLabel =
    activeDeviceId &&
    (devices.find((d) => d.deviceId === activeDeviceId)?.label ??
      "Selected microphone");

  const options = [
    { deviceId: "", label: "System default" },
    ...devices.map((d) => ({ deviceId: d.deviceId, label: d.label })),
  ];

  const currentValue = selectedDeviceId ?? "";
  const currentIndex = Math.max(
    0,
    options.findIndex((o) => o.deviceId === currentValue),
  );

  const openMenu = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) setDropUp(rect.bottom > window.innerHeight * 0.6);
    setHighlight(currentIndex);
    setOpen(true);
    if (!devices.length) void ensurePermission();
  };

  const choose = (deviceId: string) => {
    setSelectedDeviceId(deviceId === "" ? null : deviceId);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const label = loading
    ? "Loading microphones…"
    : (options[currentIndex]?.label ?? "System default");

  return (
    <div
      className={[styles.wrap, className].filter(Boolean).join(" ")}
      ref={rootRef}
    >
      <button
        type="button"
        ref={triggerRef}
        className={[styles.trigger, open ? styles.triggerOpen : ""]
          .filter(Boolean)
          .join(" ")}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            if (!open) openMenu();
          }
        }}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
      >
        <MicIcon />
        <span className={styles.triggerLabel}>{label}</span>
        <ChevronIcon />
      </button>

      {open && (
        <ul
          id={listId}
          className={[styles.menu, dropUp ? styles.menuUp : ""]
            .filter(Boolean)
            .join(" ")}
          role="listbox"
          aria-label="Microphone"
          tabIndex={-1}
          ref={(node) => node?.focus()}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              setOpen(false);
              triggerRef.current?.focus();
            } else if (event.key === "ArrowDown") {
              event.preventDefault();
              setHighlight((h) => Math.min(options.length - 1, h + 1));
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setHighlight((h) => Math.max(0, h - 1));
            } else if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              choose(options[highlight]?.deviceId ?? "");
            }
          }}
        >
          {previewEnabled && (
            <li className={styles.previewRow} aria-hidden="true">
              <LiveWaveform
                active={open}
                deviceId={selectedDeviceId ?? undefined}
                barWidth={2}
                minBarHeight={2}
                barGap={1}
                barRadius={2}
                fadeEdges={false}
                height={22}
                mode="static"
                ariaLabel="Microphone preview"
              />
              <span className={styles.previewLabel}>Input level</span>
            </li>
          )}
          {options.map((option, index) => (
            <li key={option.deviceId || "default"}>
              <button
                type="button"
                role="option"
                aria-selected={option.deviceId === currentValue}
                className={[
                  styles.option,
                  index === highlight ? styles.optionHighlight : "",
                  option.deviceId === currentValue ? styles.optionSelected : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onMouseEnter={() => setHighlight(index)}
                onClick={() => choose(option.deviceId)}
              >
                <span className={styles.optionLabel}>{option.label}</span>
                {option.deviceId === currentValue && <CheckIcon />}
              </button>
            </li>
          ))}
        </ul>
      )}

      {activeDeviceId && (
        <p className={styles.activeHint} title={activeDeviceId}>
          Using: {activeLabel}
        </p>
      )}
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}

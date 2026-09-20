import { useEffect, useState, type ReactNode } from "react";
import { Button } from "./Button";
import { LiveWaveform } from "./LiveWaveform";
import { MicWaveform } from "./MicWaveform";
import styles from "./VoiceButton.module.css";

export type VoiceButtonState =
  | "idle"
  | "recording"
  | "processing"
  | "success"
  | "error";

export interface VoiceButtonProps {
  state?: VoiceButtonState;
  onPress?: () => void;
  label?: ReactNode;
  trailing?: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger" | "accent";
  size?: "sm" | "md" | "lg";
  className?: string;
  /** Real microphone levels while recording — avoids opening a second stream. */
  levels?: number[];
  feedbackDuration?: number;
  disabled?: boolean;
  idleIcon?: ReactNode;
}

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4.5 12.5l5 5L19.5 7" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

/**
 * Stateful voice button with an inline live waveform — ported from
 * ElevenLabs UI's Voice Button (MIT) onto the app's Button/token system.
 */
export function VoiceButton({
  state = "idle",
  onPress,
  label,
  trailing,
  variant = "secondary",
  size = "md",
  className,
  levels,
  feedbackDuration = 1500,
  disabled,
  idleIcon,
}: VoiceButtonProps) {
  const [hiddenFor, setHiddenFor] = useState<VoiceButtonState | null>(null);
  const showFeedback =
    (state === "success" || state === "error") && hiddenFor !== state;

  useEffect(() => {
    if (state !== "success" && state !== "error") return;
    const timeout = setTimeout(() => setHiddenFor(state), feedbackDuration);
    return () => clearTimeout(timeout);
  }, [state, feedbackDuration]);

  const isRecording = state === "recording";
  const isProcessing = state === "processing";
  const isSuccess = state === "success";
  const isError = state === "error";

  const shouldShowWaveform = isRecording || isProcessing || showFeedback;
  const shouldShowTrailing = !shouldShowWaveform && trailing;

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={onPress}
      disabled={disabled || isProcessing}
      className={[styles.voiceButton, className].filter(Boolean).join(" ")}
      aria-label={typeof label === "string" ? label : "Voice button"}
    >
      {label && <span className={styles.label}>{label}</span>}

      <span
        className={[
          styles.capsule,
          isRecording ? styles.capsuleRecording : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {shouldShowWaveform &&
          (isRecording && levels && levels.length > 0 ? (
            <MicWaveform
              levels={levels}
              active
              label="Recording level"
              className={styles.waveform}
            />
          ) : (
            <LiveWaveform
              active={false}
              processing={isRecording || isProcessing || isSuccess}
              barWidth={2}
              minBarHeight={2}
              barGap={1}
              barRadius={4}
              fadeEdges={false}
              sensitivity={1.8}
              height={20}
              mode="static"
              ariaLabel="Recording level"
              className={styles.waveform}
            />
          ))}

        {shouldShowTrailing && (
          <span className={styles.trailing}>{trailing}</span>
        )}

        {!shouldShowWaveform && !shouldShowTrailing && idleIcon}


        {isSuccess && showFeedback && (
          <span className={[styles.feedback, styles.feedbackSuccess].join(" ")}>
            <CheckIcon />
          </span>
        )}

        {isError && showFeedback && (
          <span className={[styles.feedback, styles.feedbackError].join(" ")}>
            <XIcon />
          </span>
        )}
      </span>

      {isRecording && trailing && (
        <span className={styles.trailingOutside}>{trailing}</span>
      )}
    </Button>
  );
}

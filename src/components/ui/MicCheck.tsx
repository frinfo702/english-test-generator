import { useEffect, useRef, useState, type ReactNode } from "react";
import { emptyLevels, startAudioMeter } from "../../lib/audioMeter";
import {
  loadPreferredMicrophoneId,
  openMicrophoneStream,
} from "../../lib/microphonePreference";
import { Button } from "./Button";
import { MicWaveform } from "./MicWaveform";
import styles from "./MicCheck.module.css";

const CHECK_SECONDS = 4;

type CheckState = "idle" | "opening" | "recording" | "playing" | "done";

/**
 * Records a few seconds and plays them back, like the real test's
 * microphone check. The meter reads the same stream it records, since a
 * second getUserMedia stream steals exclusive access on many USB mics.
 */
export function MicCheck({
  disabled = false,
  selector,
}: {
  disabled?: boolean;
  /** The mic picker, kept on the same line as the test it belongs to. */
  selector?: ReactNode;
}) {
  const [state, setState] = useState<CheckState>("idle");
  const [levels, setLevels] = useState<number[]>(emptyLevels);
  const [secondsLeft, setSecondsLeft] = useState(CHECK_SECONDS);
  const [error, setError] = useState<string | null>(null);
  const cleanupRef = useRef<() => void>(() => undefined);

  // Leaving the directions screen mid-check must free the mic for the test.
  useEffect(() => () => cleanupRef.current(), []);

  const run = async () => {
    setError(null);
    let stream: MediaStream | null = null;
    let url: string | null = null;
    const audio = new Audio();
    let meter: { stop: () => void } | null = null;
    let timer: ReturnType<typeof setInterval> | undefined;
    cleanupRef.current = () => {
      clearInterval(timer);
      meter?.stop();
      stream?.getTracks().forEach((t) => t.stop());
      audio.pause();
      if (url) URL.revokeObjectURL(url);
    };
    setState("opening");
    try {
      stream = (await openMicrophoneStream(loadPreferredMicrophoneId())).stream;
      meter = startAudioMeter(stream, setLevels);
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      const stopped = new Promise((resolve) => (recorder.onstop = resolve));
      recorder.start();
      setState("recording");
      setSecondsLeft(CHECK_SECONDS);
      timer = setInterval(
        () => setSecondsLeft((s) => Math.max(0, s - 1)),
        1000,
      );
      await new Promise((resolve) => setTimeout(resolve, CHECK_SECONDS * 1000));
      recorder.stop();
      await stopped;
      clearInterval(timer);
      meter.stop();
      stream.getTracks().forEach((t) => t.stop());

      url = URL.createObjectURL(new Blob(chunks, { type: recorder.mimeType }));
      audio.src = url;
      audio.onended = () => setState("done");
      setState("playing");
      await audio.play();
    } catch (e) {
      cleanupRef.current();
      setState("idle");
      setError(
        e instanceof Error && e.name === "NotAllowedError"
          ? "Microphone access was denied. Allow it in the browser and try again."
          : "Couldn't test the microphone. Check that it is connected.",
      );
    }
  };

  const busy = state !== "idle" && state !== "done";

  return (
    <div className={styles.check}>
      <div className={styles.row}>
        {selector}
        <Button
          variant="secondary"
          size="sm"
          onClick={() => void run()}
          disabled={disabled || busy}
        >
          {state === "done" ? "Test again" : "Test microphone"}
        </Button>
      </div>
      {state === "recording" && (
        <MicWaveform levels={levels} active label="Microphone check level" />
      )}
      <p className={styles.status} aria-live="polite">
        {state === "idle" &&
          `Say a sentence when recording starts; it plays back after ${CHECK_SECONDS} seconds.`}
        {state === "opening" && "Waiting for microphone access…"}
        {state === "recording" && `Speak now… ${secondsLeft}s`}
        {state === "playing" && "Playing back your recording…"}
        {state === "done" &&
          "Did you hear yourself clearly? If not, pick another microphone."}
      </p>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}

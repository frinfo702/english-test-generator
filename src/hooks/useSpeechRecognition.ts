import { useCallback, useEffect, useRef, useState } from "react";
import { AUDIO_METER_BAR_COUNT, startAudioMeter } from "../lib/audioMeter";
import {
  loadPreferredMicrophoneId,
  openMicrophoneStream,
} from "../lib/microphonePreference";
import { transcribeAudio } from "../lib/transcribe";

export interface UseSpeechRecognitionReturn {
  supported: boolean;
  recording: boolean;
  processing: boolean;
  transcript: string;
  error: string | null;
  /** Normalized bar levels 0–1 while recording. */
  levels: number[];
  /** deviceId of the track opened for the current recording. */
  activeDeviceId: string | null;
  start: () => Promise<void>;
  /** Stops recording, transcribes, updates transcript, returns text. */
  stop: () => Promise<string>;
  clearTranscript: () => void;
  clearError: () => void;
}

const env = typeof import.meta !== "undefined" ? import.meta.env : undefined;
const TRANSCRIBE_API_URL =
  (env?.VITE_TRANSCRIBE_API_URL as string | undefined) ?? "/api/transcribe";

function isBrowserSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    typeof MediaRecorder !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia
  );
}

function selectMimeType(): string {
  for (const type of [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/mp4;codecs=mp4a.40.2",
  ]) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return "";
}

function getMicrophoneErrorMessage(error: unknown): string {
  if (error instanceof DOMException) {
    switch (error.name) {
      case "NotAllowedError":
      case "PermissionDeniedError":
        return "Microphone access was denied. Please allow microphone permission and try again.";
      case "NotFoundError":
      case "DevicesNotFoundError":
        return "No microphone found. Please connect a microphone and try again.";
      case "OverconstrainedError":
      case "ConstraintNotSatisfiedError":
        return "Selected microphone is unavailable. Pick another mic or System default.";
      case "NotReadableError":
        return "Microphone is busy (another app may be using it). Close other apps and try again.";
      default:
        break;
    }
  }
  return `Failed to access the microphone: ${error instanceof Error ? error.message : String(error)}`;
}

function emptyLevels(): number[] {
  return Array.from({ length: AUDIO_METER_BAR_COUNT }, () => 0);
}

export function useSpeechRecognition(): UseSpeechRecognitionReturn {
  const [supported] = useState(() => isBrowserSupported());
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [levels, setLevels] = useState<number[]>(emptyLevels);
  const [activeDeviceId, setActiveDeviceId] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const stopPromiseRef = useRef<((text: string) => void) | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const meterRef = useRef<{ stop: () => void } | null>(null);
  const startPromiseRef = useRef<Promise<void> | null>(null);
  const transcriptRef = useRef("");
  /** Generation token so stale stop handlers ignore themselves. */
  const sessionIdRef = useRef(0);

  const stopMeter = useCallback(() => {
    meterRef.current?.stop();
    meterRef.current = null;
    setLevels(emptyLevels());
  }, []);

  const resolveStop = useCallback((text: string) => {
    stopPromiseRef.current?.(text);
    stopPromiseRef.current = null;
  }, []);

  const releaseHardware = useCallback(() => {
    stopMeter();
    const recorder = recorderRef.current;
    recorderRef.current = null;
    if (recorder && recorder.state !== "inactive") {
      try {
        recorder.ondataavailable = null;
        recorder.onerror = null;
        recorder.onstop = null;
        recorder.stop();
      } catch {
        // ignore
      }
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    chunksRef.current = [];
    setActiveDeviceId(null);
  }, [stopMeter]);

  const cleanup = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    sessionIdRef.current += 1;
    releaseHardware();
    // Never leave a waiter hanging if cleanup interrupts a stop.
    resolveStop(transcriptRef.current);
    setRecording(false);
    setProcessing(false);
  }, [releaseHardware, resolveStop]);

  const start = useCallback(async () => {
    if (!supported) {
      setError("Microphone recording is not supported in this browser.");
      return;
    }

    const run = async () => {
      cleanup();
      const sessionId = sessionIdRef.current;
      setTranscript("");
      transcriptRef.current = "";
      setError(null);
      setProcessing(false);
      chunksRef.current = [];
      setRecording(true);

      try {
        const preferredId = loadPreferredMicrophoneId();
        const { stream, usedDeviceId } =
          await openMicrophoneStream(preferredId);
        if (sessionId !== sessionIdRef.current) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        setActiveDeviceId(usedDeviceId);

        const track = stream.getAudioTracks()[0];
        if (!track || track.readyState !== "live") {
          throw new DOMException(
            "Microphone track is not live",
            "NotReadableError",
          );
        }
        track.enabled = true;

        meterRef.current = startAudioMeter(stream, setLevels);

        const mimeType = selectMimeType();
        const recorder = new MediaRecorder(
          stream,
          mimeType ? { mimeType } : undefined,
        );
        recorderRef.current = recorder;

        recorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            chunksRef.current.push(event.data);
          }
        };

        recorder.onerror = (event) => {
          if (sessionId !== sessionIdRef.current) return;
          const recorderError = (event as Event & { error?: DOMException })
            .error;
          setError(getMicrophoneErrorMessage(recorderError));
          cleanup();
        };

        recorder.onstop = () => {
          void (async () => {
            if (sessionId !== sessionIdRef.current) return;

            stopMeter();
            stream.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
            recorderRef.current = null;
            setRecording(false);
            setProcessing(true);
            setActiveDeviceId(null);

            const blob = new Blob(chunksRef.current, {
              type: recorder.mimeType || "audio/webm",
            });
            chunksRef.current = [];

            if (blob.size === 0) {
              setError("No audio recorded. Please try again.");
              setProcessing(false);
              resolveStop("");
              return;
            }

            const controller = new AbortController();
            abortControllerRef.current = controller;
            try {
              const text = await transcribeAudio(
                blob,
                TRANSCRIBE_API_URL,
                controller.signal,
              );
              if (sessionId !== sessionIdRef.current) return;
              transcriptRef.current = text;
              setTranscript(text);
              setProcessing(false);
              resolveStop(text);
            } catch (fetchError) {
              if (sessionId !== sessionIdRef.current) return;
              if ((fetchError as Error).name === "AbortError") {
                setProcessing(false);
                resolveStop("");
                return;
              }
              setError(
                fetchError instanceof Error
                  ? fetchError.message
                  : "Transcription failed. Please try again.",
              );
              setProcessing(false);
              resolveStop("");
            } finally {
              if (abortControllerRef.current === controller) {
                abortControllerRef.current = null;
              }
            }
          })();
        };

        recorder.start(250);
      } catch (micError) {
        if (sessionId !== sessionIdRef.current) return;
        setError(getMicrophoneErrorMessage(micError));
        setRecording(false);
        setActiveDeviceId(null);
        stopMeter();
      }
    };

    const promise = run();
    startPromiseRef.current = promise;
    await promise;
    if (startPromiseRef.current === promise) {
      startPromiseRef.current = null;
    }
  }, [supported, cleanup, resolveStop, stopMeter]);

  const stop = useCallback(() => {
    return new Promise<string>((resolve) => {
      void (async () => {
        if (startPromiseRef.current) {
          await startPromiseRef.current.catch(() => undefined);
        }

        const recorder = recorderRef.current;
        if (!recorder || recorder.state === "inactive") {
          resolve(transcriptRef.current);
          return;
        }

        stopPromiseRef.current = resolve;
        try {
          if (typeof recorder.requestData === "function") {
            recorder.requestData();
          }
          recorder.stop();
        } catch {
          setRecording(false);
          setProcessing(false);
          stopPromiseRef.current = null;
          resolve("");
        }
      })();
    });
  }, []);

  const clearTranscript = useCallback(() => {
    setTranscript("");
    transcriptRef.current = "";
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => cleanup, [cleanup]);

  return {
    supported,
    recording,
    processing,
    transcript,
    error,
    levels,
    activeDeviceId,
    start,
    stop,
    clearTranscript,
    clearError,
  };
}

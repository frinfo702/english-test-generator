import { useCallback, useEffect, useRef, useState } from "react";
import { transcribeAudio } from "../lib/transcribe";

interface UseSpeechRecognitionReturn {
  supported: boolean;
  recording: boolean;
  transcript: string;
  error: string | null;
  start: () => void;
  stop: () => Promise<void>;
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
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/mp4;codecs=mp4a.40.2",
  ];
  for (const type of candidates) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return "";
}

function getMicrophoneErrorMessage(error: unknown): string {
  if (error instanceof DOMException) {
    if (
      error.name === "NotAllowedError" ||
      error.name === "PermissionDeniedError"
    ) {
      return "Microphone access was denied. Please allow microphone permission and try again.";
    }
    if (
      error.name === "NotFoundError" ||
      error.name === "DevicesNotFoundError"
    ) {
      return "No microphone found. Please connect a microphone and try again.";
    }
  }
  return `Failed to access the microphone: ${error instanceof Error ? error.message : String(error)}`;
}

function getTranscriptionErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Transcription failed. Please try again.";
}

export function useSpeechRecognition(): UseSpeechRecognitionReturn {
  const [supported] = useState(() => isBrowserSupported());
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const stopPromiseRef = useRef<(() => void) | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const finalizeStop = useCallback(() => {
    setRecording(false);
    stopPromiseRef.current?.();
    stopPromiseRef.current = null;
  }, []);

  const cleanup = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;

    const recorder = recorderRef.current;
    recorderRef.current = null;
    if (recorder) {
      try {
        recorder.stop();
      } catch {
        // ignore
      }
    }

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    chunksRef.current = [];
  }, []);

  const start = useCallback(async () => {
    if (!supported) {
      setError("Microphone recording is not supported in this browser.");
      return;
    }

    cleanup();
    setTranscript("");
    setError(null);
    chunksRef.current = [];
    setRecording(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = selectMimeType();
      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined,
      );
      recorderRef.current = recorder;

      recorder.addEventListener("dataavailable", (event) => {
        const data = (event as BlobEvent).data;
        if (data && data.size > 0) {
          chunksRef.current.push(data);
        }
      });

      recorder.addEventListener("error", (event) => {
        const recorderError = (event as Event & { error?: DOMException }).error;
        setError(getMicrophoneErrorMessage(recorderError));
        cleanup();
        finalizeStop();
      });

      recorder.addEventListener("stop", async () => {
        if (recorderRef.current !== recorder) {
          return;
        }

        stream.getTracks().forEach((track) => track.stop());

        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });

        if (blob.size === 0) {
          setError("No audio recorded. Please try again.");
          finalizeStop();
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
          setTranscript(text);
          finalizeStop();
        } catch (fetchError) {
          if ((fetchError as Error).name === "AbortError") {
            finalizeStop();
            return;
          }
          setError(getTranscriptionErrorMessage(fetchError));
          finalizeStop();
        } finally {
          abortControllerRef.current = null;
        }
      });

      recorder.start();
    } catch (micError) {
      setError(getMicrophoneErrorMessage(micError));
      setRecording(false);
    }
  }, [supported, cleanup, finalizeStop]);

  const stop = useCallback(() => {
    return new Promise<void>((resolve) => {
      const recorder = recorderRef.current;
      if (!recorder || recorder.state === "inactive") {
        resolve();
        return;
      }

      stopPromiseRef.current = resolve;
      try {
        recorder.stop();
      } catch {
        setRecording(false);
        resolve();
      }
    });
  }, []);

  useEffect(() => cleanup, [cleanup]);

  return { supported, recording, transcript, error, start, stop };
}

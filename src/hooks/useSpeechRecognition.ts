import { useCallback, useEffect, useRef, useState } from "react";
import { transcribeAudio } from "../lib/transcribe";

export interface UseSpeechRecognitionReturn {
  supported: boolean;
  recording: boolean;
  processing: boolean;
  transcript: string;
  error: string | null;
  /** Normalized bar levels 0–1 for waveform visualization while recording. */
  levels: number[];
  start: () => Promise<void>;
  /** Stops recording, transcribes, updates transcript, and returns the text. */
  stop: () => Promise<string>;
  clearTranscript: () => void;
  clearError: () => void;
}

const LEVEL_BAR_COUNT = 24;
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

function emptyLevels(): number[] {
  return Array.from({ length: LEVEL_BAR_COUNT }, () => 0);
}

export function useSpeechRecognition(): UseSpeechRecognitionReturn {
  const [supported] = useState(() => isBrowserSupported());
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [levels, setLevels] = useState<number[]>(emptyLevels);

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const stopPromiseRef = useRef<{
    resolve: (text: string) => void;
    reject: (err: unknown) => void;
  } | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number>(0);
  const startPromiseRef = useRef<Promise<void> | null>(null);

  const stopLevelMeter = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
    analyserRef.current = null;
    if (audioCtxRef.current) {
      void audioCtxRef.current.close().catch(() => undefined);
      audioCtxRef.current = null;
    }
    setLevels(emptyLevels());
  }, []);

  const startLevelMeter = useCallback(
    (stream: MediaStream) => {
      stopLevelMeter();
      try {
        const AudioCtx =
          window.AudioContext ||
          (
            window as unknown as {
              webkitAudioContext?: typeof AudioContext;
            }
          ).webkitAudioContext;
        if (!AudioCtx) return;

        const ctx = new AudioCtx();
        audioCtxRef.current = ctx;
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        analyser.smoothingTimeConstant = 0.7;
        source.connect(analyser);
        analyserRef.current = analyser;

        const data = new Uint8Array(analyser.frequencyBinCount);

        const tick = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(data);
          const next: number[] = [];
          const binSize = Math.max(
            1,
            Math.floor(data.length / LEVEL_BAR_COUNT),
          );
          for (let i = 0; i < LEVEL_BAR_COUNT; i++) {
            let sum = 0;
            const start = i * binSize;
            for (let j = 0; j < binSize && start + j < data.length; j++) {
              sum += data[start + j];
            }
            next.push(Math.min(1, sum / binSize / 255));
          }
          setLevels(next);
          rafRef.current = requestAnimationFrame(tick);
        };

        if (ctx.state === "suspended") {
          void ctx.resume();
        }
        rafRef.current = requestAnimationFrame(tick);
      } catch {
        // Waveform is best-effort; recording still works without it.
      }
    },
    [stopLevelMeter],
  );

  const finalizeStop = useCallback(
    (text: string) => {
      setRecording(false);
      setProcessing(false);
      stopLevelMeter();
      stopPromiseRef.current?.resolve(text);
      stopPromiseRef.current = null;
    },
    [stopLevelMeter],
  );

  const cleanup = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    stopLevelMeter();

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
  }, [stopLevelMeter]);

  const start = useCallback(async () => {
    if (!supported) {
      setError("Microphone recording is not supported in this browser.");
      return;
    }

    const run = async () => {
      cleanup();
      setTranscript("");
      setError(null);
      setProcessing(false);
      chunksRef.current = [];
      setRecording(true);

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
          },
        });
        streamRef.current = stream;
        startLevelMeter(stream);

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
          const recorderError = (event as Event & { error?: DOMException })
            .error;
          setError(getMicrophoneErrorMessage(recorderError));
          cleanup();
          finalizeStop("");
        });

        recorder.addEventListener("stop", async () => {
          if (recorderRef.current !== recorder) {
            return;
          }

          stopLevelMeter();
          stream.getTracks().forEach((track) => track.stop());
          setRecording(false);
          setProcessing(true);

          const blob = new Blob(chunksRef.current, {
            type: recorder.mimeType || "audio/webm",
          });

          if (blob.size === 0) {
            setError("No audio recorded. Please try again.");
            finalizeStop("");
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
            finalizeStop(text);
          } catch (fetchError) {
            if ((fetchError as Error).name === "AbortError") {
              finalizeStop("");
              return;
            }
            setError(getTranscriptionErrorMessage(fetchError));
            finalizeStop("");
          } finally {
            abortControllerRef.current = null;
          }
        });

        recorder.start(250);
      } catch (micError) {
        setError(getMicrophoneErrorMessage(micError));
        setRecording(false);
        stopLevelMeter();
      }
    };

    const promise = run();
    startPromiseRef.current = promise;
    await promise;
    if (startPromiseRef.current === promise) {
      startPromiseRef.current = null;
    }
  }, [supported, cleanup, finalizeStop, startLevelMeter, stopLevelMeter]);

  const stop = useCallback(() => {
    return new Promise<string>((resolve, reject) => {
      void (async () => {
        if (startPromiseRef.current) {
          await startPromiseRef.current.catch(() => undefined);
        }

        const recorder = recorderRef.current;
        if (!recorder || recorder.state === "inactive") {
          resolve(transcript);
          return;
        }

        stopPromiseRef.current = { resolve, reject };
        try {
          recorder.stop();
        } catch {
          setRecording(false);
          setProcessing(false);
          stopPromiseRef.current = null;
          resolve("");
        }
      })();
    });
  }, [transcript]);

  const clearTranscript = useCallback(() => {
    setTranscript("");
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
    start,
    stop,
    clearTranscript,
    clearError,
  };
}

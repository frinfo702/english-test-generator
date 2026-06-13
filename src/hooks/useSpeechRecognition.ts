import { useCallback, useEffect, useRef, useState } from "react";

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionType extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

interface UseSpeechRecognitionReturn {
  supported: boolean;
  recording: boolean;
  transcript: string;
  error: string | null;
  start: () => void;
  stop: () => Promise<void>;
}

const RESTART_DELAY_MS = 100;

function getSpeechRecognition(): (new () => SpeechRecognitionType) | undefined {
  if (typeof window === "undefined") return undefined;
  const win = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionType;
    webkitSpeechRecognition?: new () => SpeechRecognitionType;
  };
  return win.SpeechRecognition ?? win.webkitSpeechRecognition;
}

function joinTranscriptParts(...parts: string[]): string {
  return parts
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" ");
}

export function useSpeechRecognition(): UseSpeechRecognitionReturn {
  const [supported] = useState(() => !!getSpeechRecognition());
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionType | null>(null);
  const endPromiseRef = useRef<(() => void) | null>(null);
  const restartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const committedTranscriptRef = useRef("");
  const finalTranscriptRef = useRef("");
  const requestedStopRef = useRef(false);

  const clearRestartTimeout = useCallback(() => {
    if (!restartTimeoutRef.current) return;
    clearTimeout(restartTimeoutRef.current);
    restartTimeoutRef.current = null;
  }, []);

  function startSession(resetTranscript: boolean) {
    const Recognition = getSpeechRecognition();
    if (!Recognition) {
      setError("Speech recognition is not supported in this browser.");
      setRecording(false);
      return;
    }

    clearRestartTimeout();

    const previousRecognition = recognitionRef.current;
    if (previousRecognition) {
      previousRecognition.onresult = null;
      previousRecognition.onerror = null;
      previousRecognition.onend = null;
      try {
        previousRecognition.abort();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }

    if (resetTranscript) {
      setTranscript("");
      committedTranscriptRef.current = "";
      finalTranscriptRef.current = "";
      setError(null);
      endPromiseRef.current?.();
      endPromiseRef.current = null;
      requestedStopRef.current = false;
    }

    const recognition = new Recognition();
    recognition.lang = "en-US";
    // Listen & Repeat only needs one utterance, and non-continuous mode is
    // noticeably more stable on Safari/WebKit.
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      if (recognitionRef.current !== recognition) return;

      let finalText = "";
      let interimText = "";
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript;
        } else {
          interimText = result[0].transcript;
        }
      }

      const finalized = joinTranscriptParts(
        committedTranscriptRef.current,
        finalText,
      );
      finalTranscriptRef.current = finalized;
      setTranscript(joinTranscriptParts(finalized, interimText));
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (recognitionRef.current !== recognition) return;

      if (event.error === "no-speech" || event.error === "aborted") {
        return;
      }

      const messages: Record<string, string> = {
        "audio-capture":
          "Failed to access the microphone. Please check your microphone and try again.",
        network:
          "Speech recognition failed due to a network error. Please check your connection and try again.",
        "not-allowed":
          "Microphone access was denied. Please allow microphone permission and try again.",
        "service-not-allowed":
          "Speech recognition is not allowed in this context. Please try a different browser.",
        "bad-grammar":
          "Speech recognition failed. Please speak clearly and try again.",
        "language-not-supported":
          "The selected language is not supported for speech recognition.",
      };

      setError(
        event.message ||
          messages[event.error] ||
          `Speech recognition error: ${event.error}`,
      );
      clearRestartTimeout();
      recognitionRef.current = null;
      requestedStopRef.current = false;
      setRecording(false);
      endPromiseRef.current?.();
      endPromiseRef.current = null;
    };

    recognition.onend = () => {
      if (recognitionRef.current !== recognition) return;

      recognitionRef.current = null;
      committedTranscriptRef.current = finalTranscriptRef.current.trim();

      if (requestedStopRef.current) {
        requestedStopRef.current = false;
        clearRestartTimeout();
        setRecording(false);
        endPromiseRef.current?.();
        endPromiseRef.current = null;
        return;
      }

      restartTimeoutRef.current = setTimeout(() => {
        restartTimeoutRef.current = null;
        startSession(false);
      }, RESTART_DELAY_MS);
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
      setError(null);
      setRecording(true);
    } catch (e) {
      clearRestartTimeout();
      setError(e instanceof Error ? e.message : String(e));
      setRecording(false);
    }
  }

  const start = useCallback(() => {
    startSession(true);
  }, [clearRestartTimeout]);

  const stop = useCallback(() => {
    return new Promise<void>((resolve) => {
      clearRestartTimeout();
      const recognition = recognitionRef.current;
      if (!recognition) {
        requestedStopRef.current = false;
        setRecording(false);
        resolve();
        return;
      }
      requestedStopRef.current = true;
      endPromiseRef.current = resolve;
      try {
        recognition.stop();
      } catch {
        resolve();
      }
    });
  }, [clearRestartTimeout]);

  useEffect(() => {
    return () => {
      const recognition = recognitionRef.current;
      if (recognition) {
        recognition.onresult = null;
        recognition.onerror = null;
        recognition.onend = null;
        try {
          recognition.abort();
        } catch {
          // ignore
        }
        recognitionRef.current = null;
      }
      clearRestartTimeout();
    };
  }, [clearRestartTimeout]);

  return { supported, recording, transcript, error, start, stop };
}

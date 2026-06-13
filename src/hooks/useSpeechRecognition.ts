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

function getSpeechRecognition(): (new () => SpeechRecognitionType) | undefined {
  if (typeof window === "undefined") return undefined;
  const win = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionType;
    webkitSpeechRecognition?: new () => SpeechRecognitionType;
  };
  return win.SpeechRecognition ?? win.webkitSpeechRecognition;
}

export function useSpeechRecognition(): UseSpeechRecognitionReturn {
  const [supported] = useState(() => !!getSpeechRecognition());
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionType | null>(null);
  const endPromiseRef = useRef<(() => void) | null>(null);
  const finalTranscriptRef = useRef("");

  const start = useCallback(() => {
    const Recognition = getSpeechRecognition();
    if (!Recognition) {
      setError("Speech recognition is not supported in this browser.");
      return;
    }

    setTranscript("");
    finalTranscriptRef.current = "";
    setError(null);
    endPromiseRef.current = null;

    const recognition = new Recognition();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
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
      finalTranscriptRef.current = finalText;
      setTranscript((finalText + interimText).trim());
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === "no-speech" || event.error === "aborted") {
        return;
      }
      setError(event.message || `Speech recognition error: ${event.error}`);
      setRecording(false);
      endPromiseRef.current?.();
      endPromiseRef.current = null;
    };

    recognition.onend = () => {
      setRecording(false);
      endPromiseRef.current?.();
      endPromiseRef.current = null;
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
      setRecording(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setRecording(false);
    }
  }, []);

  const stop = useCallback(() => {
    return new Promise<void>((resolve) => {
      const recognition = recognitionRef.current;
      if (!recognition) {
        resolve();
        return;
      }
      endPromiseRef.current = resolve;
      try {
        recognition.stop();
      } catch {
        resolve();
      }
    });
  }, []);

  useEffect(() => {
    return () => {
      const recognition = recognitionRef.current;
      if (recognition) {
        try {
          recognition.abort();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  return { supported, recording, transcript, error, start, stop };
}

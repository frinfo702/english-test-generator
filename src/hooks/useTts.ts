import { useCallback, useEffect, useRef, useState } from "react";
import { getVoiceForRole } from "../lib/voiceMapping";

export interface AudioSegment {
  role: string;
  text: string;
}

interface UseTtsReturn {
  playing: boolean;
  loading: boolean;
  error: string | null;
  currentTime: number;
  duration: number;
  play: (text: string, voiceId?: string) => Promise<void>;
  playSegments: (segments: AudioSegment[]) => Promise<void>;
  pause: () => void;
  stop: () => void;
}

export function useTts(): UseTtsReturn {
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);
  const rafRef = useRef<number>(0);

  // For segmented playback
  const segmentsRef = useRef<AudioSegment[]>([]);
  const currentIndexRef = useRef(0);
  const playedDurationRef = useRef(0);
  const segmentDurationRef = useRef(0);
  const playNextSegmentRef = useRef<() => Promise<void>>(async () => {});

  const cleanup = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
    segmentsRef.current = [];
    currentIndexRef.current = 0;
    playedDurationRef.current = 0;
    segmentDurationRef.current = 0;
    setPlaying(false);
    setLoading(false);
    setCurrentTime(0);
    setDuration(0);
  }, []);

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  const tick = useCallback(() => {
    if (audioRef.current) {
      const segTime = audioRef.current.currentTime || 0;
      const segDur = audioRef.current.duration || 0;
      if (segDur && Number.isFinite(segDur)) {
        segmentDurationRef.current = segDur;
      }
      setCurrentTime(playedDurationRef.current + segTime);
      setDuration(playedDurationRef.current + segmentDurationRef.current);
    }
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const playNextSegment = useCallback(async () => {
    const segments = segmentsRef.current;
    const idx = currentIndexRef.current;
    if (idx >= segments.length) {
      setPlaying(false);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
      return;
    }

    const segment = segments[idx];
    const voiceId = getVoiceForRole(segment.role);
    setLoading(true);
    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: segment.text, voice_id: voiceId }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `TTS request failed (${response.status})`);
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      urlRef.current = url;
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.addEventListener("ended", () => {
        const dur =
          audio.duration && Number.isFinite(audio.duration)
            ? audio.duration
            : audio.currentTime || 0;
        playedDurationRef.current += dur;
        currentIndexRef.current = idx + 1;
        URL.revokeObjectURL(url);
        urlRef.current = null;
        audioRef.current = null;
        playNextSegmentRef.current();
      });

      audio.addEventListener("error", () => {
        setPlaying(false);
        setError("Audio playback error");
        setLoading(false);
      });

      await audio.play();
      setPlaying(true);
      setLoading(false);
      rafRef.current = requestAnimationFrame(tick);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setLoading(false);
      setPlaying(false);
    }
  }, [tick]);

  playNextSegmentRef.current = playNextSegment;

  const play = useCallback(
    async (text: string, voiceId?: string) => {
      cleanup();
      setError(null);
      setLoading(true);
      try {
        const response = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, voice_id: voiceId }),
        });
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || `TTS request failed (${response.status})`);
        }
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        urlRef.current = url;
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.addEventListener("ended", () => {
          setPlaying(false);
          if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = 0;
          }
        });
        audio.addEventListener("error", () => {
          setPlaying(false);
          setError("Audio playback error");
          setLoading(false);
        });
        await audio.play();
        setPlaying(true);
        setLoading(false);
        rafRef.current = requestAnimationFrame(tick);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        setLoading(false);
      }
    },
    [cleanup, tick],
  );

  const playSegments = useCallback(
    async (segments: AudioSegment[]) => {
      cleanup();
      setError(null);
      segmentsRef.current = segments;
      currentIndexRef.current = 0;
      playedDurationRef.current = 0;
      segmentDurationRef.current = 0;
      await playNextSegmentRef.current();
    },
    [cleanup],
  );

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setPlaying(false);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
    }
  }, []);

  const stop = useCallback(() => {
    cleanup();
  }, [cleanup]);

  return { playing, loading, error, currentTime, duration, play, playSegments, pause, stop };
}

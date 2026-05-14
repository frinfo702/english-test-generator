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
  playbackRate: number;
  setPlaybackRate: (rate: number) => void;
  play: (text: string, voiceId?: string) => Promise<void>;
  playSegments: (segments: AudioSegment[]) => Promise<void>;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  seek: (time: number) => void;
}

// ---------- AudioBuffer helpers ----------

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!sharedAudioCtx) {
    sharedAudioCtx = new AudioContext();
  }
  return sharedAudioCtx;
}

async function fetchAndDecodeAudio(text: string, voiceId: string): Promise<AudioBuffer> {
  const response = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, voice_id: voiceId }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || `TTS request failed (${response.status})`);
  }
  const arrayBuffer = await response.arrayBuffer();
  const ctx = getAudioContext();
  if (ctx.state === "suspended") {
    await ctx.resume();
  }
  return ctx.decodeAudioData(arrayBuffer.slice(0));
}

function concatenateAudioBuffers(buffers: AudioBuffer[]): AudioBuffer {
  const totalLength = buffers.reduce((sum, buf) => sum + buf.length, 0);
  const sampleRate = buffers[0].sampleRate;
  const numberOfChannels = buffers[0].numberOfChannels;
  const ctx = getAudioContext();
  const result = ctx.createBuffer(numberOfChannels, totalLength, sampleRate);

  for (let channel = 0; channel < numberOfChannels; channel++) {
    const resultData = result.getChannelData(channel);
    let offset = 0;
    for (const buf of buffers) {
      resultData.set(buf.getChannelData(channel), offset);
      offset += buf.length;
    }
  }
  return result;
}

function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const dataLength = buffer.length * blockAlign;
  const headerLength = 44;
  const arrayBuffer = new ArrayBuffer(headerLength + dataLength);
  const view = new DataView(arrayBuffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataLength, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // 16-bit
  writeString(36, "data");
  view.setUint32(40, dataLength, true);

  const offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(ch)[i]));
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset + (i * numChannels + ch) * bytesPerSample, intSample, true);
    }
  }

  return new Blob([arrayBuffer], { type: "audio/wav" });
}

// ---------- Hook ----------

export function useTts(): UseTtsReturn {
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);
  const rafRef = useRef<number>(0);
  const playbackRateRef = useRef(1.0);
  const [playbackRate, setPlaybackRateState] = useState(1.0);

  const cleanup = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
    if (audioRef.current) {
      const audio = audioRef.current;
      audio.pause();
      // Detach event handlers so stale errors don't fire after cleanup
      audio.onended = null;
      audio.onerror = null;
      audio.src = "";
      audioRef.current = null;
    }
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
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
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
    rafRef.current = requestAnimationFrame(tick);
  }, []);

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
        audio.playbackRate = playbackRateRef.current;
        audioRef.current = audio;
        audio.onended = () => {
          setPlaying(false);
          if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = 0;
          }
        };
        audio.onerror = () => {
          setPlaying(false);
          setError("Audio playback error");
          setLoading(false);
        };
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
      setLoading(true);
      try {
        const buffers = await Promise.all(
          segments.map(async (segment) => {
            const voiceId = getVoiceForRole(segment.role);
            return fetchAndDecodeAudio(segment.text, voiceId);
          }),
        );

        const combinedBuffer = concatenateAudioBuffers(buffers);
        const wavBlob = audioBufferToWavBlob(combinedBuffer);
        const url = URL.createObjectURL(wavBlob);
        urlRef.current = url;

        const audio = new Audio(url);
        audio.playbackRate = playbackRateRef.current;
        audioRef.current = audio;

        audio.onended = () => {
          setPlaying(false);
          if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = 0;
          }
        };
        audio.onerror = () => {
          setPlaying(false);
          setError("Audio playback error");
          setLoading(false);
        };

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

  const resume = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRateRef.current;
      audioRef.current.play().then(() => {
        setPlaying(true);
        setError(null);
        if (!rafRef.current) {
          rafRef.current = requestAnimationFrame(tick);
        }
      }).catch(() => {
        setError("Resume failed");
      });
    }
  }, [tick]);

  const stop = useCallback(() => {
    cleanup();
  }, [cleanup]);

  const setPlaybackRate = useCallback((rate: number) => {
    playbackRateRef.current = rate;
    setPlaybackRateState(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  }, []);

  const seek = useCallback((time: number) => {
    if (audioRef.current && Number.isFinite(time)) {
      const audio = audioRef.current;
      const maxTime = audio.duration || 0;
      audio.currentTime = Math.max(0, Math.min(time, maxTime));
      setCurrentTime(audio.currentTime);
    }
  }, []);

  return { playing, loading, error, currentTime, duration, playbackRate, setPlaybackRate, play, playSegments, pause, resume, stop, seek };
}

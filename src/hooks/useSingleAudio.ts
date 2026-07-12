import { useCallback, useState } from "react";
import { useTts } from "./useTts";

/**
 * Adapter over useTts for pages that play one clip at a time,
 * identified by a stable string key (usually the audio URL or role).
 */
export function useSingleAudio() {
  const {
    playing,
    loading,
    error,
    currentTime,
    duration,
    playbackRate,
    setPlaybackRate,
    play: playUrl,
    pause,
    resume,
    stop: stopTts,
    seek,
  } = useTts();
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const isActive = useCallback((key: string) => activeKey === key, [activeKey]);

  const play = useCallback(
    (key: string, url: string, onEnded?: () => void) => {
      setActiveKey(key);
      void playUrl(url, onEnded);
    },
    [playUrl],
  );

  const toggle = useCallback(
    (key: string, url: string, onEnded?: () => void) => {
      if (playing && activeKey === key) {
        pause();
        return;
      }
      if (activeKey === key && currentTime > 0) {
        resume();
        return;
      }
      setActiveKey(key);
      void playUrl(url, onEnded);
    },
    [playing, activeKey, currentTime, pause, resume, playUrl],
  );

  const stop = useCallback(() => {
    stopTts();
    setActiveKey(null);
  }, [stopTts]);

  return {
    playing,
    loading,
    error,
    currentTime,
    duration,
    playbackRate,
    setPlaybackRate,
    seek,
    activeKey,
    isActive,
    play,
    toggle,
    stop,
  };
}

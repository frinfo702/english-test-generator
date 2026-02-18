import { useCallback, useEffect, useRef, useState } from "react";
import { formatSecondsAsMmSs } from "../lib/time";

export function useElapsedTimer() {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [running, setRunning] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const baseSecondsRef = useRef(0);

  const clear = useCallback(() => {
    if (!intervalRef.current) return;
    clearInterval(intervalRef.current);
    intervalRef.current = null;
  }, []);

  const sync = useCallback(() => {
    if (startedAtRef.current == null) return baseSecondsRef.current;
    const total =
      baseSecondsRef.current +
      Math.floor((Date.now() - startedAtRef.current) / 1000);
    setElapsedSeconds(total);
    return total;
  }, []);

  const start = useCallback(() => {
    if (startedAtRef.current != null) return;
    startedAtRef.current = Date.now();
    setRunning(true);
    setElapsedSeconds(baseSecondsRef.current);
  }, []);

  const stop = useCallback(() => {
    if (startedAtRef.current == null) return baseSecondsRef.current;
    const total =
      baseSecondsRef.current +
      Math.floor((Date.now() - startedAtRef.current) / 1000);
    baseSecondsRef.current = total;
    startedAtRef.current = null;
    setElapsedSeconds(total);
    setRunning(false);
    clear();
    return total;
  }, [clear]);

  const reset = useCallback(() => {
    startedAtRef.current = null;
    baseSecondsRef.current = 0;
    setElapsedSeconds(0);
    setRunning(false);
    clear();
  }, [clear]);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(sync, 1000);
    sync();
    return clear;
  }, [running, sync, clear]);

  useEffect(() => clear, [clear]);

  return {
    elapsedSeconds,
    display: formatSecondsAsMmSs(elapsedSeconds),
    running,
    start,
    stop,
    reset,
  };
}

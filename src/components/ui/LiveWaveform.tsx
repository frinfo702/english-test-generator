import { useEffect, useRef } from "react";
import styles from "./LiveWaveform.module.css";

export interface LiveWaveformProps {
  /** Actively listen to the microphone and visualise the input. */
  active?: boolean;
  /** Show the animated "working" wave while not listening. */
  processing?: boolean;
  deviceId?: string;
  barWidth?: number;
  minBarHeight?: number;
  barGap?: number;
  barRadius?: number;
  barColor?: string;
  fadeEdges?: boolean;
  fadeWidth?: number;
  height?: string | number;
  sensitivity?: number;
  smoothingTimeConstant?: number;
  fftSize?: number;
  historySize?: number;
  updateRate?: number;
  mode?: "scrolling" | "static";
  onError?: (error: Error) => void;
  onStreamReady?: (stream: MediaStream) => void;
  onStreamEnd?: () => void;
  className?: string;
  ariaLabel?: string;
}

/**
 * Canvas-based real-time waveform. Ported from ElevenLabs UI (MIT) to the
 * app's CSS-module + token system; visual behaviour kept intact.
 */
export function LiveWaveform({
  active = false,
  processing = false,
  deviceId,
  barWidth = 3,
  minBarHeight = 4,
  barGap = 1,
  barRadius = 1.5,
  barColor,
  fadeEdges = true,
  fadeWidth = 24,
  height = 64,
  sensitivity = 1,
  smoothingTimeConstant = 0.8,
  fftSize = 256,
  historySize = 60,
  updateRate = 30,
  mode = "static",
  onError,
  onStreamReady,
  onStreamEnd,
  className,
  ariaLabel,
}: LiveWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<number[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number>(0);
  const lastUpdateRef = useRef<number>(0);
  const processingAnimationRef = useRef<number | null>(null);
  const lastActiveDataRef = useRef<number[]>([]);
  const transitionProgressRef = useRef(0);
  const staticBarsRef = useRef<number[]>([]);
  const needsRedrawRef = useRef(true);
  const gradientCacheRef = useRef<CanvasGradient | null>(null);
  const lastWidthRef = useRef(0);

  const heightStyle = typeof height === "number" ? `${height}px` : height;

  const callbacksRef = useRef({ onError, onStreamReady, onStreamEnd });
  useEffect(() => {
    callbacksRef.current = { onError, onStreamReady, onStreamEnd };
  }, [onError, onStreamReady, onStreamEnd]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      gradientCacheRef.current = null;
      lastWidthRef.current = rect.width;
      needsRedrawRef.current = true;
    };

    resize();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", resize);
      return () => window.removeEventListener("resize", resize);
    }
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (processing && !active) {
      let time = 0;
      transitionProgressRef.current = 0;

      const animateProcessing = () => {
        time += 0.03;
        transitionProgressRef.current = Math.min(
          1,
          transitionProgressRef.current + 0.02,
        );

        const width = containerRef.current?.getBoundingClientRect().width ?? 200;
        const barCount = Math.floor(width / (barWidth + barGap));
        const data: number[] = [];

        if (mode === "static") {
          const halfCount = Math.floor(barCount / 2);
          for (let i = 0; i < barCount; i++) {
            const position = (i - halfCount) / halfCount;
            const centerWeight = 1 - Math.abs(position) * 0.4;
            const wave =
              Math.sin(time * 1.5 + position * 3) * 0.25 +
              Math.sin(time * 0.8 - position * 2) * 0.2 +
              Math.cos(time * 2 + position) * 0.15;
            const value = (0.2 + wave) * centerWeight;
            let finalValue = value;
            if (
              lastActiveDataRef.current.length > 0 &&
              transitionProgressRef.current < 1
            ) {
              const last = lastActiveDataRef.current[
                Math.min(i, lastActiveDataRef.current.length - 1)
              ];
              finalValue =
                (last || 0) * (1 - transitionProgressRef.current) +
                value * transitionProgressRef.current;
            }
            data.push(Math.max(0.05, Math.min(1, finalValue)));
          }
        } else {
          for (let i = 0; i < barCount; i++) {
            const position = (i - barCount / 2) / (barCount / 2);
            const centerWeight = 1 - Math.abs(position) * 0.4;
            const wave =
              Math.sin(time * 1.5 + i * 0.15) * 0.25 +
              Math.sin(time * 0.8 - i * 0.1) * 0.2 +
              Math.cos(time * 2 + i * 0.05) * 0.15;
            const value = (0.2 + wave) * centerWeight;
            let finalValue = value;
            if (
              lastActiveDataRef.current.length > 0 &&
              transitionProgressRef.current < 1
            ) {
              const idx = Math.floor(
                (i / barCount) * lastActiveDataRef.current.length,
              );
              finalValue =
                (lastActiveDataRef.current[idx] || 0) *
                  (1 - transitionProgressRef.current) +
                value * transitionProgressRef.current;
            }
            data.push(Math.max(0.05, Math.min(1, finalValue)));
          }
        }

        if (mode === "static") {
          staticBarsRef.current = data;
        } else {
          historyRef.current = data;
        }

        needsRedrawRef.current = true;
        processingAnimationRef.current = requestAnimationFrame(animateProcessing);
      };

      animateProcessing();

      return () => {
        if (processingAnimationRef.current) {
          cancelAnimationFrame(processingAnimationRef.current);
        }
      };
    }

    if (!active && !processing) {
      const hasData =
        mode === "static"
          ? staticBarsRef.current.length > 0
          : historyRef.current.length > 0;
      if (!hasData) return;

      let fade = 0;
      let raf = 0;
      const fadeToIdle = () => {
        fade += 0.03;
        if (fade < 1) {
          const next = (value: number) => value * (1 - fade);
          if (mode === "static") {
            staticBarsRef.current = staticBarsRef.current.map(next);
          } else {
            historyRef.current = historyRef.current.map(next);
          }
          needsRedrawRef.current = true;
          raf = requestAnimationFrame(fadeToIdle);
        } else {
          if (mode === "static") staticBarsRef.current = [];
          else historyRef.current = [];
        }
      };
      fadeToIdle();
      return () => cancelAnimationFrame(raf);
    }
  }, [processing, active, barWidth, barGap, mode]);

  useEffect(() => {
    const teardown = () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        callbacksRef.current.onStreamEnd?.();
      }
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        void audioContextRef.current.close();
        audioContextRef.current = null;
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = 0;
      }
    };

    if (!active) {
      teardown();
      return;
    }

    let cancelled = false;

    const setupMicrophone = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: deviceId
            ? {
                deviceId: { exact: deviceId },
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
              }
            : {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
              },
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        callbacksRef.current.onStreamReady?.(stream);

        const AudioContextConstructor =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        const audioContext = new AudioContextConstructor();
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = fftSize;
        analyser.smoothingTimeConstant = smoothingTimeConstant;
        audioContext.createMediaStreamSource(stream).connect(analyser);
        audioContextRef.current = audioContext;
        analyserRef.current = analyser;
        historyRef.current = [];
      } catch (error) {
        callbacksRef.current.onError?.(error as Error);
      }
    };

    void setupMicrophone();

    return () => {
      cancelled = true;
      teardown();
    };
  }, [active, deviceId, fftSize, smoothingTimeConstant]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId = 0;

    const onVisibilityChange = () => {
      if (document.visibilityState !== "visible") return;
      void audioContextRef.current?.resume?.().catch(() => undefined);
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(animate);
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    const animate = (currentTime: number) => {
      const rect = canvas.getBoundingClientRect();

      // Browsers suspend the context when the page is backgrounded or audio
      // focus moves; without resuming, the waveform flatlines permanently.
      const audioContext = audioContextRef.current;
      if (active && audioContext && audioContext.state !== "running") {
        void audioContext.resume().catch(() => undefined);
      }

      if (active && currentTime - lastUpdateRef.current > updateRate) {
        lastUpdateRef.current = currentTime;

        if (analyserRef.current) {
          const dataArray = new Uint8Array(
            analyserRef.current.frequencyBinCount,
          );
          analyserRef.current.getByteFrequencyData(dataArray);

          const startFreq = Math.floor(dataArray.length * 0.05);
          const endFreq = Math.floor(dataArray.length * 0.4);
          const relevantData = dataArray.slice(startFreq, endFreq);

          if (mode === "static") {
            const barCount = Math.floor(rect.width / (barWidth + barGap));
            const halfCount = Math.floor(barCount / 2);
            const bars: number[] = [];
            for (let i = halfCount - 1; i >= 0; i--) {
              const value = Math.min(
                1,
                (relevantData[Math.floor((i / halfCount) * relevantData.length)] /
                  255) *
                  sensitivity,
              );
              bars.push(Math.max(0.05, value));
            }
            for (let i = 0; i < halfCount; i++) {
              const value = Math.min(
                1,
                (relevantData[Math.floor((i / halfCount) * relevantData.length)] /
                  255) *
                  sensitivity,
              );
              bars.push(Math.max(0.05, value));
            }
            staticBarsRef.current = bars;
            lastActiveDataRef.current = bars;
          } else {
            let sum = 0;
            for (let i = 0; i < relevantData.length; i++) sum += relevantData[i];
            const average = (sum / relevantData.length / 255) * sensitivity;
            historyRef.current.push(Math.min(1, Math.max(0.05, average)));
            lastActiveDataRef.current = [...historyRef.current];
            if (historyRef.current.length > historySize) {
              historyRef.current.shift();
            }
          }
          needsRedrawRef.current = true;
        }
      }

      if (!needsRedrawRef.current && !active) {
        rafId = requestAnimationFrame(animate);
        return;
      }

      needsRedrawRef.current = active;
      ctx.clearRect(0, 0, rect.width, rect.height);

      const computedBarColor =
        barColor ||
        (() => {
          const style = getComputedStyle(canvas);
          return style.color || "#000";
        })();

      const step = barWidth + barGap;
      const barCount = Math.floor(rect.width / step);
      const centerY = rect.height / 2;

      const bars = mode === "static" ? staticBarsRef.current : historyRef.current;

      for (let i = 0; i < barCount && i < bars.length; i++) {
        const index = mode === "static" ? i : bars.length - 1 - i;
        const value = bars[index] || 0.1;
        const x = mode === "static" ? i * step : rect.width - (i + 1) * step;
        const barHeight = Math.max(minBarHeight, value * rect.height * 0.8);
        const y = centerY - barHeight / 2;

        ctx.fillStyle = computedBarColor;
        ctx.globalAlpha = 0.4 + value * 0.6;
        if (barRadius > 0) {
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, barRadius);
          ctx.fill();
        } else {
          ctx.fillRect(x, y, barWidth, barHeight);
        }
      }

      if (fadeEdges && fadeWidth > 0 && rect.width > 0) {
        if (!gradientCacheRef.current || lastWidthRef.current !== rect.width) {
          const gradient = ctx.createLinearGradient(0, 0, rect.width, 0);
          const fadePercent = Math.min(0.3, fadeWidth / rect.width);
          gradient.addColorStop(0, "rgba(255,255,255,1)");
          gradient.addColorStop(fadePercent, "rgba(255,255,255,0)");
          gradient.addColorStop(1 - fadePercent, "rgba(255,255,255,0)");
          gradient.addColorStop(1, "rgba(255,255,255,1)");
          gradientCacheRef.current = gradient;
          lastWidthRef.current = rect.width;
        }
        ctx.globalCompositeOperation = "destination-out";
        ctx.fillStyle = gradientCacheRef.current;
        ctx.fillRect(0, 0, rect.width, rect.height);
        ctx.globalCompositeOperation = "source-over";
      }

      ctx.globalAlpha = 1;
      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      cancelAnimationFrame(rafId);
    };
  }, [
    active,
    processing,
    sensitivity,
    updateRate,
    historySize,
    barWidth,
    minBarHeight,
    barGap,
    barRadius,
    barColor,
    fadeEdges,
    fadeWidth,
    mode,
  ]);

  return (
    <div
      className={[styles.container, className].filter(Boolean).join(" ")}
      ref={containerRef}
      style={{ height: heightStyle }}
      role="img"
      aria-label={
        ariaLabel ??
        (active
          ? "Live audio waveform"
          : processing
            ? "Processing audio"
            : "Audio waveform idle")
      }
    >
      {!active && !processing && <div className={styles.idleRule} />}
      <canvas className={styles.canvas} ref={canvasRef} aria-hidden="true" />
    </div>
  );
}

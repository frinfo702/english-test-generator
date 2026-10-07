export interface TimedWord {
  word: string;
  /** Seconds from the start of the recording. */
  start: number;
  end: number;
}

export interface SpeedMetrics {
  words: number;
  /** Words per minute over the span from first to last word. */
  speakingRate: number;
  /** Words per minute over voiced time only (pauses removed). */
  articulationRate: number;
  longPausesPerMinute: number;
  meanLengthOfRun: number;
}

// SpeechRater-style threshold; shorter gaps are normal word boundaries.
const LONG_PAUSE_SECONDS = 0.5;

/** Each inner array is one recording; offsets restart at 0 in each. */
export function computeSpeedMetrics(utterances: TimedWord[][]): SpeedMetrics {
  let words = 0;
  let spanSeconds = 0;
  let voicedSeconds = 0;
  let longPauses = 0;
  let runs = 0;

  for (const utterance of utterances) {
    if (utterance.length === 0) continue;
    words += utterance.length;
    spanSeconds += utterance[utterance.length - 1].end - utterance[0].start;
    runs += 1;
    utterance.forEach((w, i) => {
      voicedSeconds += w.end - w.start;
      if (i > 0 && w.start - utterance[i - 1].end >= LONG_PAUSE_SECONDS) {
        longPauses += 1;
        runs += 1;
      }
    });
  }

  const perMinute = (n: number, seconds: number) =>
    seconds > 0 ? (n / seconds) * 60 : 0;
  return {
    words,
    speakingRate: perMinute(words, spanSeconds),
    articulationRate: perMinute(words, voicedSeconds),
    longPausesPerMinute: perMinute(longPauses, spanSeconds),
    meanLengthOfRun: runs > 0 ? words / runs : 0,
  };
}

const TARGET_WPM_MIN = 130;
const TARGET_WPM_MAX = 160;
const ZERO_SCORE_WPM_SLOW = 60;
const ZERO_SCORE_WPM_FAST = 220;
// About one breath pause per sentence is natural, so only pauses beyond that
// cost points.
const FREE_LONG_PAUSES_PER_MINUTE = 4;
const POINTS_PER_EXTRA_PAUSE = 5;

/**
 * Maps metrics to the 0–100 "Needs Work → On Target" bar. Scores a band
 * rather than "faster is better": rushing past ~160 wpm hurts clarity.
 */
export function speedScore(metrics: SpeedMetrics): number {
  if (metrics.words === 0) return 0;
  const wpm = metrics.speakingRate;
  const rate =
    wpm < TARGET_WPM_MIN
      ? (wpm - ZERO_SCORE_WPM_SLOW) / (TARGET_WPM_MIN - ZERO_SCORE_WPM_SLOW)
      : wpm > TARGET_WPM_MAX
        ? (ZERO_SCORE_WPM_FAST - wpm) / (ZERO_SCORE_WPM_FAST - TARGET_WPM_MAX)
        : 1;
  const pausePenalty =
    Math.max(0, metrics.longPausesPerMinute - FREE_LONG_PAUSES_PER_MINUTE) *
    POINTS_PER_EXTRA_PAUSE;
  return Math.min(100, Math.max(0, rate * 100 - pausePenalty));
}

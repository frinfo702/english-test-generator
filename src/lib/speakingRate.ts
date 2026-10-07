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

/** Maps metrics to the 0–100 "Needs Work → On Target" bar. */
export function speedScore(metrics: SpeedMetrics): number {
  // TODO(human)
  return 0;
}

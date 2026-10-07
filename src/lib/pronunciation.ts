import type { TimedWord } from "./speakingRate";

export interface AssessedWord extends TimedWord {
  accuracy: number;
  errorType: "None" | "Omission" | "Insertion" | "Mispronunciation" | string;
}

export interface PronunciationResult {
  recognized: string;
  pronunciation: number;
  accuracy: number;
  fluency: number;
  completeness: number;
  prosody: number | null;
  words: AssessedWord[];
}

interface AzureWordScores {
  AccuracyScore?: number;
  ErrorType?: string;
}

interface AzureWord extends AzureWordScores {
  Word: string;
  Offset?: number;
  Duration?: number;
  PronunciationAssessment?: AzureWordScores;
}

interface AzureScores {
  AccuracyScore?: number;
  FluencyScore?: number;
  CompletenessScore?: number;
  ProsodyScore?: number;
  PronScore?: number;
}

interface AzureResponse {
  RecognitionStatus: string;
  NBest?: (AzureScores & {
    Display?: string;
    PronunciationAssessment?: AzureScores;
    Words?: AzureWord[];
  })[];
}

const TICKS_PER_SECOND = 10_000_000;

export function parseAzureAssessment(raw: AzureResponse): PronunciationResult {
  const best = raw.NBest?.[0];
  if (raw.RecognitionStatus !== "Success" || !best) {
    throw new Error(`Speech not recognized (${raw.RecognitionStatus}).`);
  }
  // The REST API puts scores on the result itself; the SDK nests them.
  const scores = best.PronunciationAssessment ?? best;
  return {
    recognized: best.Display ?? "",
    pronunciation: scores.PronScore ?? 0,
    accuracy: scores.AccuracyScore ?? 0,
    fluency: scores.FluencyScore ?? 0,
    completeness: scores.CompletenessScore ?? 0,
    prosody: scores.ProsodyScore ?? null,
    words: (best.Words ?? []).map((w) => {
      const start = (w.Offset ?? 0) / TICKS_PER_SECOND;
      const wordScores = w.PronunciationAssessment ?? w;
      return {
        word: w.Word,
        start,
        end: start + (w.Duration ?? 0) / TICKS_PER_SECOND,
        accuracy: wordScores.AccuracyScore ?? 0,
        errorType: wordScores.ErrorType ?? "None",
      };
    }),
  };
}

// Azure gives omitted words no timing, so they'd read as 0-second words.
export function spokenWords(result: PronunciationResult): AssessedWord[] {
  return result.words.filter((w) => w.errorType !== "Omission");
}

/** Word-weighted, so a two-word fragment can't drag down a long answer. */
export function mergeAssessments(
  segments: PronunciationResult[],
): PronunciationResult {
  const totalWords = segments.reduce((n, s) => n + s.words.length, 0);
  const weighted = (pick: (s: PronunciationResult) => number) =>
    totalWords > 0
      ? segments.reduce((sum, s) => sum + pick(s) * s.words.length, 0) /
        totalWords
      : 0;
  const withProsody = segments.filter((s) => s.prosody !== null);
  return {
    recognized: segments.map((s) => s.recognized).join(" "),
    pronunciation: weighted((s) => s.pronunciation),
    accuracy: weighted((s) => s.accuracy),
    fluency: weighted((s) => s.fluency),
    completeness: weighted((s) => s.completeness),
    prosody:
      withProsody.length === segments.length
        ? weighted((s) => s.prosody ?? 0)
        : null,
    words: segments.flatMap((s) => s.words),
  };
}

const env = typeof import.meta !== "undefined" ? import.meta.env : undefined;
const PRONUNCIATION_API_URL =
  (env?.VITE_PRONUNCIATION_API_URL as string | undefined) ??
  "/api/pronunciation";

export async function assessPronunciation(
  wav: Blob,
  referenceText: string,
): Promise<PronunciationResult> {
  const formData = new FormData();
  formData.append("referenceText", referenceText);
  formData.append("audio", wav, "recording.wav");
  const response = await fetch(PRONUNCIATION_API_URL, {
    method: "POST",
    body: formData,
  });
  const body = (await response.json().catch(() => ({}))) as
    PronunciationResult | { error?: string };
  if (!response.ok || "error" in body) {
    throw new Error(
      ("error" in body && body.error) ||
        `Pronunciation request failed (${response.status})`,
    );
  }
  return body as PronunciationResult;
}

import type { PronunciationResult } from "./pronunciation";
import { computeSpeedMetrics, speedScore } from "./speakingRate";

export interface AiInterviewScores {
  languageUse: number;
  organization: number;
}

export interface InterviewItemScore extends Partial<AiInterviewScores> {
  intelligibility?: number;
  fluency?: number;
  /** 0–5 integer, like an ETS item score. */
  total: number;
}

export const AI_SCORE_FENCE = "toefl-score";

function lastScore(text: string, key: string): number | null {
  // Matches `"key": 4`, `key: 4` and `key = 4`, since a reply copied as
  // plain text loses the code fence and sometimes the JSON quoting.
  const matches = [
    ...text.matchAll(
      new RegExp(`"?${key}"?\\s*[:=]\\s*(\\d(?:\\.\\d+)?)`, "gi"),
    ),
  ];
  const value = matches.length > 0 ? Number(matches.at(-1)![1]) : null;
  return value !== null && value >= 0 && value <= 5 ? value : null;
}

export function parseAiScores(reply: string): AiInterviewScores {
  const languageUse = lastScore(reply, "languageUse");
  const organization = lastScore(reply, "organization");
  if (languageUse === null || organization === null) {
    throw new Error(
      `Couldn't find the ${AI_SCORE_FENCE} block. Paste the whole AI reply, including "languageUse" and "organization".`,
    );
  }
  return { languageUse, organization };
}

export function deliveryScores(assessment: PronunciationResult): {
  intelligibility: number;
  fluency: number;
} {
  const speed = speedScore(computeSpeedMetrics([assessment.words]));
  return {
    intelligibility: assessment.pronunciation / 20,
    fluency: (assessment.fluency + speed) / 2 / 20,
  };
}

/**
 * Equal weight across ETS's four Interview constructs: the AI reads the
 * transcript for language use and organization, Azure hears intelligibility
 * and fluency. Either half may be missing while the other is pending.
 */
export function interviewItemScore(
  ai: AiInterviewScores | null,
  assessment: PronunciationResult | null,
): InterviewItemScore | null {
  if (!ai && !assessment) return null;
  const delivery = assessment ? deliveryScores(assessment) : null;
  const parts = [
    ai?.languageUse,
    ai?.organization,
    delivery?.intelligibility,
    delivery?.fluency,
  ].filter((v): v is number => v !== undefined);
  // Rubric 0: content unconnected to the question, however well it sounds.
  const offTopic = ai?.organization === 0;
  return {
    ...ai,
    ...delivery,
    total: offTopic
      ? 0
      : Math.round(parts.reduce((a, b) => a + b, 0) / parts.length),
  };
}

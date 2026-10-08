import { rubricScore, type Attempt } from "./attempts";
import type { PronunciationResult } from "./pronunciation";
import { computeSpeedMetrics, speedScore } from "./speakingRate";

export interface AiInterviewScores {
  languageUse: number;
  organization: number;
}

/** Facets are 0–100; only `total` is on the 0–5 rubric. */
export interface InterviewItemScore {
  languageUse?: number;
  organization?: number;
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

export function parseWritingScore(reply: string): number {
  const score = lastScore(reply, "score");
  if (score === null) {
    throw new Error(
      `Couldn't find the ${AI_SCORE_FENCE} block. Paste the whole AI reply, including "score".`,
    );
  }
  return score;
}

export function withInterviewAi(
  attempt: Attempt,
  index: number,
  ai: { reply: string; scores: AiInterviewScores },
): Attempt {
  const responses = attempt.responses.map((r, i) =>
    i === index
      ? {
          ...r,
          ai,
          itemScore: interviewItemScore(ai.scores, r.assessment ?? null)?.total,
        }
      : r,
  );
  return { ...attempt, responses, score: rubricScore(responses) };
}

export function withWritingAi(
  attempt: Attempt,
  ai: { reply: string; scores: number },
): Attempt {
  const responses = attempt.responses.map((r, i) =>
    i === 0 ? { ...r, aiReply: ai.reply, itemScore: ai.scores } : r,
  );
  return { ...attempt, responses, score: rubricScore(responses) };
}

/** The score block is for the parser; readers only need the feedback. */
export function stripScoreBlock(reply: string): string {
  return reply
    .replace(new RegExp("```" + AI_SCORE_FENCE + "[\\s\\S]*?```", "g"), "")
    .trim();
}

export function deliveryScores(assessment: PronunciationResult): {
  intelligibility: number;
  fluency: number;
} {
  const speed = speedScore(computeSpeedMetrics([assessment.words]));
  return {
    intelligibility: assessment.pronunciation,
    fluency: (assessment.fluency + speed) / 2,
  };
}

/**
 * Equal weight across ETS's four Interview constructs: the AI reads the
 * transcript for language use and organization, Azure hears intelligibility
 * and fluency. Either half may be missing while the other is pending.
 *
 * Facets are 0–100 diagnostics (ETS scores only the whole response); the AI
 * still rates on the 0–5 rubric, whose levels have descriptors, and is scaled
 * here rather than asked for 0–100 numbers with nothing to anchor them.
 */
export function interviewItemScore(
  ai: AiInterviewScores | null,
  assessment: PronunciationResult | null,
): InterviewItemScore | null {
  if (!ai && !assessment) return null;
  const content = ai
    ? { languageUse: ai.languageUse * 20, organization: ai.organization * 20 }
    : null;
  const delivery = assessment ? deliveryScores(assessment) : null;
  const parts = [
    content?.languageUse,
    content?.organization,
    delivery?.intelligibility,
    delivery?.fluency,
  ].filter((v): v is number => v !== undefined);
  // Rubric 0: content unconnected to the question, however well it sounds.
  const offTopic = ai?.organization === 0;
  return {
    ...content,
    ...delivery,
    total: offTopic
      ? 0
      : Math.round(parts.reduce((a, b) => a + b, 0) / parts.length / 20),
  };
}

/**
 * Scores the sample answers in scripts/jev-samples.json several times with
 * the app's current LLM scoring (same prompt, same parser) and with Jev, then
 * reports each model's spread and how close their mean scores are.
 * Usage: npm run compare-jev [-- tolerance runs]
 *   tolerance: max gap between mean scores still counted as "same" (default 0.5)
 *   runs:      scorings per model per sample (default 5)
 * Needs AI_GATEWAY_API_KEY in .env.local (the same key the app uses).
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { readFileSync } from "node:fs";
import {
  DEFAULT_MODEL,
  JEV_LANGUAGE_USE,
  JEV_MODEL as JEV,
  scoreWithGateway,
} from "../src/lib/aiGateway.ts";
import {
  buildInterviewQaCopyMessage,
  buildWritingTaskMessage,
} from "../src/lib/answerSubmission.ts";
import {
  parseAiScores,
  parseWritingScore,
} from "../src/lib/interviewScoring.ts";
import {
  INTERVIEW_TYPE_LABELS,
  type InterviewProblemData,
} from "../src/pages/toefl/speaking/interviewTypes.ts";

// Lowest to highest, so Jev's interpolated score is directly on the 0–5 scale.
const LEVELS = {
  writing: [
    "0: blank, off-topic, or not in English",
    "1: very little relevant content; errors make most of it unclear",
    "2: limited response; ideas undeveloped and frequent errors obscure meaning",
    "3: mostly relevant but partly developed; noticeable errors in grammar and word choice",
    "4: relevant and well developed; good variety of language with only minor errors",
    "5: fully relevant, well elaborated and clearly organized; precise, varied language with almost no errors",
  ],
  languageUse: JEV_LANGUAGE_USE.criteria,
  organization: [
    "0: no response or unconnected to the question",
    "1: barely addresses the question; no development",
    "2: addresses the question with little elaboration or connection between ideas",
    "3: relevant with some reasons or examples; connections are sometimes unclear",
    "4: relevant and elaborated with reasons or examples; ideas connect clearly",
    "5: fully relevant, well elaborated, and smoothly connected",
  ],
};

const INSTRUCTIONS: Record<keyof typeof LEVELS, string> = {
  writing:
    "Rate this TOEFL Writing response on the official 0–5 scale: task completion, elaboration, organization, and range and accuracy of grammar and vocabulary.",
  languageUse: JEV_LANGUAGE_USE.instructions,
  organization:
    "Rate the spoken answer (a speech-recognition transcript: ignore punctuation and capitalization) for relevance to the question, elaboration with reasons or examples, and connectors.",
};

interface Sample {
  task: "email" | "discussion" | "interview";
  file: string;
  q?: number;
  /** The level the sample was written to, shown for context only. */
  level: number;
  answer: string;
}

type Scores = Record<string, number>;

const question = (s: Sample) =>
  JSON.parse(
    readFileSync(
      `public/questions/toefl/${s.task === "interview" ? "speaking" : "writing"}/${s.task}/${s.file}`,
      "utf8",
    ),
  );

function llmPrompt(s: Sample): string {
  if (s.task !== "interview")
    return buildWritingTaskMessage(
      `toefl/writing/${s.task}`,
      question(s),
      s.answer,
    );
  const q = (question(s) as InterviewProblemData).questions[s.q!];
  return buildInterviewQaCopyMessage({
    question: q.question,
    userAnswer: s.answer,
    modelAnswer: q.modelAnswer,
    evaluationPoints: q.evaluationPoints,
    questionType: INTERVIEW_TYPE_LABELS[q.type] ?? q.type,
  });
}

/** Null when the reply has no score block, which the app would show as an error too. */
async function scoreWithLlm(s: Sample, key: string): Promise<Scores | null> {
  const reply = await scoreWithGateway(llmPrompt(s), {
    key,
    model: DEFAULT_MODEL,
  });
  try {
    return s.task === "interview"
      ? { ...parseAiScores(reply) }
      : { writing: parseWritingScore(reply) };
  } catch {
    console.log(
      `LLM gave no score: ${s.task} level ${s.level}: ${reply.slice(-200).replace(/\n/g, " ")}\n`,
    );
    return null;
  }
}

/** Jev gets the LLM's input minus its "How to score" text; the rubric goes in as levels. */
async function scoreWithJev(s: Sample, key: string): Promise<Scores> {
  const kinds: (keyof typeof LEVELS)[] =
    s.task === "interview" ? ["languageUse", "organization"] : ["writing"];
  const res = await fetch("https://ai-gateway.vercel.sh/v1/evaluate", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: JEV,
      state: llmPrompt(s).split("\n## How to score")[0],
      questions: Object.fromEntries(
        kinds.map((k) => [
          k,
          { type: "score", instructions: INSTRUCTIONS[k], criteria: LEVELS[k] },
        ]),
      ),
    }),
  });
  if (!res.ok) throw new Error(`Jev ${res.status}: ${await res.text()}`);
  const { answers } = (await res.json()) as {
    answers: Record<string, { score: number }>;
  };
  return Object.fromEntries(kinds.map((k) => [k, answers[k].score]));
}

async function timed<T>(run: () => Promise<T>): Promise<[T, number]> {
  const t = Date.now();
  return [await run(), Date.now() - t];
}

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const sd = (xs: number[]) =>
  Math.sqrt(mean(xs.map((x) => (x - mean(xs)) ** 2)));

/** Every run of one model on one sample; a failed run is logged and left out. */
async function repeat(
  runs: number,
  label: string,
  score: () => Promise<Scores | null>,
): Promise<{ scores: Scores[]; ms: number[] }> {
  const scores: Scores[] = [];
  const ms: number[] = [];
  for (let i = 0; i < runs; i++) {
    try {
      const [s, t] = await timed(score);
      if (s) {
        scores.push(s);
        ms.push(t);
      }
    } catch (e) {
      console.log(
        `failed run of ${label}: ${e instanceof Error ? e.message : e}`,
      );
    }
  }
  return { scores, ms };
}

async function main() {
  const tolerance = Number(process.argv[2] ?? 0.5);
  const runs = Number(process.argv[3] ?? 5);
  if (!Number.isFinite(tolerance) || !Number.isInteger(runs) || runs < 2)
    throw new Error(
      "Usage: npm run compare-jev [-- tolerance runs], e.g. 0.5 5",
    );
  const key = process.env.AI_GATEWAY_API_KEY;
  if (!key) throw new Error("AI_GATEWAY_API_KEY is not set (.env.local)");
  const samples: Sample[] = JSON.parse(
    readFileSync("scripts/jev-samples.json", "utf8"),
  );
  console.log(
    `Scoring ${samples.length} samples ${runs}× each with ${DEFAULT_MODEL} and ${JEV}…\n`,
  );

  // Four samples at a time, each one's calls in sequence: enough to finish in
  // minutes without timing a queue of our own requests.
  const results: {
    s: Sample;
    llm: Awaited<ReturnType<typeof repeat>>;
    jev: Awaited<ReturnType<typeof repeat>>;
  }[] = [];
  const queue = [...samples];
  await Promise.all(
    Array.from({ length: 4 }, async () => {
      for (let s = queue.shift(); s; s = queue.shift()) {
        const label = `${s.task} level ${s.level}`;
        const sample = s;
        const llm = await repeat(runs, `LLM on ${label}`, () =>
          scoreWithLlm(sample, key),
        );
        const jev = await repeat(runs, `Jev on ${label}`, () =>
          scoreWithJev(sample, key),
        );
        results.push({ s, llm, jev });
      }
    }),
  );
  results.sort((a, b) => samples.indexOf(a.s) - samples.indexOf(b.s));

  // Per score kind: LLM SDs, Jev SDs, Jev−LLM mean gaps
  const tally: Record<
    string,
    { llmSd: number[]; jevSd: number[]; gap: number[] }
  > = {};
  const fmt = (xs: number[]) => `${mean(xs).toFixed(2)} ±${sd(xs).toFixed(2)}`;
  console.log(
    `\ntask         level  kind          LLM mean ±SD   [runs]            Jev mean ±SD   [runs]                          Jev−LLM`,
  );
  for (const { s, llm, jev } of results) {
    if (llm.scores.length < 2 || jev.scores.length < 2) {
      console.log(`skipped ${s.task} level ${s.level}: fewer than 2 good runs`);
      continue;
    }
    for (const k of Object.keys(llm.scores[0])) {
      const l = llm.scores.map((x) => x[k]);
      const j = jev.scores.map((x) => x[k]);
      const t = (tally[k] ??= { llmSd: [], jevSd: [], gap: [] });
      t.llmSd.push(sd(l));
      t.jevSd.push(sd(j));
      t.gap.push(mean(j) - mean(l));
      const label = s.task + (s.q === undefined ? "" : ` q${s.q + 1}`);
      const gap = mean(j) - mean(l);
      console.log(
        `${label.padEnd(13)}${String(s.level).padStart(5)}  ${k.padEnd(13)}${fmt(l).padEnd(15)}${`[${l.join(" ")}]`.padEnd(18)}${fmt(j).padEnd(15)}${`[${j.map((x) => x.toFixed(2)).join(" ")}]`.padEnd(32)}${(gap >= 0 ? "+" : "") + gap.toFixed(2)}${Math.abs(gap) <= tolerance ? "" : "  DIFF"}`,
      );
    }
  }

  console.log(
    `\nSD = spread of one model's scores for the same answer; "same" = |Jev mean − LLM mean| ≤ ${tolerance}`,
  );
  console.log("kind          LLM avg SD   Jev avg SD   avg Jev−LLM   same");
  for (const [k, t] of Object.entries(tally)) {
    const same = t.gap.filter((g) => Math.abs(g) <= tolerance).length;
    console.log(
      `${k.padEnd(14)}${mean(t.llmSd).toFixed(2).padEnd(13)}${mean(t.jevSd).toFixed(2).padEnd(13)}${((mean(t.gap) >= 0 ? "+" : "") + mean(t.gap).toFixed(2)).padEnd(14)}${same}/${t.gap.length} (${Math.round((same / t.gap.length) * 100)}%)`,
    );
  }
  const ms = (pick: "llm" | "jev") =>
    (mean(results.flatMap((r) => r[pick].ms)) / 1000).toFixed(2);
  console.log(`\nmean latency per call: LLM ${ms("llm")}s, Jev ${ms("jev")}s`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});

import { useEffect, useMemo, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { PixelIcon } from "../../../components/pixel/PixelIcon";
import { ScorePips } from "../../../components/pixel/ScorePips";
import { NextQuestionButton } from "../../../components/question/NextQuestionButton";
import { Button } from "../../../components/ui/Button";
import { ProgressBar } from "../../../components/ui/ProgressBar";
import { useSingleAudio } from "../../../hooks/useSingleAudio";
import type { TaskId } from "../../../hooks/useScoreHistory";
import { buildInterviewQaCopyMessage } from "../../../lib/answerSubmission";
import {
  rubricScore,
  type Attempt,
  type ItemResponse,
} from "../../../lib/attempts";
import {
  interviewItemScore,
  stripScoreBlock,
  type AiInterviewScores,
} from "../../../lib/interviewScoring";
import { spokenWords } from "../../../lib/pronunciation";
import { computeSpeedMetrics, speedScore } from "../../../lib/speakingRate";
import { AiScorePanel } from "./AiScorePanel";
import {
  INTERVIEW_TYPE_LABELS,
  interviewAudioUrl,
  type InterviewProblemData,
} from "./interviewTypes";
import {
  alignWords,
  countCorrectWords,
  countOriginalWords,
} from "./listenRepeat";
import { DiffLegend, ListenRepeatDiffView } from "./ListenRepeatDiff";
import styles from "./SpeakingResult.module.css";

type Audio = ReturnType<typeof useSingleAudio>;

function average(values: number[]): number | null {
  return values.length > 0
    ? values.reduce((a, b) => a + b, 0) / values.length
    : null;
}

/** Recordings live in IndexedDB as Blobs; the player needs URLs. */
function useResponseUrls(responses: ItemResponse[]): (string | null)[] {
  const urls = useMemo(
    () => responses.map((r) => (r.audio ? URL.createObjectURL(r.audio) : null)),
    [responses],
  );
  useEffect(
    () => () => urls.forEach((u) => u && URL.revokeObjectURL(u)),
    [urls],
  );
  return urls;
}

function PlayButton({
  audio,
  id,
  url,
  label,
}: {
  audio: Audio;
  id: string;
  url: string | null;
  label: string;
}) {
  const active = audio.isActive(id) && audio.playing;
  return (
    <Button
      variant="secondary"
      size="sm"
      disabled={!url}
      aria-pressed={active}
      onClick={() => url && audio.toggle(id, url)}
    >
      {active ? "Pause" : label}
    </Button>
  );
}

function ResultHeader({
  attempt,
  title,
  itemScores,
  stats,
}: {
  attempt: Attempt;
  title: string;
  itemScores: (number | undefined)[];
  stats: { label: string; value: string }[];
}) {
  const navigate = useNavigate();
  const scored = itemScores.filter((s): s is number => s !== undefined);
  const avg = average(scored);
  return (
    <>
      <header className={styles.header}>
        <div className={styles.headerText}>
          <p className={styles.eyebrow}>Result</p>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.meta}>
            Set {attempt.problemId ?? "—"} ·{" "}
            {new Date(attempt.date).toLocaleString()} · {itemScores.length}{" "}
            {itemScores.length === 1 ? "item" : "items"}
            {scored.length < itemScores.length &&
              ` · ${itemScores.length - scored.length} not scored`}
          </p>
          <dl className={styles.stats}>
            {stats.map((s) => (
              <div key={s.label} className={styles.stat}>
                <dt>{s.label}</dt>
                <dd>{s.value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className={styles.scoreCard}>
          <PixelIcon name="microphone" className={styles.sprite} />
          <div>
            <p className={styles.bigScore}>
              {avg === null ? "—" : avg.toFixed(1)}
              <span>/5</span>
            </p>
            <ol className={styles.pipStrip} aria-label="Item scores">
              {itemScores.map((s, i) => (
                <li key={i}>
                  <span>{i + 1}</span>
                  <ScorePips score={s ?? null} />
                </li>
              ))}
            </ol>
          </div>
        </div>
      </header>
      <div className={styles.actions}>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate(`/${attempt.taskId}`)}
        >
          Question list
        </Button>
        {attempt.problemId && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate(`/${attempt.taskId}/${attempt.problemId}`)}
          >
            Try again
          </Button>
        )}
        <NextQuestionButton taskId={attempt.taskId as TaskId} size="sm" />
      </div>
    </>
  );
}

function ItemRow({
  index,
  score,
  partial,
  controls,
  prompt,
  response,
  side,
  details,
}: {
  index: number;
  score: number | undefined;
  partial?: boolean;
  controls: ReactNode;
  prompt: string;
  response: string;
  side: ReactNode;
  details: ReactNode;
}) {
  return (
    <li className={styles.row}>
      <div className={styles.main}>
        <div className={styles.rowHead}>
          <span className={styles.index}>
            {String(index + 1).padStart(2, "0")}
          </span>
          {controls}
        </div>
        <p className={styles.prompt}>{prompt}</p>
        <p className={styles.response}>
          {response || <em>No speech detected</em>}
        </p>
      </div>
      <div className={styles.side}>
        <p className={styles.itemScore}>
          <ScorePips score={score ?? null} />
          {score === undefined ? (
            <span className={styles.unscored}>Not scored</span>
          ) : (
            <>
              <strong>{score}</strong>
              <span>/5{partial && " · partial"}</span>
            </>
          )}
        </p>
        <div className={styles.bars}>{side}</div>
      </div>
      {/* Unscored items need the AI paste panel inside, so start them open. */}
      <details className={styles.details} open={score === undefined}>
        <summary>Details</summary>
        <div className={styles.detailsBody}>{details}</div>
      </details>
    </li>
  );
}

function DeliveryBars({ response }: { response: ItemResponse }) {
  if (!response.assessment) {
    return (
      <p className={styles.note}>
        {response.assessmentError
          ? `Pronunciation not scored: ${response.assessmentError}`
          : "Pronunciation not scored."}
      </p>
    );
  }
  const speed = computeSpeedMetrics([spokenWords(response.assessment)]);
  return (
    <>
      <ProgressBar
        current={Math.round(response.assessment.pronunciation)}
        total={100}
        label="Pronunciation"
      />
      <ProgressBar
        current={Math.round(speedScore(speed))}
        total={100}
        label="Speed"
      />
      <p className={styles.note}>
        {Math.round(speed.speakingRate)} words/min ·{" "}
        {speed.longPausesPerMinute.toFixed(1)} long pauses/min
      </p>
    </>
  );
}

export function ListenRepeatResult({ attempt }: { attempt: Attempt }) {
  const audio = useSingleAudio();
  const urls = useResponseUrls(attempt.responses);
  const rows = attempt.responses.map((r) => {
    const alignment = alignWords(r.prompt ?? "", r.transcript ?? "");
    return {
      r,
      alignment,
      correct: countCorrectWords(alignment),
      total: countOriginalWords(alignment),
    };
  });
  const words = rows.reduce(
    (acc, row) => [acc[0] + row.correct, acc[1] + row.total],
    [0, 0],
  );
  const assessed = attempt.responses.flatMap((r) =>
    r.assessment ? [r.assessment] : [],
  );
  const pron = average(assessed.map((a) => a.pronunciation));
  const speed =
    assessed.length > 0 ? computeSpeedMetrics(assessed.map(spokenWords)) : null;

  return (
    <div className={styles.page}>
      <ResultHeader
        attempt={attempt}
        title="Listen and Repeat"
        itemScores={attempt.responses.map((r) => r.itemScore)}
        stats={[
          {
            label: "Words correct",
            value:
              words[1] > 0
                ? `${Math.round((words[0] / words[1]) * 100)}%`
                : "—",
          },
          {
            label: "Pronunciation",
            value: pron === null ? "—" : String(Math.round(pron)),
          },
          {
            label: "Pace",
            value: speed ? `${Math.round(speed.speakingRate)} wpm` : "—",
          },
        ]}
      />
      <DiffLegend />
      <ol className={styles.rows}>
        {rows.map(({ r, alignment, correct, total }, i) => (
          <ItemRow
            key={r.itemId ?? i}
            index={i}
            score={r.itemScore}
            prompt={r.prompt ?? r.itemId ?? ""}
            response={r.transcript ?? ""}
            controls={
              <>
                <PlayButton
                  audio={audio}
                  id={`prompt-${i}`}
                  url={
                    attempt.problemId
                      ? `/audio/${attempt.taskId}/${attempt.problemId}/${i + 1}.mp3`
                      : null
                  }
                  label="Prompt"
                />
                <PlayButton
                  audio={audio}
                  id={`you-${i}`}
                  url={urls[i]}
                  label="You"
                />
              </>
            }
            side={
              <>
                <ProgressBar current={correct} total={total} label="Words" />
                <DeliveryBars response={r} />
              </>
            }
            details={
              <>
                <ListenRepeatDiffView alignment={alignment} />
                {r.assessment && (
                  <p className={styles.note}>
                    Mispronounced:{" "}
                    {r.assessment.words
                      .filter((w) => w.errorType === "Mispronunciation")
                      .map((w) => w.word)
                      .join(", ") || "none"}
                  </p>
                )}
              </>
            }
          />
        ))}
      </ol>
    </div>
  );
}

function asInterviewData(question: unknown): InterviewProblemData | null {
  return question &&
    typeof question === "object" &&
    Array.isArray((question as InterviewProblemData).questions)
    ? (question as InterviewProblemData)
    : null;
}

export function InterviewResult({
  attempt,
  onChange,
}: {
  attempt: Attempt;
  onChange: (next: Attempt) => void;
}) {
  const audio = useSingleAudio();
  const urls = useResponseUrls(attempt.responses);
  const data = asInterviewData(attempt.question);
  const assessed = attempt.responses.flatMap((r) =>
    r.assessment ? [r.assessment] : [],
  );
  const pron = average(assessed.map((a) => a.pronunciation));
  const speed =
    assessed.length > 0 ? computeSpeedMetrics(assessed.map(spokenWords)) : null;

  const applyAi = (
    index: number,
    ai: { reply: string; scores: AiInterviewScores },
  ) => {
    const responses = attempt.responses.map((r, i) =>
      i === index
        ? {
            ...r,
            ai,
            itemScore: interviewItemScore(ai.scores, r.assessment ?? null)
              ?.total,
          }
        : r,
    );
    onChange({ ...attempt, responses, score: rubricScore(responses) });
  };

  return (
    <div className={styles.page}>
      <ResultHeader
        attempt={attempt}
        title="Take an Interview"
        itemScores={attempt.responses.map((r) => r.itemScore)}
        stats={[
          {
            label: "Pronunciation",
            value: pron === null ? "—" : String(Math.round(pron)),
          },
          {
            label: "Pace",
            value: speed ? `${Math.round(speed.speakingRate)} wpm` : "—",
          },
          {
            label: "Long pauses",
            value: speed ? `${speed.longPausesPerMinute.toFixed(1)}/min` : "—",
          },
        ]}
      />
      <ol className={styles.rows}>
        {attempt.responses.map((r, i) => {
          const q = data?.questions[i];
          const breakdown = interviewItemScore(
            r.ai?.scores ?? null,
            r.assessment ?? null,
          );
          return (
            <ItemRow
              key={r.itemId ?? i}
              index={i}
              score={r.itemScore}
              partial={r.itemScore !== undefined && !r.assessment}
              prompt={r.prompt ?? q?.question ?? ""}
              response={r.transcript ?? ""}
              controls={
                <>
                  {q && (
                    <span className={styles.tag}>
                      {INTERVIEW_TYPE_LABELS[q.type] ?? q.type}
                    </span>
                  )}
                  <PlayButton
                    audio={audio}
                    id={`prompt-${i}`}
                    url={
                      attempt.problemId
                        ? interviewAudioUrl(attempt.problemId, i, "question")
                        : null
                    }
                    label="Prompt"
                  />
                  <PlayButton
                    audio={audio}
                    id={`you-${i}`}
                    url={urls[i]}
                    label="You"
                  />
                </>
              }
              side={
                <>
                  {(
                    [
                      ["Language use", breakdown?.languageUse],
                      ["Organization", breakdown?.organization],
                      ["Intelligibility", breakdown?.intelligibility],
                      ["Fluency", breakdown?.fluency],
                    ] as const
                  ).map(
                    ([label, value]) =>
                      value !== undefined && (
                        <ProgressBar
                          key={label}
                          current={Math.round(value * 10) / 10}
                          total={5}
                          label={label}
                        />
                      ),
                  )}
                  {!r.assessment && <DeliveryBars response={r} />}
                </>
              }
              details={
                <>
                  {r.ai ? (
                    <div className={styles.aiReply}>
                      <h3>AI feedback</h3>
                      <p>{stripScoreBlock(r.ai.reply)}</p>
                    </div>
                  ) : (
                    r.transcript !== undefined && (
                      <AiScorePanel
                        message={buildInterviewQaCopyMessage({
                          question: r.prompt ?? q?.question ?? "",
                          userAnswer: r.transcript,
                          modelAnswer: q?.modelAnswer,
                          evaluationPoints: q?.evaluationPoints,
                          questionType: q
                            ? (INTERVIEW_TYPE_LABELS[q.type] ?? q.type)
                            : undefined,
                        })}
                        onApply={(ai) => applyAi(i, ai)}
                      />
                    )
                  )}
                  {q && (
                    <div className={styles.sample}>
                      <h3>Sample answer</h3>
                      <p>{q.modelAnswer}</p>
                      {attempt.problemId && (
                        <PlayButton
                          audio={audio}
                          id={`model-${i}`}
                          url={interviewAudioUrl(attempt.problemId, i, "model")}
                          label="Play sample"
                        />
                      )}
                    </div>
                  )}
                </>
              }
            />
          );
        })}
      </ol>
    </div>
  );
}

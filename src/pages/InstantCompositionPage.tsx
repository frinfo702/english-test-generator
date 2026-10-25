import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { SectionHeader } from "../components/layout/SectionHeader";
import { Button } from "../components/ui/Button";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { NextQuestionButton } from "../components/question/NextQuestionButton";
import { PixelIcon } from "../components/pixel/PixelIcon";
import { useTts } from "../hooks/useTts";
import { useQuestion } from "../hooks/useQuestion";
import { useScoreHistory } from "../hooks/useScoreHistory";
import { thinkSeconds } from "./instantComposition";
import styles from "./InstantCompositionPage.module.css";

const TASK_ID = "instant-composition";

interface Sentence {
  id: string;
  ja: string;
  text: string;
  note?: string;
}

interface ProblemData {
  title: string;
  point: string;
  sentences: Sentence[];
}

type Phase = "prompt" | "reveal" | "done";

/** Marks the usage note: a pen jotting it down, the ink drawing in under the nib. */
function WritingPen() {
  return (
    <svg
      className={styles.penMark}
      viewBox="0 0 32 32"
      width="28"
      height="28"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path
        className={styles.ink}
        d="M.8 29.2c1.4-2.2 2.6-2.2 3.1 0s1.8 1.4 2.4-1.4"
        pathLength={1}
      />
      <g className={styles.pen}>
        {/* Drawn lying flat with the tip at the origin, then tilted onto the ink. */}
        <g transform="translate(6 27.4) rotate(-45)">
          <rect
            className={styles.barrel}
            x="5"
            y="-2.2"
            width="22"
            height="4.4"
            rx="1.2"
          />
          <path className={styles.barrel} d="M5 -2.2 .6 0 5 2.2" />
          <path d="M9 -2.2v4.4" />
          <path d="M24 -2.2V-3.8H15.5" />
        </g>
      </g>
    </svg>
  );
}

function DrillContent({ data, file }: { data: ProblemData; file: string }) {
  const { playing, play, stop } = useTts();
  const { saveScore } = useScoreHistory();
  const unit = file.replace(/\.json$/i, "");
  const all = data.sentences;

  // Indices into `all`; a retry pass holds only the misses.
  const [queue, setQueue] = useState(() => all.map((_, i) => i));
  const [pos, setPos] = useState(0);
  const [phase, setPhase] = useState<Phase>("prompt");
  const [missed, setMissed] = useState<number[]>([]);
  // Only the first pass is scored: a retry of the misses would always pass.
  const [firstPass, setFirstPass] = useState<boolean[]>([]);
  const [isFirstPass, setIsFirstPass] = useState(true);

  const index = queue[pos];
  const sentence = all[index];
  const audioUrl = `/audio/${TASK_ID}/${unit}/${index + 1}.mp3`;

  useEffect(() => () => stop(), [stop]);

  const reveal = useCallback(() => {
    setPhase("reveal");
    play(audioUrl);
  }, [play, audioUrl]);

  useEffect(() => {
    if (phase !== "prompt" || !sentence) return;
    const t = setTimeout(reveal, thinkSeconds(sentence.text) * 1000);
    return () => clearTimeout(t);
  }, [phase, sentence, reveal]);

  const mark = useCallback(
    (got: boolean) => {
      stop();
      const results = [...firstPass];
      if (isFirstPass) results[index] = got;
      setFirstPass(results);
      const nextMissed = got ? missed : [...missed, index];
      setMissed(nextMissed);
      if (pos + 1 < queue.length) {
        setPos(pos + 1);
        setPhase("prompt");
        return;
      }
      setPhase("done");
      if (isFirstPass) {
        saveScore({
          taskId: TASK_ID,
          file,
          correct: results.filter(Boolean).length,
          total: all.length,
          method: "self-check",
          responses: all.map((s, i) => ({
            itemId: s.id,
            prompt: s.ja,
            misses: results[i] ? 0 : 1,
          })),
          question: data,
        });
      }
    },
    [
      stop,
      firstPass,
      isFirstPass,
      index,
      missed,
      pos,
      queue.length,
      saveScore,
      file,
      all,
      data,
    ],
  );

  const restart = (indices: number[]) => {
    setQueue(indices);
    setPos(0);
    setMissed([]);
    setPhase("prompt");
    setIsFirstPass(false);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
      // Arrows still work on a focused button; Space/Enter keep their native press.
      if (
        e.target instanceof HTMLElement &&
        (e.target.closest("input, textarea") ||
          (e.target.closest("button, a") &&
            (e.key === " " || e.key === "Enter")))
      )
        return;
      if (phase === "prompt" && (e.key === " " || e.key === "Enter")) {
        e.preventDefault();
        reveal();
      } else if (phase === "reveal") {
        if (e.key === "ArrowLeft" || e.key === "1") mark(false);
        else if (e.key === "ArrowRight" || e.key === "2") mark(true);
        else if (e.key === "r" || e.key === " ") {
          e.preventDefault();
          play(audioUrl);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, reveal, mark, play, audioUrl]);

  if (phase === "done") {
    const score = firstPass.filter(Boolean).length;
    return (
      <div className={`${styles.sheet} ${styles.summary}`}>
        <div className={styles.summaryHead}>
          <PixelIcon name="microphone" className={styles.summaryIcon} />
          <div>
            <p className="doc-eyebrow">First-pass score</p>
            <p className="doc-score">
              <span className="doc-score-num">{score}</span>
              <span className="doc-score-den">/ {all.length}</span>
              <span className="doc-score-pct">
                {Math.round((score / all.length) * 100)}%
              </span>
            </p>
          </div>
        </div>
        {missed.length > 0 ? (
          <>
            <p className="doc-eyebrow doc-eyebrow-ink">Still slow on</p>
            <ol className={styles.missList}>
              {missed.map((i) => (
                <li key={all[i].id}>
                  <button
                    type="button"
                    className={styles.missRow}
                    onClick={() =>
                      play(`/audio/${TASK_ID}/${unit}/${i + 1}.mp3`)
                    }
                  >
                    <span lang="ja" className={styles.missJa}>
                      {all[i].ja}
                    </span>
                    <span className={styles.missEn}>{all[i].text}</span>
                  </button>
                </li>
              ))}
            </ol>
          </>
        ) : (
          <p className={styles.allClear}>Every sentence came out on time.</p>
        )}
        <div className={styles.actions}>
          {missed.length > 0 && (
            <Button onClick={() => restart(missed)}>
              Drill the {missed.length} missed
            </Button>
          )}
          <Button
            variant="secondary"
            onClick={() => restart(all.map((_, i) => i))}
          >
            Run the unit again
          </Button>
        </div>
      </div>
    );
  }

  if (!sentence) return null;

  return (
    <>
      <div className={styles.progressRow}>
        <span className="micro-label">
          {isFirstPass ? "Sentence" : "Retry"}
        </span>
        <ol className={styles.cells} aria-hidden="true">
          {queue.map((qi, i) => (
            <li
              key={qi}
              className={
                i === pos
                  ? styles.cellNow
                  : i > pos
                    ? undefined
                    : missed.includes(qi)
                      ? styles.cellMissed
                      : styles.cellGot
              }
            />
          ))}
        </ol>
        <span className={styles.progressText}>
          {String(pos + 1).padStart(2, "0")} /{" "}
          {String(queue.length).padStart(2, "0")}
        </span>
      </div>
      <div className={styles.sheet}>
        <div className={styles.eyebrowRow}>
          <span className="doc-item-num">{index + 1}</span>
          <span className="doc-meta">
            {phase === "prompt" ? "Say it in English" : "Model answer"}
          </span>
        </div>
        <p lang="ja" className={styles.ja}>
          {sentence.ja}
        </p>

        {phase === "prompt" ? (
          <>
            <div
              key={`${pos}-${queue.length}`}
              className={styles.countdown}
              style={{ animationDuration: `${thinkSeconds(sentence.text)}s` }}
              aria-hidden="true"
            />
            <div className={styles.actions}>
              <Button size="lg" onClick={reveal}>
                Show answer <kbd className={styles.kbd}>Space</kbd>
              </Button>
            </div>
            <p className={styles.hint}>
              Say it out loud before the bar runs out.
            </p>
          </>
        ) : (
          <>
            <p className={styles.en}>{sentence.text}</p>
            {sentence.note && (
              <p className={styles.note}>
                <WritingPen />
                <span className="sr-only">Note:</span>
                {sentence.note}
              </p>
            )}
            <div className={styles.actions}>
              <Button variant="secondary" onClick={() => mark(false)}>
                Missed <kbd className={styles.kbd}>←</kbd>
              </Button>
              <Button
                variant="ghost"
                onClick={() => play(audioUrl)}
                disabled={playing}
              >
                Play again <kbd className={styles.kbd}>R</kbd>
              </Button>
              <Button onClick={() => mark(true)}>
                Got it <kbd className={styles.kbd}>→</kbd>
              </Button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

export function InstantCompositionPage() {
  const navigate = useNavigate();
  const { questionId = "" } = useParams<{ questionId: string }>();
  const { data, file, loading, error, loadById } =
    useQuestion<ProblemData>(TASK_ID);

  useEffect(() => {
    if (questionId) loadById(questionId);
  }, [loadById, questionId]);

  return (
    <div>
      <SectionHeader
        title={data?.title ?? "Instant Composition"}
        subtitle={
          data?.point ??
          "See the Japanese, say the English. No time to translate."
        }
        backTo="/"
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate(`/${TASK_ID}`)}
              disabled={loading}
            >
              Unit List
            </Button>
            <NextQuestionButton
              taskId={TASK_ID}
              variant="secondary"
              size="sm"
            />
          </>
        }
      />

      {loading && <LoadingSpinner message="Loading unit..." />}
      {error && <p className="notice-error">{error}</p>}
      {data && !loading && (
        <DrillContent key={questionId} data={data} file={file ?? ""} />
      )}
    </div>
  );
}

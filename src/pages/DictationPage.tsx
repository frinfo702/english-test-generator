import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { SectionHeader } from "../components/layout/SectionHeader";
import { Button } from "../components/ui/Button";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { SpeedControl } from "../components/ui/SpeedControl";
import { useTts } from "../hooks/useTts";
import { useQuestion } from "../hooks/useQuestion";
import { useScoreHistory } from "../hooks/useScoreHistory";
import { useElapsedTimer } from "../hooks/useElapsedTimer";
import { formatSecondsAsMmSs } from "../lib/time";
import {
  buildWordPool,
  shufflePool,
  isCorrectSoFar,
  isCompleteAndCorrect,
  splitTrailingPunctuation,
  type WordToken,
} from "./dictation";
import styles from "./DictationPage.module.css";

interface DictationSentence {
  id: string;
  text: string;
  distractors: string[];
}

interface ProblemData {
  title: string;
  sentences: DictationSentence[];
}

const TASK_ID = "dictation";

type Phase = "listening" | "answering" | "wrong" | "correct";

interface SentenceState {
  selected: WordToken[];
  phase: Phase;
  /** The last wrong word token tapped (for red chip display), or null */
  wrongToken: WordToken | null;
  /** Total number of wrong taps for this sentence */
  wrongCount: number;
}

function createSentenceState(): SentenceState {
  return { selected: [], phase: "listening", wrongToken: null, wrongCount: 0 };
}

function DictationContent({ data, file }: { data: ProblemData; file: string }) {
  const navigate = useNavigate();
  const {
    playing,
    loading: ttsLoading,
    error: ttsError,
    currentTime,
    duration,
    playbackRate,
    setPlaybackRate,
    play,
    pause,
    resume,
    stop,
  } = useTts();
  const { saveScore } = useScoreHistory();
  const {
    display: timerDisplay,
    elapsedSeconds,
    start: startTimer,
    stop: stopTimer,
    reset: resetTimer,
  } = useElapsedTimer();

  const [current, setCurrent] = useState(0);
  const [states, setStates] = useState<Record<number, SentenceState>>({});
  const [submitted, setSubmitted] = useState(false);

  const fileBasename = file.replace(/\.json$/i, "");
  const totalSentences = data.sentences.length;

  useEffect(() => {
    return () => stop();
  }, [stop]);

  const sentence = data.sentences[current];

  // Word pool is derived data — memoised per sentence so it stays stable
  // across re-renders and navigation (same sentence reference → cached).
  const pool = useMemo(
    () =>
      sentence
        ? shufflePool(buildWordPool(sentence.text, sentence.distractors))
        : [],
    [sentence],
  );

  const state: SentenceState = states[current] ?? createSentenceState();

  const { words: correctWords, trailingPunct } = useMemo(
    () =>
      sentence
        ? splitTrailingPunctuation(sentence.text)
        : { words: [], trailingPunct: "" },
    [sentence],
  );

  const setState = (updater: (prev: SentenceState) => SentenceState) => {
    setStates((s) => ({
      ...s,
      [current]: updater(s[current] ?? createSentenceState()),
    }));
  };

  const audioUrl = `/audio/dictation/${fileBasename}/${current + 1}.mp3`;

  const handlePlay = useCallback(() => {
    if (playing) pause();
    else if (currentTime > 0) resume();
    else play(audioUrl);
  }, [playing, currentTime, play, pause, resume, audioUrl]);

  const handleSelectWord = (token: WordToken) => {
    if (state.phase === "correct") return;
    const newSelected = [...state.selected, token];
    if (isCorrectSoFar(newSelected, correctWords)) {
      setState((prev) => ({
        ...prev,
        selected: newSelected,
        phase: isCompleteAndCorrect(newSelected, correctWords)
          ? "correct"
          : "answering",
        wrongToken: null,
      }));
    } else {
      // Wrong word: do NOT add to selected — record it as a red chip.
      // The user can immediately continue tapping other words.
      setState((prev) => ({
        ...prev,
        phase: "wrong",
        wrongToken: token,
        wrongCount: prev.wrongCount + 1,
      }));
    }
  };

  const handleRemoveLast = () => {
    if (state.phase === "correct") return;
    // If a wrong chip is showing, clear it first (don't remove a correct word)
    if (state.wrongToken) {
      setState((prev) => ({
        ...prev,
        wrongToken: null,
        phase: prev.selected.length > 0 ? "answering" : "listening",
      }));
      return;
    }
    setState((prev) => ({
      ...prev,
      selected: prev.selected.slice(0, -1),
      wrongToken: null,
      phase: prev.selected.length > 1 ? "answering" : "listening",
    }));
  };

  const handleNext = () => {
    stop();
    if (current + 1 < totalSentences) setCurrent((c) => c + 1);
  };
  const handlePrev = () => {
    stop();
    if (current > 0) setCurrent((c) => c - 1);
  };

  const correctCount = useMemo(
    () =>
      data.sentences.reduce(
        (n, _, i) => n + (states[i]?.phase === "correct" ? 1 : 0),
        0,
      ),
    [data.sentences, states],
  );
  const allCorrect = correctCount === totalSentences;

  /** Total wrong taps across all sentences (lower is better) */
  const totalWrongCount = useMemo(
    () =>
      data.sentences.reduce((n, _, i) => n + (states[i]?.wrongCount ?? 0), 0),
    [data.sentences, states],
  );

  const handleSubmit = () => {
    stopTimer();
    setSubmitted(true);
    // Score: total sentences minus wrong taps (clamped to 0) so fewer mistakes = higher score
    const score = Math.max(0, totalSentences - totalWrongCount);
    saveScore(TASK_ID, score, totalSentences, elapsedSeconds, file);
  };

  const handleRestart = () => {
    stop();
    resetTimer();
    setStates({});
    setSubmitted(false);
    setCurrent(0);
    navigate("/dictation");
  };

  useEffect(() => {
    if (data && !submitted && elapsedSeconds === 0) startTimer();
  }, [data, submitted, elapsedSeconds, startTimer]);

  const remainingPool = pool.filter(
    (t) => !state.selected.some((s) => s.id === t.id),
  );

  if (submitted) {
    return (
      <div className={styles.resultCard}>
        <h2>Dictation Results</h2>
        <div className={styles.scoreBox}>
          <span className={styles.scoreNum}>{totalWrongCount}</span>
          <span className={styles.scoreDen}>
            mistake{totalWrongCount === 1 ? "" : "s"}
          </span>
        </div>
        <p className={styles.scorePct}>
          {totalWrongCount === 0
            ? "Perfect — no mistakes!"
            : totalWrongCount <= 3
              ? "Great job — few mistakes!"
              : "Keep practicing — fewer mistakes next time!"}
        </p>
        <p className={styles.timeText}>
          Time: {formatSecondsAsMmSs(elapsedSeconds)}
        </p>
        <div className={styles.btnRow}>
          <Button variant="accent" onClick={handleRestart}>
            Try Another Set
          </Button>
          <Button variant="secondary" onClick={() => navigate("/dashboard")}>
            View Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dictationPage}>
      <div className={styles.progressRow}>
        <span className={styles.progressText}>
          Sentence {current + 1} / {totalSentences}
        </span>
        <span className={styles.streakBadge}>{correctCount} correct</span>
      </div>

      {timerDisplay && <span className={styles.timeText}>{timerDisplay}</span>}

      <div className={styles.card}>
        <div className={styles.playerSection}>
          <Button
            onClick={handlePlay}
            disabled={ttsLoading || !sentence}
            size="lg"
            variant="accent"
          >
            {ttsLoading
              ? "Loading..."
              : playing
                ? "Pause"
                : currentTime > 0
                  ? "Resume"
                  : "Play Audio"}
          </Button>
          <SpeedControl
            playbackRate={playbackRate}
            onChange={setPlaybackRate}
          />
          <div className={styles.playerProgressRow}>
            <span className={styles.timeText}>
              {formatSecondsAsMmSs(currentTime)} /{" "}
              {formatSecondsAsMmSs(duration)}
            </span>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{
                  width:
                    duration > 0 ? `${(currentTime / duration) * 100}%` : "0%",
                }}
              />
            </div>
          </div>
          {ttsError && <p className={styles.ttsError}>{ttsError}</p>}
        </div>

        <p className={styles.instruction}>
          Listen to the audio, then tap the word cards below in the correct
          order.
        </p>

        <div
          className={[
            styles.answerZone,
            state.phase === "correct" ? styles.answerZoneCorrect : "",
            state.phase === "wrong" ? styles.answerZoneWrong : "",
          ].join(" ")}
        >
          {state.selected.length === 0 && !state.wrongToken ? (
            <span className={styles.placeholder}>
              Tap words from the pool below to build the sentence
            </span>
          ) : (
            <>
              {state.selected.map((token) => (
                <span
                  key={token.id}
                  className={[
                    styles.placedWord,
                    state.phase === "correct" ? styles.placedWordCorrect : "",
                  ].join(" ")}
                >
                  {token.text}
                </span>
              ))}
              {/* Wrong word chip — shown in red, not part of the answer */}
              {state.wrongToken && (
                <span
                  key={state.wrongToken.id}
                  className={[styles.placedWord, styles.placedWordWrong].join(
                    " ",
                  )}
                >
                  {state.wrongToken.text}
                </span>
              )}
              {/* Pre-displayed trailing punctuation (., ?, !) */}
              {trailingPunct && (
                <span className={styles.trailingPunct}>{trailingPunct}</span>
              )}
            </>
          )}
        </div>

        <div className={styles.wordCards}>
          {remainingPool.length === 0 ? (
            <span className={styles.wordCardsEmpty}>All words placed</span>
          ) : (
            remainingPool.map((token) => (
              <button
                key={token.id}
                type="button"
                className={styles.wordCard}
                onClick={() => handleSelectWord(token)}
                disabled={state.phase === "correct"}
              >
                {token.text}
              </button>
            ))
          )}
        </div>

        {state.phase === "wrong" && state.wrongToken && (
          <div className={[styles.feedback, styles.fbWrong].join(" ")}>
            <p className={styles.fbStatus}>✗ Wrong word!</p>
            <p className={styles.fbAnswer}>
              The word <strong>"{state.wrongToken.text}"</strong> is not the
              next correct word. Keep trying — tap another word.
            </p>
          </div>
        )}
        {state.phase === "correct" && (
          <div className={[styles.feedback, styles.fbCorrect].join(" ")}>
            <p className={styles.fbStatus}>✓ Perfect!</p>
            <p className={styles.fbAnswer}>
              Correct sentence: <strong>{sentence.text}</strong>
            </p>
          </div>
        )}

        <div className={styles.btnRow}>
          {state.selected.length > 0 && state.phase !== "correct" && (
            <Button variant="secondary" onClick={handleRemoveLast}>
              ← Backspace
            </Button>
          )}
          {current > 0 && (
            <Button variant="secondary" onClick={handlePrev}>
              Previous
            </Button>
          )}
          {state.phase === "correct" && current + 1 < totalSentences && (
            <Button variant="accent" onClick={handleNext}>
              Next →
            </Button>
          )}
          {allCorrect && current + 1 >= totalSentences && (
            <Button variant="accent" size="lg" onClick={handleSubmit}>
              Submit
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function DictationPage() {
  const navigate = useNavigate();
  const { questionNumber } = useParams<{ questionNumber: string }>();
  const { data, file, loading, error, loadByQuestionNumber } =
    useQuestion<ProblemData>(TASK_ID);

  const parsedQuestionNumber = Number.parseInt(questionNumber ?? "", 10);
  const hasValidQuestionNumber =
    Number.isInteger(parsedQuestionNumber) && parsedQuestionNumber > 0;

  useEffect(() => {
    if (!hasValidQuestionNumber) return;
    loadByQuestionNumber(parsedQuestionNumber);
  }, [hasValidQuestionNumber, loadByQuestionNumber, parsedQuestionNumber]);

  const handleBackToList = () => {
    navigate("/dictation");
  };

  return (
    <div>
      <SectionHeader
        title="Dictation Practice"
        subtitle={
          data?.title ?? "Listen and arrange the words in the correct order."
        }
        backTo="/"
      />

      <div className={styles.topBar}>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleBackToList}
          disabled={loading}
        >
          Question List
        </Button>
      </div>

      {loading && <LoadingSpinner message="Loading dictation set..." />}
      {error && (
        <div className={styles.error}>
          <p>{error}</p>
          <p className={styles.errorHint}>
            Add question JSON under public/questions/dictation/
          </p>
        </div>
      )}
      {!hasValidQuestionNumber && (
        <div className={styles.error}>
          <p>Invalid question number in URL.</p>
        </div>
      )}

      {data && !loading && hasValidQuestionNumber && file && (
        <DictationContent key={parsedQuestionNumber} data={data} file={file} />
      )}
    </div>
  );
}

import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { SectionHeader } from "../components/layout/SectionHeader";
import { Button } from "../components/ui/Button";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { useTts } from "../hooks/useTts";
import { useQuestion } from "../hooks/useQuestion";
import { AudioPlayer } from "../components/ui/AudioPlayer";
import { CardStack } from "../components/ui/CardStack";
import styles from "./ShadowingPage.module.css";

interface Sentence {
  id: string;
  text: string;
  wordCount: number;
}

interface ProblemData {
  title: string;
  sentences: Sentence[];
}

function ShadowingContent({ data, file }: { data: ProblemData; file: string }) {
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
    seek,
  } = useTts();
  const [current, setCurrent] = useState(0);
  const [showText, setShowText] = useState(false);
  const fileBasename = file.replace(/\.json$/i, "");

  useEffect(() => {
    return () => stop();
  }, [stop]);

  const handlePlay = useCallback(() => {
    const sentence = data.sentences[current];
    if (!sentence) return;
    if (playing) {
      pause();
    } else if (currentTime > 0) {
      resume();
    } else {
      play(`/audio/shadowing/${fileBasename}/${current + 1}.mp3`);
    }
  }, [data, current, playing, currentTime, play, pause, resume, fileBasename]);

  const totalSentences = data.sentences.length;
  const safeCurrent = current >= totalSentences ? 0 : current;
  const sentence = data.sentences[safeCurrent];

  const handlePrev = () => {
    if (safeCurrent <= 0) return;
    stop();
    setCurrent((c) => c - 1);
    setShowText(false);
  };

  const handleNext = () => {
    if (safeCurrent + 1 >= totalSentences) return;
    stop();
    setCurrent((c) => c + 1);
    setShowText(false);
  };

  return (
    <>
      <div className={styles.progressRow}>
        <span className="micro-label">Sentence</span>
        <span className={styles.progressText}>
          {String(safeCurrent + 1).padStart(2, "0")} /{" "}
          {String(totalSentences).padStart(2, "0")}
        </span>
      </div>

      <CardStack index={safeCurrent} total={totalSentences}>
        <div className={styles.card}>
          <div className={styles.playerSection}>
            <AudioPlayer
              playing={playing}
              loading={ttsLoading}
              error={ttsError}
              currentTime={currentTime}
              duration={duration}
              playbackRate={playbackRate}
              onPlayPause={handlePlay}
              onSeek={seek}
              onPlaybackRateChange={setPlaybackRate}
              seekable={false}
              skipSeconds={3}
              src={`/audio/shadowing/${fileBasename}/${safeCurrent + 1}.mp3`}
            />
          </div>

          <div className={styles.textSection}>
            {sentence && (
              <>
                <div className={styles.sentenceArea}>
                  {showText ? (
                    <p className={styles.sentenceText}>{sentence.text}</p>
                  ) : (
                    <p className={styles.hiddenText}>
                      {"\u00B7 ".repeat(sentence.text.split(/\s+/).length)}
                    </p>
                  )}
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowText((s) => !s)}
                >
                  {showText ? "Hide Text" : "Show Text"}
                </Button>
              </>
            )}
          </div>

          <div className={styles.navSection}>
            <Button
              variant="secondary"
              onClick={handlePrev}
              disabled={safeCurrent <= 0}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              onClick={handleNext}
              disabled={safeCurrent + 1 >= totalSentences}
            >
              Next
            </Button>
          </div>
        </div>
      </CardStack>
    </>
  );
}

export function ShadowingPage() {
  const navigate = useNavigate();
  const { questionNumber } = useParams<{ questionNumber: string }>();
  const { data, file, loading, error, loadByQuestionNumber } =
    useQuestion<ProblemData>("shadowing");

  const parsedQuestionNumber = Number.parseInt(questionNumber ?? "", 10);
  const hasValidQuestionNumber =
    Number.isInteger(parsedQuestionNumber) && parsedQuestionNumber > 0;

  useEffect(() => {
    if (!hasValidQuestionNumber) return;
    loadByQuestionNumber(parsedQuestionNumber);
  }, [hasValidQuestionNumber, loadByQuestionNumber, parsedQuestionNumber]);

  const handleBackToList = () => {
    navigate("/shadowing");
  };

  return (
    <div>
      <SectionHeader
        title="Shadowing Practice"
        subtitle={data?.title ?? "Listen and repeat to improve pronunciation."}
        backTo="/"
        current={0}
        total={0}
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

      {loading && <LoadingSpinner message="Loading shadowing set..." />}
      {error && (
        <div className={styles.error}>
          <p>{error}</p>
          <p className={styles.errorHint}>
            Add question JSON under public/questions/shadowing/
          </p>
        </div>
      )}
      {!hasValidQuestionNumber && (
        <div className={styles.error}>
          <p>Invalid question number in URL.</p>
        </div>
      )}

      {data && !loading && hasValidQuestionNumber && (
        <ShadowingContent
          key={parsedQuestionNumber}
          data={data}
          file={file ?? ""}
        />
      )}
    </div>
  );
}

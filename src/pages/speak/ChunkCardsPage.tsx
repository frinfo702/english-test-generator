import { useRef, useState } from "react";
import { SectionHeader } from "../../components/layout/SectionHeader";
import { Button } from "../../components/ui/Button";
import { VoiceButton } from "../../components/ui/VoiceButton";
import { useSpeechRecognition } from "../../hooks/useSpeechRecognition";
import { autoScoring, scoreWithGateway } from "../../lib/aiGateway";
import {
  decodeVoiced,
  dueCards,
  judgePrompt,
  loadCards,
  parseJudge,
  saveCards,
  scheduleCard,
  type ChunkCard,
} from "../../lib/speakingLoop";
import styles from "./SpeakLoop.module.css";

interface Answer {
  transcript: string;
  /** Seconds from the card appearing to speech onset; null if nothing was heard. */
  latency: number | null;
  verdict: { correct: boolean; note: string } | null;
}

export function ChunkCardsPage() {
  const [cards, setCards] = useState(loadCards);
  const [queue, setQueue] = useState<ChunkCard[] | null>(null);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [judging, setJudging] = useState(false);
  const shownAt = useRef(0);
  const rec = useSpeechRecognition("multi");
  const due = dueCards(cards, new Date());
  const card = queue?.[0];

  const show = () => {
    setAnswer(null);
    shownAt.current = Date.now();
    void rec.start();
  };

  const stop = async () => {
    const { text, audio, startedAt } = await rec.stop();
    const segments = audio ? await decodeVoiced(audio).catch(() => []) : [];
    const latency =
      segments.length && startedAt
        ? (startedAt - shownAt.current) / 1000 + segments[0][0]
        : null;
    setAnswer({ transcript: text, latency, verdict: null });
    const ai = autoScoring();
    if (!ai || !card || !text.trim()) return;
    setJudging(true);
    try {
      const verdict = parseJudge(
        await scoreWithGateway(judgePrompt(card, text), ai),
      );
      setAnswer((a) => a && { ...a, verdict });
    } catch {
      /* the learner grades it themselves */
    } finally {
      setJudging(false);
    }
  };

  const grade = (correct: boolean) => {
    if (!card || !answer) return;
    const next = scheduleCard(card, correct, answer.latency ?? 99, new Date());
    const all = cards.map((c) => (c.id === next.id ? next : c));
    saveCards(all);
    setCards(all);
    const rest = queue!.slice(1);
    // A miss comes back at the end of today's queue.
    setQueue(correct ? rest : [...rest, next]);
    setAnswer(null);
    if (rest.length || !correct) {
      shownAt.current = Date.now();
      void rec.start();
    }
  };

  const remove = () => {
    if (!card) return;
    const all = cards.filter((c) => c.id !== card.id);
    saveCards(all);
    setCards(all);
    const rest = queue!.slice(1);
    setQueue(rest);
    // start() drops any take in progress, so this also stops the mic.
    if (rest.length) show();
    else void rec.stop();
  };

  const state = rec.recording
    ? "recording"
    : rec.processing
      ? "processing"
      : "idle";

  return (
    <div className="page-narrow">
      <SectionHeader
        title="Chunk Cards"
        subtitle="Say it out loud. Fast and right stretches the interval; slow and right brings it back sooner."
        backTo="/speak"
      />
      {rec.error && <p className="notice-error">{rec.error}</p>}

      {!card && (
        <section className={styles.block}>
          <p>
            {cards.length === 0
              ? "No cards yet. Finish a Speaking Loop session and add its chunks."
              : queue
                ? "Done for now."
                : `${due.length} due of ${cards.length} cards.`}
          </p>
          {!queue && due.length > 0 && (
            <Button
              onClick={() => {
                setQueue(due);
                show();
              }}
            >
              Start review
            </Button>
          )}
        </section>
      )}

      {card && (
        <section className={styles.panel}>
          <p className={styles.label}>{queue!.length} left · say it in English</p>
          <p className={styles.intent}>{card.intent}</p>

          {!answer && (
            <VoiceButton
              state={state}
              levels={rec.levels}
              disabled={state === "processing"}
              label={
                state === "recording"
                  ? "Done"
                  : state === "processing"
                    ? "Transcribing…"
                    : "Speak"
              }
              onPress={() => (rec.recording ? void stop() : show())}
            />
          )}

          {answer && (
            <>
              <p className={styles.natural}>{card.chunk}</p>
              <p className={styles.hint}>{card.example}</p>
              <p>
                <span className={styles.label}>You said</span>{" "}
                {answer.transcript || "(nothing recognized)"}
              </p>
              <p className={`${styles.hint} tnum`}>
                Started speaking after{" "}
                {answer.latency == null ? "—" : `${answer.latency.toFixed(1)} s`}
              </p>
              {judging && <p className={styles.hint}>Checking…</p>}
              {answer.verdict && (
                <p className={styles.hint}>
                  {answer.verdict.correct ? "Looks right" : "Not quite"}:{" "}
                  {answer.verdict.note}
                </p>
              )}
              <div className={styles.row}>
                <Button
                  variant={answer.verdict?.correct === false ? "secondary" : "primary"}
                  onClick={() => grade(true)}
                >
                  Said it
                </Button>
                <Button
                  variant={answer.verdict?.correct === false ? "primary" : "secondary"}
                  onClick={() => grade(false)}
                >
                  Missed
                </Button>
                <Button variant="ghost" onClick={remove}>
                  Delete card
                </Button>
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { VoiceRing } from "voice-ring";
import { SectionHeader } from "../../components/layout/SectionHeader";
import { Button } from "../../components/ui/Button";
import { useTimer } from "../../hooks/useTimer";
import {
  startConversation,
  type Conversation,
  type Line,
} from "../../lib/realtimeConversation";
import { TOPICS } from "../../lib/speakingLoop";
import styles from "./SpeakLoop.module.css";

const MAX_SECONDS = 15 * 60;
/** Within this many px of the end counts as "at the bottom", so sub-pixel rounding doesn't unpin. */
const PIN_SLACK = 24;

/** What the loop page analyzes when it opens from here. */
export interface ConversationHandoff {
  topic: string;
  transcript: string;
}

export function ConversationPage() {
  const navigate = useNavigate();
  const [topic, setTopic] = useState(TOPICS[0].prompt);
  const [lines, setLines] = useState<Line[]>([]);
  const [status, setStatus] = useState<"idle" | "connecting" | "live">("idle");
  const [error, setError] = useState<string | null>(null);
  const [ended, setEnded] = useState<string | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const [pinned, setPinned] = useState(true);
  const [media, setMedia] = useState<Pick<
    Conversation,
    "stream" | "output"
  > | null>(null);
  const conversation = useRef<Conversation | null>(null);
  const logRef = useRef<HTMLOListElement>(null);
  const timer = useTimer(MAX_SECONDS, () =>
    conversation.current?.stop("Ended at the 15-minute limit."),
  );

  useEffect(() => () => conversation.current?.stop(), []);

  useLayoutEffect(() => {
    const el = logRef.current;
    if (el && pinned) el.scrollTop = el.scrollHeight;
  }, [lines, pinned]);

  const onLogScroll = () => {
    const el = logRef.current;
    if (el)
      setPinned(el.scrollHeight - el.scrollTop - el.clientHeight < PIN_SLACK);
  };
  const jumpToLatest = () => {
    const el = logRef.current;
    el?.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  };

  const start = async () => {
    setError(null);
    setEnded(null);
    setLines([]);
    setPinned(true);
    setStatus("connecting");
    timer.reset();
    try {
      conversation.current = await startConversation(topic, {
        lines: setLines,
        error: setError,
        speaking: setSpeaking,
        closed: (reason) => {
          timer.stop();
          setSpeaking(false);
          setEnded(reason ?? null);
          setStatus("idle");
        },
      });
      setMedia(conversation.current);
      setStatus("live");
      timer.start();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus("idle");
    }
  };

  const spoken = lines.filter((l) => l.text.trim());
  const mine = spoken.filter((l) => l.who === "you");

  const analyze = () => {
    conversation.current?.stop();
    const handoff: ConversationHandoff = {
      topic: `Conversation about: ${topic} (analyze only the lines marked "Me:"; the partner's lines are context)`,
      transcript: spoken
        .map((l) => `${l.who === "you" ? "Me" : "Partner"}: ${l.text}`)
        .join("\n"),
    };
    navigate("/speak", { state: handoff });
  };

  return (
    <div>
      <SectionHeader
        title="Conversation"
        subtitle="Answer a partner who asks back. Japanese is fine when you're stuck; the log goes into the same analysis."
        backTo="/speak"
      />
      <div className={styles.convo}>
        <div>
          {error && <p className="notice-error">{error}</p>}
          {ended && <p className={styles.hint}>{ended}</p>}

          {status !== "idle" && (
            <div className={styles.ring}>
              <VoiceRing
                size={200}
                state={
                  status === "connecting"
                    ? "processing"
                    : speaking
                      ? "speaking"
                      : "listening"
                }
                {...(speaking
                  ? { analyser: media?.output }
                  : { stream: media?.stream })}
                aria-label={speaking ? "Partner is speaking" : "Listening"}
              />
              <span className={styles.label}>
                {status === "connecting"
                  ? "Connecting"
                  : speaking
                    ? "Partner"
                    : "Listening"}
                {status === "live" && ` · ${timer.display} left`}
              </span>
            </div>
          )}

          {status === "idle" && spoken.length === 0 && (
            <section className={styles.block}>
              <h2 className={styles.h2}>Topic</h2>
              <textarea
                className={styles.textarea}
                rows={2}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                aria-label="Topic"
              />
              <div className={styles.row}>
                <select
                  aria-label="Preset topics"
                  value=""
                  onChange={(e) => e.target.value && setTopic(e.target.value)}
                >
                  <option value="">Pick a preset…</option>
                  {TOPICS.map((t) => (
                    <option key={t.id} value={t.prompt}>
                      {t.prompt}
                    </option>
                  ))}
                </select>
              </div>
              <p className={styles.hint}>
                The AI waits for you and understands anything, which a real
                interviewer won't. Talk to people a few times a week too and
                bring the recordings to the Speaking Loop.
              </p>
            </section>
          )}

          <div className={styles.row}>
            {status === "live" ? (
              <Button
                variant="secondary"
                onClick={() => conversation.current?.stop()}
              >
                End conversation
              </Button>
            ) : (
              <Button
                disabled={status === "connecting" || !topic.trim()}
                onClick={() => void start()}
              >
                {status === "connecting"
                  ? "Connecting…"
                  : spoken.length
                    ? "Start over"
                    : "Start talking"}
              </Button>
            )}
            {mine.length > 0 && (
              <Button
                variant={status === "live" ? "secondary" : "primary"}
                onClick={analyze}
              >
                Analyze my side
              </Button>
            )}
          </div>
          {status === "live" && (
            <p className={styles.hint}>
              Speak whenever you're ready; pause and the partner answers. A
              quiet minute or hiding the tab ends the session.
            </p>
          )}
        </div>

        <div
          className={styles.logWrap}
          data-empty={spoken.length === 0 || undefined}
        >
          <ol
            ref={logRef}
            className={styles.log}
            aria-live="polite"
            onScroll={onLogScroll}
          >
            {spoken.length === 0 && (
              <li className={styles.logEmpty}>
                The conversation appears here.
              </li>
            )}
            {spoken.map((l) => (
              <li key={`${l.who}-${l.id}`} data-who={l.who}>
                <span className={styles.label}>
                  {l.who === "you" ? "You" : "Partner"}
                </span>
                <p>{l.text}</p>
              </li>
            ))}
          </ol>
          {!pinned && (
            <Button
              size="sm"
              variant="secondary"
              className={styles.jump}
              onClick={jumpToLatest}
            >
              ↓ Jump to latest
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

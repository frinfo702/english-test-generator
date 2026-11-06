import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { VoiceRing } from "voice-ring";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { SectionHeader } from "../../components/layout/SectionHeader";
import { Button } from "../../components/ui/Button";
import { VoiceButton } from "../../components/ui/VoiceButton";
import {
  TRANSCRIBE_API_URL,
  useSpeechRecognition,
} from "../../hooks/useSpeechRecognition";
import { useTimer } from "../../hooks/useTimer";
import { autoScoring, scoreWithGateway } from "../../lib/aiGateway";
import { copyText } from "../../lib/answerSubmission";
import {
  analysisPrompt,
  dueCards,
  loadCards,
  loadSessions,
  measureFluency,
  newCard,
  parseAnalysis,
  RETRY_SECONDS,
  ROUND_SECONDS,
  saveCards,
  saveSession,
  TOPICS,
  type Analysis,
  type Fluency,
  type LoopSession,
} from "../../lib/speakingLoop";
import { transcribeWithWords } from "../../lib/transcribe";
import type { ConversationHandoff } from "./ConversationPage";
import chartStyles from "../../components/ui/ScoreTrendChart.module.css";
import styles from "./SpeakLoop.module.css";

interface Take {
  text: string;
  fluency: Fluency | null;
}

const clock = (s: number) =>
  `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

/** One timed take; keyed by the parent so each round gets a fresh timer. */
function Round({
  seconds,
  label,
  done,
  onDone,
}: {
  seconds: number;
  label: string;
  /** Rounds already taken, for the 4 / 3 / 2 stepper; omitted for a single take. */
  done?: number;
  onDone: (take: Take) => void;
}) {
  const rec = useSpeechRecognition("multi");
  const finishing = useRef(false);
  const [measuring, setMeasuring] = useState(false);
  const finishRef = useRef<() => void>(() => {});
  const timer = useTimer(seconds, () => finishRef.current());

  const finish = async () => {
    // The timer's expiry and the button can both land; take the first.
    if (finishing.current) return;
    finishing.current = true;
    timer.stop();
    const { text, words, audio } = await rec.stop();
    setMeasuring(true);
    onDone({ text, fluency: await measureFluency(text, words, audio) });
  };
  useEffect(() => {
    finishRef.current = () => void finish();
  });

  const state = rec.recording
    ? "recording"
    : rec.processing || measuring
      ? "processing"
      : "idle";

  return (
    <section className={`${styles.panel} ${styles.stage}`}>
      {done != null && (
        <ol className={styles.steps} aria-label="Rounds">
          {ROUND_SECONDS.map((s, i) => (
            <li
              key={s}
              className="tnum"
              data-step={i < done ? "done" : i === done ? "current" : "next"}
            >
              {clock(s)}
            </li>
          ))}
        </ol>
      )}
      <p className={styles.label}>{label}</p>
      <VoiceRing
        size={180}
        state={state === "recording" ? "listening" : state}
        level={state === "recording" ? Math.max(0, ...rec.levels) : 0}
        aria-hidden
      />
      <p className={`${styles.clock} tnum`}>{clock(timer.seconds)}</p>
      <div
        className={styles.timeBar}
        style={{ "--left": timer.seconds / seconds } as React.CSSProperties}
        aria-hidden
      />
      <p className={styles.hint}>
        Stuck? Say that part in Japanese and keep going. Those gaps are what
        you'll learn.
      </p>
      {rec.error && <p className="notice-error">{rec.error}</p>}
      <VoiceButton
        state={state}
        levels={rec.levels}
        disabled={state === "processing"}
        label={
          state === "recording"
            ? "Finish early"
            : state === "processing"
              ? "Transcribing…"
              : "Start speaking"
        }
        onPress={() => {
          if (rec.recording) void finish();
          else {
            void rec.start();
            timer.start();
          }
        }}
      />
    </section>
  );
}

function fmt(n: number | null | undefined, digits = 1) {
  return n == null ? "—" : n.toFixed(digits);
}

function FluencyTable({ rows }: { rows: [string, Fluency | null][] }) {
  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th />
          <th>Syllables / s</th>
          <th>Mean run</th>
          <th>Pauses / min</th>
          <th>Mid-clause pauses</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([name, f]) => (
          <tr key={name}>
            <th>{name}</th>
            <td className="tnum">{fmt(f?.syllablesPerSecond, 2)}</td>
            <td className="tnum">{fmt(f?.meanLengthOfRun)}</td>
            <td className="tnum">{fmt(f?.pausesPerMinute)}</td>
            <td className="tnum">
              {f?.midClausePauseShare == null
                ? "—"
                : `${Math.round(f.midClausePauseShare * 100)}%`}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function History({ sessions }: { sessions: LoopSession[] }) {
  const data = sessions
    .filter((s) => s.rounds[0])
    .map((s) => ({
      date: s.date.slice(5, 10),
      run: Number(s.rounds[0]!.meanLengthOfRun.toFixed(1)),
      rate: Number(s.rounds[0]!.syllablesPerSecond.toFixed(2)),
    }));
  if (data.length === 0) return null;
  return (
    <section className={styles.block}>
      <h2 className={styles.h2}>Mean length of run, first round</h2>
      <p className={styles.hint}>
        Syllables between pauses. The clearest gap between intermediate and
        native speech, and the number that should climb.
      </p>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data} margin={{ top: 8, right: 8, left: -16 }}>
          <CartesianGrid stroke="var(--color-border-soft)" vertical={false} />
          <XAxis
            dataKey="date"
            fontSize={12}
            stroke="var(--color-ink-tertiary)"
          />
          <YAxis fontSize={12} stroke="var(--color-ink-tertiary)" />
          {/* Recharts' default tooltip is hard-coded white, unreadable in dark mode. */}
          <Tooltip
            cursor={{ stroke: "var(--color-border-strong)", strokeWidth: 1 }}
            isAnimationActive={false}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const p = payload[0].payload as (typeof data)[number];
              return (
                <div className={chartStyles.tooltip}>
                  <p className={chartStyles.tooltipDate}>{p.date}</p>
                  <p className={chartStyles.tooltipRow}>
                    <span>Mean run</span>
                    <span className={chartStyles.tooltipValue}>{p.run}</span>
                  </p>
                  <p className={chartStyles.tooltipRow}>
                    <span>Syllables / s</span>
                    <span className={chartStyles.tooltipValue}>{p.rate}</span>
                  </p>
                </div>
              );
            }}
          />
          <Line
            type="monotone"
            dataKey="run"
            name="Mean run"
            stroke="var(--color-ink)"
            strokeWidth={2}
            dot={{ r: 3, fill: "var(--color-surface)", strokeWidth: 2 }}
            activeDot={{
              r: 5,
              fill: "var(--color-surface)",
              stroke: "var(--color-ink)",
              strokeWidth: 2,
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </section>
  );
}

function Shadow({ text }: { text: string }) {
  const [rate, setRate] = useState(0.9);
  const [speaking, setSpeaking] = useState(false);
  useEffect(() => () => speechSynthesis.cancel(), []);
  const play = () => {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US";
    u.rate = rate;
    u.onend = u.onerror = () => setSpeaking(false);
    setSpeaking(true);
    speechSynthesis.speak(u);
  };
  return (
    <div className={styles.row}>
      <Button
        variant="secondary"
        onClick={() => {
          if (speaking) {
            speechSynthesis.cancel();
            setSpeaking(false);
          } else play();
        }}
      >
        {speaking ? "Stop" : "Play for shadowing"}
      </Button>
      <label className={styles.hint}>
        Speed{" "}
        <select value={rate} onChange={(e) => setRate(Number(e.target.value))}>
          {[0.7, 0.8, 0.9, 1, 1.1].map((r) => (
            <option key={r} value={r}>
              {r}×
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

/** Native <dialog>: Esc, focus trap and backdrop come free. */
function FourThreeTwoHelp() {
  const ref = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button
        type="button"
        className={styles.helpButton}
        aria-label="What is 4 / 3 / 2?"
        onClick={() => ref.current?.showModal()}
      >
        ?
      </button>
      <dialog
        ref={ref}
        className={styles.dialog}
        aria-labelledby="help-432-title"
        // A click on the backdrop lands on the dialog itself.
        onClick={(e) => e.target === e.currentTarget && ref.current?.close()}
      >
        <h2 id="help-432-title" className={styles.h2}>
          What is 4 / 3 / 2?
        </h2>
        <p>
          You give the same talk three times, with less time each round:{" "}
          <strong>4 min → 3 min → 2 min</strong>. The method comes from the
          linguist Paul Nation.
        </p>

        <h3 className={styles.kind}>Why it works</h3>
        <ul className={styles.plan}>
          <li>
            The first round settles what you say. From the second round on, you
            only have to think about how you say it.
          </li>
          <li>
            With less time, you have to say the same content faster and without
            stopping. Repeat that, and more phrases come out without thinking.
          </li>
        </ul>

        <h3 className={styles.kind}>How it goes</h3>
        <ol className={styles.plan}>
          <li>Pick a topic.</li>
          <li>Talk for 4 minutes.</li>
          <li>
            Give the same talk in 3 minutes. Keep all of it; just go faster.
          </li>
          <li>Give it again in 2 minutes.</li>
          <li>
            Analysis: an AI rewrites what you meant in natural English and picks
            out the phrases you were missing.
          </li>
          <li>
            Add those phrases to your cards, then talk once more for 2 minutes.
          </li>
        </ol>

        <h3 className={styles.kind}>Tips</h3>
        <ul className={styles.plan}>
          <li>
            Stuck? Say that part in Japanese and keep going. Those gaps become
            the phrases you learn next.
          </li>
          <li>
            Each round, talk as if to someone hearing it for the first time.
          </li>
          <li>Don't write a script.</li>
        </ul>

        <p className={styles.hint}>
          &ldquo;Mean run&rdquo; under Fluency is how many syllables you get out
          between pauses. When it climbs, you&rsquo;re getting more fluent.
        </p>

        <form method="dialog" className={styles.row}>
          <Button type="submit">Got it</Button>
        </form>
      </dialog>
    </>
  );
}

type Phase = "pick" | "rounds" | "analysis" | "retry" | "done";

export function SpeakLoopPage() {
  // A conversation hands over its log; there's no fluency to measure in it,
  // since the pauses include listening to the partner.
  const handoff = useLocation().state as ConversationHandoff | null;
  const [phase, setPhase] = useState<Phase>(handoff ? "analysis" : "pick");
  const [topic, setTopic] = useState(handoff?.topic ?? TOPICS[0].prompt);
  const [takes, setTakes] = useState<Take[]>(
    handoff ? [{ text: handoff.transcript, fluency: null }] : [],
  );
  const [retry, setRetry] = useState<Take | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [pasted, setPasted] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [picked, setPicked] = useState<boolean[]>([]);
  const [savedCards, setSavedCards] = useState(0);
  const [sessionId] = useState(() => crypto.randomUUID());
  const [sessions, setSessions] = useState(loadSessions);
  const due = dueCards(loadCards(), new Date()).length;
  const navigate = useNavigate();

  const transcript = takes[0]?.text ?? "";
  const prompt = analysisPrompt(topic, transcript);

  const persist = (patch: Partial<LoopSession>, base = takes) => {
    saveSession({
      id: sessionId,
      date: new Date().toISOString(),
      topic,
      rounds: base.map((t) => t.fluency),
      transcript: base[0]?.text ?? "",
      natural: analysis?.natural,
      retry: retry?.fluency,
      ...patch,
    });
    setSessions(loadSessions());
  };

  const accept = (reply: string) => {
    const a = parseAnalysis(reply);
    setAnalysis(a);
    setPicked(a.chunks.map(() => true));
    persist({ natural: a.natural });
  };

  const analyze = async (base: Take[]) => {
    setPhase("analysis");
    persist({}, base);
    const ai = autoScoring();
    if (!ai || !base[0]?.text.trim()) return;
    setBusy(true);
    setError(null);
    try {
      accept(await scoreWithGateway(analysisPrompt(topic, base[0].text), ai));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const handedOff = useRef(false);
  useEffect(() => {
    if (!handoff || handedOff.current) return;
    handedOff.current = true;
    void analyze(takes);
    // Once, for the log the page opened with.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const importFile = async (file: File) => {
    setBusy(true);
    setError(null);
    try {
      const { text, words } = await transcribeWithWords(
        file,
        TRANSCRIBE_API_URL,
        undefined,
        "multi",
      );
      const take = { text, fluency: await measureFluency(text, words, file) };
      setTakes([take]);
      setBusy(false);
      await analyze([take]);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  };

  const addCards = () => {
    if (!analysis) return;
    const now = new Date();
    const fresh = analysis.chunks
      .filter((_, i) => picked[i])
      .map((c) => newCard(c, topic, now));
    saveCards([...loadCards(), ...fresh]);
    setSavedCards(fresh.length);
    toast.success(
      `Added ${fresh.length} ${fresh.length === 1 ? "card" : "cards"}`,
      { action: { label: "Open", onClick: () => navigate("/speak/cards") } },
    );
  };

  const copyPrompt = async (text: string) => {
    try {
      if (await copyText(text)) toast.success("Prompt copied");
      else toast.error("Clipboard isn't available here");
    } catch {
      toast.error("Couldn't copy the prompt");
    }
  };

  return (
    <div className="page-narrow">
      <SectionHeader
        title="Speaking Loop"
        subtitle="Speak, find the gaps, drill them until they come out without thinking."
        backTo="/"
        actions={
          <Link to="/speak/cards" className="editorial-link">
            Chunk cards{due > 0 ? ` · ${due} due` : ""}
          </Link>
        }
      />
      {error && <p className="notice-error">{error}</p>}

      {phase === "pick" && (
        <>
          <section className={styles.block}>
            <h2 className={styles.h2}>Topic</h2>
            <div className={styles.topics}>
              {TOPICS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={styles.topic}
                  aria-pressed={topic === t.prompt}
                  onClick={() => setTopic(t.prompt)}
                >
                  <span className={styles.kind}>{t.kind}</span>
                  {t.prompt}
                </button>
              ))}
            </div>
            <label className={styles.kind} htmlFor="loop-topic">
              Or write your own
            </label>
            <textarea
              id="loop-topic"
              className={styles.textarea}
              rows={2}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
            <div className={styles.row}>
              <Button
                disabled={!topic.trim() || busy}
                onClick={() => setPhase("rounds")}
              >
                Start 4 / 3 / 2
              </Button>
              <FourThreeTwoHelp />
              <Button
                variant="secondary"
                onClick={() => navigate("/speak/talk")}
              >
                Talk with an AI partner
              </Button>
              <label
                className={styles.fileButton}
                aria-disabled={busy || undefined}
              >
                {busy ? "Transcribing…" : "Analyze a recording"}
                <input
                  type="file"
                  accept="audio/*"
                  disabled={busy}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void importFile(f);
                  }}
                />
              </label>
            </div>
            <p className={styles.hint}>
              A recording can be an online lesson or a conversation with a
              person.
            </p>
          </section>

          <section className={styles.block}>
            <h2 className={styles.h2}>A day's practice, 60–75 minutes</h2>
            <ol className={styles.plan}>
              <li>15 min: review yesterday's chunk cards out loud.</li>
              <li>30 min: one topic at 4 / 3 / 2, analyze, speak it again.</li>
              <li>15 min: shadow that session's natural version.</li>
              <li>
                If there's time: talk with a person or an AI, and bring the
                recording here.
              </li>
            </ol>
          </section>
          <History sessions={sessions} />
        </>
      )}

      {phase !== "pick" && (
        <p className={styles.topicLine}>
          <span className={styles.label}>Topic</span> {topic}
        </p>
      )}

      {phase === "rounds" && (
        <Round
          key={takes.length}
          seconds={ROUND_SECONDS[takes.length]}
          done={takes.length}
          label={`Round ${takes.length + 1} of ${ROUND_SECONDS.length} · same talk, less time`}
          onDone={(take) => {
            const next = [...takes, take];
            setTakes(next);
            if (next.length === ROUND_SECONDS.length) void analyze(next);
          }}
        />
      )}
      {phase === "rounds" && takes.length > 0 && (
        <Button variant="ghost" onClick={() => void analyze(takes)}>
          Skip to analysis
        </Button>
      )}

      {(phase === "analysis" || phase === "retry" || phase === "done") && (
        <>
          <div className={styles.compare}>
            <section className={styles.card}>
              <h2 className={styles.kind}>What you said</h2>
              <p className={styles.transcript}>
                {transcript || "(nothing recognized)"}
              </p>
            </section>
            {analysis && (
              <section className={`${styles.card} ${styles.cardStrong}`}>
                <h2 className={styles.kind}>
                  What you meant, in natural English
                </h2>
                <p className={styles.natural}>{analysis.natural}</p>
                <Shadow text={analysis.natural} />
              </section>
            )}
          </div>

          {!analysis && busy && <p className={styles.hint}>Analyzing…</p>}
          {!analysis && !busy && (
            <section className={styles.block}>
              <h2 className={styles.h2}>Get the natural version</h2>
              <p className={styles.hint}>
                Paste this into any assistant and paste its reply below, or add
                an AI Gateway key in <Link to="/settings">Settings</Link> to
                skip this step.
              </p>
              <div className={styles.row}>
                <Button
                  variant="secondary"
                  onClick={() => void copyPrompt(prompt)}
                >
                  Copy prompt
                </Button>
                {autoScoring() && (
                  <Button
                    variant="secondary"
                    onClick={() => void analyze(takes)}
                  >
                    Retry with AI Gateway
                  </Button>
                )}
              </div>
              <textarea
                className={styles.textarea}
                rows={5}
                value={pasted}
                onChange={(e) => setPasted(e.target.value)}
                placeholder="Paste the reply here"
                aria-label="Assistant reply"
              />
              <Button
                disabled={!pasted.trim()}
                onClick={() => {
                  try {
                    setError(null);
                    accept(pasted);
                  } catch (e) {
                    setError(e instanceof Error ? e.message : String(e));
                  }
                }}
              >
                Read reply
              </Button>
            </section>
          )}

          {analysis && (
            <>
              <section className={styles.block}>
                <h2 className={styles.h2}>Chunks to make automatic</h2>
                <p className={styles.hint}>
                  Pick the ones to drill as spoken cards.
                </p>
                <ul className={styles.chunks}>
                  {analysis.chunks.map((c, i) => (
                    <li key={i}>
                      <label className={styles.chunk}>
                        <input
                          type="checkbox"
                          checked={picked[i] ?? false}
                          onChange={(e) =>
                            setPicked((p) =>
                              p.map((v, j) => (j === i ? e.target.checked : v)),
                            )
                          }
                        />
                        <span className={styles.chunkBody}>
                          <span className={styles.pill}>{c.kind}</span>
                          <strong className={styles.chunkText}>
                            {c.chunk}
                          </strong>
                          <span className={styles.hint}>{c.intent}</span>
                          <em className={styles.example}>{c.example}</em>
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
                {savedCards ? (
                  <Button disabled>Added to chunk cards</Button>
                ) : (
                  <Button disabled={!picked.some(Boolean)} onClick={addCards}>
                    Add {picked.filter(Boolean).length} to chunk cards
                  </Button>
                )}
              </section>
            </>
          )}

          {phase === "analysis" && takes.length > 0 && (
            <section className={styles.block}>
              <h2 className={styles.h2}>Speak it again</h2>
              <p className={styles.hint}>
                Same topic, {clock(RETRY_SECONDS)}. Reach for the chunks above.
              </p>
              <div className={styles.row}>
                <Button
                  variant={analysis ? "primary" : "secondary"}
                  onClick={() => setPhase("retry")}
                >
                  Start the retry
                </Button>
              </div>
            </section>
          )}
          {phase === "retry" && (
            <Round
              seconds={RETRY_SECONDS}
              label="Same topic, once more. Use the chunks."
              onDone={(take) => {
                setRetry(take);
                persist({ retry: take.fluency });
                setPhase("done");
              }}
            />
          )}

          {[...takes, retry].some((t) => t?.fluency) && (
            <section className={styles.block}>
              <h2 className={styles.h2}>Fluency</h2>
              <FluencyTable
                rows={[
                  ...takes.map((t, i): [string, Fluency | null] => [
                    takes.length > 1 ? `Round ${i + 1}` : "Recording",
                    t.fluency,
                  ]),
                  ...(retry
                    ? [["Again", retry.fluency] as [string, Fluency | null]]
                    : []),
                ]}
              />
            </section>
          )}
        </>
      )}
    </div>
  );
}

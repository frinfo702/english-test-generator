import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PixelArt } from "../../components/pixel/PixelArt";
import { Button } from "../../components/ui/Button";
import { getAllAttempts, saveAttempt, type Attempt } from "../../lib/attempts";
import {
  TRIAL_SECTIONS,
  TRIAL_TASK_ID,
  buildTrialPlan,
  modeMinutes,
  type TrialMode,
} from "../../lib/trial";
import { TASK_NAMES } from "./taskNames";
import styles from "./Trial.module.css";

const MODES: { mode: TrialMode; label: string; contents: string }[] = [
  {
    mode: "full",
    label: "Full test",
    contents: "All four sections in test-day order",
  },
  ...TRIAL_SECTIONS.map((s) => ({
    mode: s.key,
    label: s.label,
    contents:
      (s.adaptive ? "Two adaptive modules · " : "") +
      s.tasks.map((t) => TASK_NAMES[t.taskId]).join(", "),
  })),
];

const CHECKLIST = [
  ["Microphone", "Speaking records you; check it on the first speaking task."],
  ["Time", "Sections are timed and keep running if you leave the page."],
  [
    "AI chat",
    "Writing and Interview answers are scored at the end by pasting a prompt into your AI chat.",
  ],
] as const;

// 12×12 grids like the other pixel controls: a ring, and the dot that
// marks the chosen test.
// prettier-ignore
const RADIO_RING = [
  "....xxxx",
  "..xx....xx",
  ".x........x",
  ".x........x",
  "x..........x",
  "x..........x",
  "x..........x",
  "x..........x",
  ".x........x",
  ".x........x",
  "..xx....xx",
  "....xxxx",
];
// prettier-ignore
const RADIO_DOT = ["", "", "", "....dddd", "...dddddd", "...dddddd", "...dddddd", "...dddddd", "....dddd"];

function PixelRadio({ on }: { on: boolean }) {
  return (
    <PixelArt
      layers={on ? [RADIO_RING, RADIO_DOT] : [RADIO_RING]}
      palette={{ x: "currentColor", d: "var(--color-accent)" }}
      width={12}
      height={12}
      className={styles.modeRadio}
    />
  );
}

export function TrialHomePage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<TrialMode>("full");
  const [attempts, setAttempts] = useState<Attempt[] | null>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAllAttempts().then(setAttempts, () => setAttempts([]));
  }, []);

  const start = async () => {
    setStarting(true);
    setError(null);
    try {
      const items = await buildTrialPlan(mode, attempts ?? []);
      if (items.length === 0) throw new Error("No questions are available.");
      const saved = await saveAttempt({
        taskId: TRIAL_TASK_ID,
        responses: [],
        trial: { mode, items, sectionStarts: {} },
      });
      navigate(`/trial/${saved.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStarting(false);
    }
  };

  return (
    <div className={styles.home}>
      <header className={styles.homeHeader}>
        <h1 className={styles.homeTitle}>Practice Test</h1>
        <p className={styles.lede}>
          A timed TOEFL iBT run with answers hidden until the end, scored on the
          1–6 band scale.
        </p>
      </header>

      <section aria-labelledby="choose-test" className={styles.block}>
        <h2 id="choose-test" className={styles.blockHeading}>
          Choose a test
        </h2>
        <div role="radiogroup" aria-labelledby="choose-test">
          {MODES.map((m) => (
            <button
              key={m.mode}
              type="button"
              role="radio"
              aria-checked={mode === m.mode}
              className={[
                styles.modeRow,
                mode === m.mode ? styles.modeRowOn : "",
              ].join(" ")}
              onClick={() => setMode(m.mode)}
            >
              <PixelRadio on={mode === m.mode} />
              <span className={styles.modeName}>{m.label}</span>
              <span className={styles.modeContents}>{m.contents}</span>
              <span className={styles.modeTime}>{modeMinutes(m.mode)} min</span>
            </button>
          ))}
        </div>

        <dl className={styles.checklist}>
          {CHECKLIST.map(([term, detail]) => (
            <div key={term}>
              <dt>{term}</dt>
              <dd>{detail}</dd>
            </div>
          ))}
        </dl>

        <div className={styles.startRow}>
          <Button
            size="lg"
            onClick={() => void start()}
            disabled={starting || attempts === null}
          >
            {starting ? "Preparing…" : "Start"}
          </Button>
          <p className={styles.note}>
            Questions you haven't solved come first, then the ones you saw
            longest ago.
          </p>
        </div>
        {error && <p className={styles.error}>{error}</p>}
      </section>
    </div>
  );
}
